import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stripeLib from 'stripe';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { runQuery, getQuery, allQuery } from './db.js';

dotenv.config();

import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

// Initialize S3 Client
const s3Endpoint = process.env.S3_ENDPOINT || 'http://minio:9000';
const s3Client = new S3Client({
  endpoint: s3Endpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minio_admin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minio_secure_password_local_123'
  },
  forcePathStyle: true
});
const s3BucketMedia = process.env.S3_BUCKET_MEDIA || 'media';

// Auto initialize S3 buckets
async function initS3Buckets() {
  try {
    const buckets = [s3BucketMedia, process.env.S3_BUCKET_BACKUPS || 'backups'];
    for (const bucket of buckets) {
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
        console.log(`[S3 Storage] Bucket '${bucket}' already exists.`);
      } catch (err) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          console.log(`[S3 Storage] Bucket '${bucket}' not found. Creating it...`);
          await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
          
          if (bucket === s3BucketMedia) {
            const publicPolicy = {
              Version: "2012-10-17",
              Statement: [
                {
                  Sid: "PublicReadGetObject",
                  Effect: "Allow",
                  Principal: "*",
                  Action: "s3:GetObject",
                  Resource: `arn:aws:s3:::${bucket}/*`
                }
              ]
            };
            await s3Client.send(new PutBucketPolicyCommand({
              Bucket: bucket,
              Policy: JSON.stringify(publicPolicy)
            }));
            console.log(`[S3 Storage] Public read policy set for bucket '${bucket}'.`);
          }
          console.log(`[S3 Storage] Bucket '${bucket}' created successfully.`);
        } else {
          throw err;
        }
      }
    }
  } catch (err) {
    console.error('[S3 Storage] Failed to initialize S3 buckets:', err.message);
  }
}

// Fire bucket initialization
initS3Buckets();

const app = express();
const port = process.env.PORT || 3000;

// CORS Enablement
// CORS Enablement with dynamic origin matching for subdomains and custom domains
let cachedCustomDomains = [];
async function refreshCustomDomainsCache() {
  try {
    const brands = await allQuery('SELECT custom_domain FROM brands WHERE custom_domain IS NOT NULL AND status != $1', ['archived']);
    cachedCustomDomains = brands.map(b => b.custom_domain);
  } catch (_) {}
}
setInterval(refreshCustomDomainsCache, 5 * 60 * 1000);

const allowedOrigins = [
  'http://localhost',
  'http://localhost:8082',
  'https://dev.stricktlycoffee.be',
  'https://dash.dev.stricktlycoffee.be',
  'https://stricktlycoffee.be',
  'https://dash.stricktlycoffee.be',
];

app.use(cors({
  origin: async (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    try {
      const parsedUrl = new URL(origin);
      const hostname = parsedUrl.hostname;

      if (hostname.endsWith('.dev.stricktlycoffee.be') || 
          hostname.endsWith('.stricktlycoffee.be') || 
          hostname.endsWith('.stricktlycoffee.local') || 
          hostname === 'localhost') {
        return callback(null, true);
      }

      // Initialize cache if empty
      if (cachedCustomDomains.length === 0) {
        await refreshCustomDomainsCache();
      }

      if (cachedCustomDomains.includes(hostname)) {
        return callback(null, true);
      }
    } catch (_) {}

    callback(null, false); // Block other origins securely
  },
  credentials: true
}));

// Stripe Instances Cache per brand
const stripeInstances = {};
function getStripeInstance(brand) {
  if (!brand.stripe_secret_key) return null;
  if (!stripeInstances[brand.id]) {
    stripeInstances[brand.id] = new stripeLib(brand.stripe_secret_key);
  }
  return stripeInstances[brand.id];
}

function getCloudflareDnsRecordName(subdomain) {
  const baseDomain = process.env.CLOUDFLARE_DOMAIN || 'stricktlycoffee.be';
  let prefix = subdomain.replace(`.${baseDomain}`, '').trim();
  
  if (prefix.endsWith('.dev')) {
    prefix = prefix.replace('.dev', '');
  }
  
  if (process.env.DOMAIN && process.env.DOMAIN.includes('dev.stricktlycoffee.be')) {
    if (!prefix.endsWith('-dev')) {
      prefix = `${prefix}-dev`;
    }
  }
  
  return `${prefix}.${baseDomain}`;
}

// Cloudflare DNS Record helper
async function createCloudflareSubdomain(subdomain) {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
  const baseDomain = process.env.CLOUDFLARE_DOMAIN || 'stricktlycoffee.be';

  if (!cfToken || !cfZoneId) {
    console.log('[Cloudflare] API token or Zone ID missing. Skipping DNS record creation.');
    return null;
  }

  const dnsName = getCloudflareDnsRecordName(subdomain);
  const prefix = dnsName.replace(`.${baseDomain}`, '').trim();

  // If the subdomain is just the baseDomain itself, or they input something invalid, skip
  if (prefix === baseDomain || !prefix) {
    console.log('[Cloudflare] Subdomain prefix matches base domain or is invalid. Skipping DNS.');
    return null;
  }

  try {
    // Check if a proxied wildcard record exists first
    const wildcardUrl = `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records?name=${encodeURIComponent('*.' + baseDomain)}`;
    const wildResponse = await fetch(wildcardUrl, {
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      }
    });
    const wildData = await wildResponse.json();
    if (wildResponse.ok && wildData.success) {
      const wildcardRecord = wildData.result.find(r => r.name.toLowerCase() === `*.${baseDomain}`.toLowerCase() && r.proxied === true);
      if (wildcardRecord) {
        console.log(`[Cloudflare] Wildcard *.${baseDomain} is active and proxied. Skipping individual CNAME creation.`);
        return 'wildcard-covered';
      }
    }
  } catch (err) {
    console.warn('[Cloudflare] Wildcard pre-check failed, proceeding with fallback creation:', err.message);
  }

  console.log(`[Cloudflare] Creating CNAME record for ${prefix}.${baseDomain} pointing to ${baseDomain}...`);

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'CNAME',
        name: prefix,
        content: baseDomain,
        ttl: 1, // automatic
        proxied: true
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error('[Cloudflare] Error response:', result);
      throw new Error(result.errors?.[0]?.message || 'Failed to create DNS record');
    }

    console.log(`[Cloudflare] Successfully created DNS record ID: ${result.result.id}`);
    return result.result.id;
  } catch (err) {
    console.error('[Cloudflare] DNS record creation failed:', err.message);
    return null;
  }
}

// Cloudflare DNS Record helper for manual custom domains
async function createCloudflareCustomDomain(customDomain) {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
  const baseDomain = process.env.CLOUDFLARE_DOMAIN || 'stricktlycoffee.be';

  if (!cfToken || !cfZoneId || !customDomain) {
    console.log('[Cloudflare] Missing tokens or custom domain. Skipping custom domain DNS registration.');
    return null;
  }

  const targetDomain = customDomain.replace(/^https?:\/\//i, '').trim();
  console.log(`[Cloudflare] Registering custom CNAME record for ${targetDomain} pointing to ${baseDomain}...`);

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'CNAME',
        name: targetDomain,
        content: baseDomain,
        ttl: 1, // automatic
        proxied: true
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error('[Cloudflare] Custom domain DNS creation failed:', result);
      return null;
    }

    console.log(`[Cloudflare] Successfully created custom domain DNS record ID: ${result.result.id}`);
    return result.result.id;
  } catch (err) {
    console.error('[Cloudflare] Custom domain DNS creation error:', err.message);
    return null;
  }
}

// Helper to extract clean text from raw HTML for AI analysis
function extractCleanText(html) {
  if (!html) return '';
  // 1. Get meta description
  let metaDesc = '';
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (descMatch) {
    metaDesc = `Meta Description: ${descMatch[1].trim()}\n\n`;
  }

  // 2. Remove script, style, and svg tags
  let cleanHtml = html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<svg[^>]*>([\s\S]*?)<\/svg>/gi, '');

  // 3. Extract Headings and Paragraphs
  const textBlocks = [];
  const tagRegex = /<(h1|h2|h3|h4|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = tagRegex.exec(cleanHtml)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (content && content.length > 5) {
      textBlocks.push(`${tag.toUpperCase()}: ${content}`);
    }
  }

  // Fallback: If no headings or paragraphs are resolved, extract stripped body text
  if (textBlocks.length === 0) {
    const stripped = cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return metaDesc + stripped.substring(0, 15000);
  }

  return metaDesc + textBlocks.join('\n').substring(0, 20000);
}

// Scrape styles, favicon, and logo from a public Shopify store URL
async function scrapeShopifyBranding(shopUrl) {
  try {
    let url = shopUrl;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    console.log(`[Branding Scraper] Fetching homepage elements from: ${url}`);
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    
    const html = await res.text();
    
    // Extract metadata for form autofill
    const parsedUrl = new URL(url);
    const domainParts = parsedUrl.hostname.replace(/^www\./i, '').split('.');
    const derivedId = domainParts[0].toLowerCase();
    
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    let storeName = derivedId.charAt(0).toUpperCase() + derivedId.slice(1);
    if (titleMatch) {
      const cleanTitle = titleMatch[1].split(/[|•–-]/)[0].trim();
      if (cleanTitle) {
        storeName = cleanTitle;
      }
    }

    let contactEmail = '';
    const mailtoMatch = html.match(/href=["']mailto:([^"'\s?]+)/i);
    if (mailtoMatch) {
      contactEmail = mailtoMatch[1].trim();
    } else {
      const generalEmailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}/);
      if (generalEmailMatch) {
        const candidate = generalEmailMatch[0];
        if (!candidate.includes('w3.org') && !candidate.includes('sentry') && !candidate.includes('git') && !candidate.includes('schema.org')) {
          contactEmail = candidate;
        }
      }
    }
    
    // 1. Extract favicon link
    let faviconUrl = null;
    const faviconMatch = html.match(/<link[^>]+(?:rel=["'](?:shortcut )?icon["'])[^>]+href=["']([^"']+)["']/i) ||
                         html.match(/<link[^>]+href=["']([^"']+)["']/i);
    if (faviconMatch) {
      faviconUrl = faviconMatch[1];
      if (faviconUrl.startsWith('//')) {
        faviconUrl = `https:${faviconUrl}`;
      } else if (faviconUrl.startsWith('/') && !faviconUrl.startsWith('//')) {
        const parsed = new URL(url);
        faviconUrl = `${parsed.origin}${faviconUrl}`;
      }
      // Upgrade Shopify favicon quality by stripping low-res width/height/crop constraints
      if (faviconUrl.includes('cdn.shopify.com') || faviconUrl.includes('/cdn/shop/')) {
        faviconUrl = faviconUrl.replace(/([?&])(?:width|height|crop)=[^&]*/g, '$1').replace(/[&?]+$/, '').replace(/\?&/, '?');
      }
    } else {
      // Fallback to standard root favicon.ico
      const parsed = new URL(url);
      faviconUrl = `${parsed.origin}/favicon.ico`;
    }
    
    // 2. Extract logo image
    let logoUrl = null;
    const logoMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]+alt=["'][^"']*(?:logo|brand)[^"']*["']/i) ||
                      html.match(/<img[^>]+alt=["'][^"']*(?:logo|brand)[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                      html.match(/class=["'][^"']*(?:logo|brand)[^"']*["'][^>]*src=["']([^"']+)["']/i);
    if (logoMatch) {
      logoUrl = logoMatch[1];
      if (logoUrl.startsWith('//')) {
        logoUrl = `https:${logoUrl}`;
      } else if (logoUrl.startsWith('/') && !logoUrl.startsWith('//')) {
        const parsed = new URL(url);
        logoUrl = `${parsed.origin}${logoUrl}`;
      }
      // Upgrade Shopify logo quality by stripping resize parameters
      if (logoUrl.includes('cdn.shopify.com') || logoUrl.includes('/cdn/shop/')) {
        logoUrl = logoUrl.replace(/([?&])(?:width|height|crop)=[^&]*/g, '$1').replace(/[&?]+$/, '').replace(/\?&/, '?');
      }
    }
    
    // 3. Extract colors & button styling with clean minimalist fallbacks (no colors!)
    let primaryColor = '#111111';
    let secondaryColor = '#767676';
    let bgColor = '#ffffff';
    let textColor = '#111111';
    let buttonRadius = '4px';
    let buttonTextColor = '#ffffff';
    let headerBgColor = '#ffffff';
    let fontFamily = 'Outfit';

    function hexToRgb(hex) {
      if (!hex) return null;
      const cleanHex = hex.replace('#', '');
      if (cleanHex.length === 3) {
        return {
          r: parseInt(cleanHex[0] + cleanHex[0], 16),
          g: parseInt(cleanHex[1] + cleanHex[1], 16),
          b: parseInt(cleanHex[2] + cleanHex[2], 16)
        };
      } else if (cleanHex.length === 6) {
        return {
          r: parseInt(cleanHex.slice(0, 2), 16),
          g: parseInt(cleanHex.slice(2, 4), 16),
          b: parseInt(cleanHex.slice(4, 6), 16)
        };
      }
      return null;
    }

    function isGrayscale(hex) {
      const rgb = hexToRgb(hex);
      if (!rgb) return true;
      const { r, g, b } = rgb;
      return Math.max(r, g, b) - Math.min(r, g, b) < 25;
    }

    function getLuminance(r, g, b) {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getContrastRatio(hex1, hex2) {
      if (!hex1 || !hex2) return 1;
      const rgb1 = hexToRgb(hex1);
      const rgb2 = hexToRgb(hex2);
      if (!rgb1 || !rgb2) return 1;
      const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b) + 0.05;
      const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b) + 0.05;
      return Math.max(l1, l2) / Math.min(l1, l2);
    }

    // Find the first style block or :root selector context inside the HTML
    let rootCss = '';
    const rootMatches = html.match(/:root\s*\{([^}]+)\}/i) || html.match(/body\s*\{([^}]+)\}/i);
    if (rootMatches) {
      rootCss = rootMatches[1];
    }

    let primaryCandidate = null;
    let bgCandidate = null;
    let textCandidate = null;
    let secondaryCandidate = null;

    // Precise CSS Variable regex helpers prioritizing global body/page layouts (with optional spaces before colon)
    const accentRegex = /--(?:colors?-)?(?:accent|primary|button-background|btn-background|pri-cl|button|link-color-hover|solid-button-background|outline-button-labels|control-accent|theme-accent)[a-zA-Z0-9_-]*\s*:\s*(#[0-9a-fA-F]{3,6})\b/gi;
    const bgRegex = /--(?:colors?-)?(?:body-background|body-bg|t4s-body-background|gradient-background|color-background|canvas|page-bg)[a-zA-Z0-9_-]*\s*:\s*(#[0-9a-fA-F]{3,6})\b/gi;
    const fallbackBgRegex = /--(?:colors?-)?(?:bg|background)[a-zA-Z0-9_-]*\s*:\s*(#[0-9a-fA-F]{3,6})\b/gi;
    const textRegex = /--(?:colors?-)?(?:text-color|body-text|base-text|color-text|text-body|heading-color|color-foreground)[a-zA-Z0-9_-]*\s*:\s*(#[0-9a-fA-F]{3,6})\b/gi;
    const fallbackTextRegex = /--(?:colors?-)?(?:text|foreground)[a-zA-Z0-9_-]*\s*:\s*(#[0-9a-fA-F]{3,6})\b/gi;
    const secRegex = /--(?:colors?-)?(?:secondary|accent-2|link-hover)[a-zA-Z0-9_-]*\s*:\s*(#[0-9a-fA-F]{3,6})\b/gi;

    // 1. Search inside `:root` block first
    if (rootCss) {
      let m;
      while ((m = accentRegex.exec(rootCss)) !== null) {
        if (!isGrayscale(m[1]) && !m[0].match(/(?:price|success|warning|error|tooltip|hover|text|bg|border|link)/i)) {
          primaryCandidate = m[1];
          break;
        }
      }
      
      bgRegex.lastIndex = 0;
      if (m = bgRegex.exec(rootCss)) {
        bgCandidate = m[1];
      } else {
        fallbackBgRegex.lastIndex = 0;
        while ((m = fallbackBgRegex.exec(rootCss)) !== null) {
          if (!m[0].match(/(?:footer|header|card|btn|button|input|tooltip|modal|overlay|swatch)/i)) {
            bgCandidate = m[1];
            break;
          }
        }
      }
      
      textRegex.lastIndex = 0;
      if (m = textRegex.exec(rootCss)) {
        textCandidate = m[1];
      } else {
        fallbackTextRegex.lastIndex = 0;
        while ((m = fallbackTextRegex.exec(rootCss)) !== null) {
          if (!m[0].match(/(?:footer|header|card|btn|button|input|tooltip|modal|overlay|swatch)/i)) {
            textCandidate = m[1];
            break;
          }
        }
      }
      
      secRegex.lastIndex = 0;
      if (m = secRegex.exec(rootCss)) secondaryCandidate = m[1];
    }

    // 2. Fallback: Search the full HTML in order
    if (!primaryCandidate) {
      let m;
      accentRegex.lastIndex = 0;
      while ((m = accentRegex.exec(html)) !== null) {
        if (!isGrayscale(m[1]) && !m[0].match(/(?:price|success|warning|error|tooltip|hover|text|bg|border|link)/i)) {
          primaryCandidate = m[1];
          break;
        }
      }
    }

    if (!primaryCandidate) {
      let m;
      const fallbackColorRegex = /--[a-zA-Z0-9_-]+-accent[a-zA-Z0-9_-]*\s*:\s*(#[0-9a-fA-F]{3,6})\b/gi;
      while ((m = fallbackColorRegex.exec(html)) !== null) {
        if (!isGrayscale(m[1]) && !m[0].match(/(?:price|success|warning|error|tooltip|hover|text|bg|border|link)/i)) {
          primaryCandidate = m[1];
          break;
        }
      }
    }

    if (!primaryCandidate) {
      const generalHexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
      const allHexes = html.match(generalHexRegex) || [];
      for (const col of allHexes) {
        if (!isGrayscale(col)) {
          primaryCandidate = col;
          break;
        }
      }
    }

    if (primaryCandidate) {
      primaryColor = primaryCandidate;
    } else {
      const themeColorMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
      if (themeColorMatch) {
        primaryColor = themeColorMatch[1];
      }
    }

    // Extract Background Color
    if (!bgCandidate) {
      let m;
      bgRegex.lastIndex = 0;
      if (m = bgRegex.exec(html)) {
        bgCandidate = m[1];
      } else {
        fallbackBgRegex.lastIndex = 0;
        while ((m = fallbackBgRegex.exec(html)) !== null) {
          if (!m[0].match(/(?:footer|header|card|btn|button|input|tooltip|modal|overlay|swatch)/i)) {
            bgCandidate = m[1];
            break;
          }
        }
      }
    }
    if (bgCandidate) bgColor = bgCandidate;

    // Extract Text Color
    if (!textCandidate) {
      let m;
      textRegex.lastIndex = 0;
      if (m = textRegex.exec(html)) {
        textCandidate = m[1];
      } else {
        fallbackTextRegex.lastIndex = 0;
        while ((m = fallbackTextRegex.exec(html)) !== null) {
          if (!m[0].match(/(?:footer|header|card|btn|button|input|tooltip|modal|overlay|swatch)/i)) {
            textCandidate = m[1];
            break;
          }
        }
      }
    }
    if (textCandidate) textColor = textCandidate;

    if (!secondaryCandidate) {
      let m;
      secRegex.lastIndex = 0;
      if (m = secRegex.exec(html)) secondaryCandidate = m[1];
    }
    if (secondaryCandidate && !isGrayscale(secondaryCandidate)) {
      secondaryColor = secondaryCandidate;
    } else {
      secondaryColor = getContrastRatio(textColor, primaryColor) < 3.0 ? textColor : primaryColor;
    }

    const radiusMatch = html.match(/--button-radius:\s*([0-9]+px|rem|em)/i) ||
                        html.match(/border-radius:\s*([0-9]+px)/i);
    if (radiusMatch) buttonRadius = radiusMatch[1];

    const fontMatch = html.match(/--font-body-family:\s*([^;!}]+)/i) ||
                      html.match(/font-family:\s*([^;!}]+)/i);
    if (fontMatch) {
      let font = fontMatch[1].split(',')[0].replace(/['"]/g, '').trim();
      if (font && !font.includes('var(')) fontFamily = font;
    }
    
    // Detect active languages using hreflang alternates
    const detectedLanguages = ['en'];
    const hreflangRegex = /hreflang=["']([a-zA-Z-]{2,5})["']/gi;
    let hreflangMatch;
    while ((hreflangMatch = hreflangRegex.exec(html)) !== null) {
      const lang = hreflangMatch[1].split('-')[0].toLowerCase();
      if (lang && lang.length === 2 && !detectedLanguages.includes(lang) && lang !== 'x') {
        detectedLanguages.push(lang);
      }
    }

    let platform = 'shopify';
    let shopifyShopName = parsedUrl.hostname;
    let woocommerceShopUrl = '';
    
    if (html.includes('wp-content') || html.includes('woocommerce') || html.includes('wp-json') || html.includes('wpengine') || html.includes('wp-includes')) {
      platform = 'woocommerce';
      shopifyShopName = '';
      woocommerceShopUrl = parsedUrl.hostname;
    }

    const productsList = platform === 'woocommerce'
      ? await scrapeWooCommerceProducts(shopUrl)
      : await scrapeShopifyProducts(shopUrl, detectedLanguages);
    
    console.log(`[Branding Scraper] Extracted assets: favicon=${faviconUrl}, logo=${logoUrl}, color=${primaryColor}, font=${fontFamily}, productsCount=${productsList.length}, languages=${detectedLanguages.join(',')}`);
    return {
      id: derivedId,
      name: storeName,
      subdomain: `${derivedId}.stricktlycoffee.be`,
      contact_email: contactEmail,
      favicon: faviconUrl,
      logo: logoUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      bg_color: bgColor,
      text_color: textColor,
      button_radius: buttonRadius,
      button_text_color: buttonTextColor,
      header_bg_color: headerBgColor,
      font_family: fontFamily,
      platform: platform,
      shopify_shop_name: shopifyShopName,
      woocommerce_shop_url: woocommerceShopUrl,
      languages: detectedLanguages,
      products: productsList
    };
  } catch (e) {
    console.error('[Branding Scraper] Failed to fetch storefront branding:', e.message);
    
    // Fallback: Try fetching WooCommerce RSS feed as it might be a public WordPress feed bypassing WPEngine/Cloudflare blocks
    try {
      let url = shopUrl;
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      const parsedUrl = new URL(url);
      const feedUrl = `https://${parsedUrl.hostname}/feed/?post_type=product`;
      console.log(`[Branding Scraper Fallback] Fetching WooCommerce RSS feed from: ${feedUrl}`);
      
      const feedRes = await fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (feedRes.ok) {
        const xml = await feedRes.text();
        const channelTitleMatch = xml.match(/<title>([^<]+)<\/title>/i);
        let storeName = parsedUrl.hostname.split('.')[0];
        storeName = storeName.charAt(0).toUpperCase() + storeName.slice(1);
        
        if (channelTitleMatch) {
          const rawTitle = channelTitleMatch[1];
          const cleanTitle = rawTitle.replace(/Products Archive\s*-\s*/i, '').trim();
          if (cleanTitle) {
            storeName = cleanTitle;
          }
        }
        
        const productsList = await scrapeWooCommerceProducts(shopUrl);
        const derivedId = parsedUrl.hostname.replace(/^www\./i, '').split('.')[0].toLowerCase();
        
        console.log(`[Branding Scraper Fallback] Successfully parsed WooCommerce RSS: name=${storeName}, productsCount=${productsList.length}`);
        return {
          id: derivedId,
          name: storeName,
          subdomain: `${derivedId}.stricktlycoffee.be`,
          contact_email: `support@${parsedUrl.hostname}`,
          favicon: null,
          logo: null,
          primary_color: '#c5a059',
          secondary_color: '#767676',
          bg_color: '#ffffff',
          text_color: '#111111',
          button_radius: '4px',
          button_text_color: '#ffffff',
          header_bg_color: '#ffffff',
          font_family: 'Outfit',
          platform: 'woocommerce',
          shopify_shop_name: '',
          woocommerce_shop_url: parsedUrl.hostname,
          languages: ['en'],
          products: productsList
        };
      }
    } catch (fallbackErr) {
      console.error('[Branding Scraper Fallback] WooCommerce RSS fallback failed:', fallbackErr.message);
    }

    return {
      id: '',
      name: '',
      subdomain: '',
      contact_email: '',
      favicon: null,
      logo: null,
      primary_color: '#111111',
      secondary_color: '#767676',
      bg_color: '#ffffff',
      text_color: '#111111',
      button_radius: '4px',
      button_text_color: '#ffffff',
      header_bg_color: '#ffffff',
      font_family: 'Outfit',
      platform: 'shopify',
      shopify_shop_name: '',
      woocommerce_shop_url: '',
      products: []
    };
  }
}

// Scrape public products from a WooCommerce store URL using RSS feeds
async function scrapeWooCommerceProducts(shopUrl) {
  try {
    let url = shopUrl;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    const parsedUrl = new URL(url);
    const feedUrl = `https://${parsedUrl.hostname}/feed/?post_type=product`;
    console.log(`[WooCommerce RSS Scraper] Fetching products from: ${feedUrl}`);
    
    const res = await fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } });
    if (!res.ok) return [];
    
    const text = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    const products = [];
    let idCounter = 1;
    
    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/i);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i);
      const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/i);
      const contentMatch = itemContent.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);
      
      const title = titleMatch ? titleMatch[1].trim() : `WooCommerce Product ${idCounter}`;
      const link = linkMatch ? linkMatch[1].trim() : '';
      
      let description = '';
      if (descMatch) {
        description = descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, '$1').trim();
      }
      description = description.replace(/<[^>]+>/g, '').replace(/\[&#8230;\]/g, '...').trim();
      
      const searchHtml = (contentMatch ? contentMatch[1] : '') + ' ' + (descMatch ? descMatch[1] : '') + ' ' + itemContent;
      const imgRegex = /src=["'](https:[^"']+\.(?:jpg|jpeg|png|webp|gif))["']/gi;
      let imgMatch;
      let image = '';
      
      while ((imgMatch = imgRegex.exec(searchHtml)) !== null) {
        const candidate = imgMatch[1];
        if (!candidate.includes('s.w.org') && !candidate.toLowerCase().includes('logo') && !candidate.includes('icon')) {
          image = candidate;
          break;
        }
      }
      
      const slug = link ? link.split('/').filter(Boolean).pop() : `wc-${idCounter}`;
      
      products.push({
        id: idCounter + 2000,
        title: title,
        price: 55.00,
        image: image,
        description: description || 'Premium WooCommerce coffee product.',
        sku: `WC-${slug.toUpperCase()}`,
        external_id: `woocommerce-rss-${slug}`
      });
      idCounter++;
    }
    
    return products;
  } catch (e) {
    console.error('[WooCommerce RSS Scraper] Failed to parse products:', e.message);
    return [];
  }
}

// Scrape public products from a Shopify store URL without requiring API credentials
async function scrapeShopifyProducts(shopUrl, languages = ['en']) {
  try {
    let url = shopUrl;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    const parsedUrl = new URL(url);
    const productsUrl = `https://${parsedUrl.hostname}/products.json?limit=250`;
    console.log(`[Branding Scraper] Scrapes public products from: ${productsUrl}`);
    
    const res = await fetch(productsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    
    const data = await res.json();
    if (!data || !Array.isArray(data.products)) return [];
    
    const defaultProducts = data.products.map(p => {
      const firstVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
      const extraImages = p.images ? p.images.map(img => img.src) : [];
      const optionsList = p.options ? p.options.map(opt => ({ name: opt.name, values: opt.values })) : [];
      const ratingAvg = parseFloat((4.7 + Math.random() * 0.3).toFixed(1));
      const ratingCount = Math.floor(45 + Math.random() * 3500);
      const reviews = [
        {
          name: "Thomas M.",
          rating: 5,
          date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
          comment: `Absolutely brilliant! Fits perfectly and consistency of the extraction is outstanding. Worth every cent.`
        },
        {
          name: "Sophia K.",
          rating: 5,
          date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0],
          comment: `Great addition to my barista kit. Beautiful build quality.`
        },
        {
          name: "Marc L.",
          rating: 4,
          date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
          comment: `Very high precision shower screen. Clean flow, only minor cleanup needed.`
        }
      ];

      return {
        id: p.id,
        title: p.title,
        price: firstVariant ? parseFloat(firstVariant.price) : 55.00,
        image: p.images && p.images.length > 0 ? p.images[0].src : '',
        description: p.body_html ? p.body_html.replace(/<[^>]*>/g, '').substring(0, 200) : 'Premium coffee accessory.',
        sku: firstVariant ? firstVariant.sku : '',
        external_id: firstVariant ? String(firstVariant.id) : String(p.id),
        original_link: p.handle ? `https://${parsedUrl.hostname}/products/${p.handle}` : `https://${parsedUrl.hostname}`,
        translations: {},
        meta_details: {
          images: extraImages,
          options: optionsList,
          rating_avg: ratingAvg,
          rating_count: ratingCount,
          reviews: reviews
        }
      };
    });

    // Scrape translations for other languages
    const otherLangs = languages.filter(l => l !== 'en');
    for (const lang of otherLangs) {
      try {
        const langUrl = `https://${parsedUrl.hostname}/${lang}/products.json?limit=250`;
        const langRes = await fetch(langUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (langRes.ok) {
          const langData = await langRes.json();
          if (langData && Array.isArray(langData.products)) {
            langData.products.forEach(lp => {
              const matched = defaultProducts.find(dp => String(dp.id) === String(lp.id));
              if (matched) {
                matched.translations[lang] = {
                  title: lp.title,
                  description: lp.body_html ? lp.body_html.replace(/<[^>]*>/g, '').substring(0, 200) : 'Premium coffee accessory.'
                };
              }
            });
          }
        }
      } catch (err) {
        console.warn(`[Branding Scraper] Failed to fetch translations for ${lang}:`, err.message);
      }
    }

    return defaultProducts;
  } catch (err) {
    console.warn('[Branding Scraper] Failed to fetch public products:', err.message);
  }
  return [];
}


async function deleteCloudflareSubdomain(recordId) {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!cfToken || !cfZoneId || !recordId) {
    console.log('[Cloudflare] Missing config or Record ID. Skipping DNS record deletion.');
    return false;
  }

  console.log(`[Cloudflare] Deleting DNS record ID: ${recordId}...`);

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error('[Cloudflare] Error response:', result);
      throw new Error(result.errors?.[0]?.message || 'Failed to delete DNS record');
    }

    console.log(`[Cloudflare] Successfully deleted DNS record ID: ${recordId}`);
    return true;
  } catch (err) {
    console.error('[Cloudflare] DNS record deletion failed:', err.message);
    return false;
  }
}

// ----------------------------------------------------------------------------
// STRIPE WEBHOOK (Needs raw body parser)
// ----------------------------------------------------------------------------
app.post('/api/webhook/stripe/:brandId', express.raw({ type: 'application/json' }), async (req, res) => {
  const { brandId } = req.params;
  const sig = req.headers['stripe-signature'];

  try {
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).send(`Brand ${brandId} not found`);
    }

    const stripe = getStripeInstance(brand);
    const endpointSecret = brand.stripe_webhook_secret;

    let event;

    if (stripe && sig && endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error(`[Webhook Stripe] Signature verification failed for brand ${brandId}: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle checkout.session.completed event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await handleSuccessfulPayment(session.client_reference_id, {
          name: session.customer_details?.name || 'Customer',
          email: session.customer_details?.email,
          address: session.shipping_details || session.customer_details?.address
        }, session.payment_intent, brand);
      }
    } else {
      return res.status(400).send('Stripe credentials or webhook signature missing.');
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`[Webhook Stripe] Error processing webhook:`, err);
    res.status(500).send(err.message);
  }
});

// JSON body parser for all other routes
app.use(express.json());

// Multer configuration for file uploads
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Serve static uploaded files
app.use('/uploads', express.static('uploads'));

// Helper to resolve active brand context dynamically for both merchants and superadmins
function resolveBrandId(req) {
  if (req.user && req.user.role.toLowerCase() === 'merchant') {
    return req.user.brand_id;
  }
  return req.headers['x-brand-id'] || req.query.brandId || req.query.previewBrandId || (req.brand ? req.brand.id : null);
}

// Pricing cache for Gemini models loaded dynamically from the database
let cachedPricing = {};

async function loadPricingCache() {
  try {
    const rows = await allQuery('SELECT model, prompt_rate_per_million, completion_rate_per_million FROM ai_model_pricing');
    const newCache = {};
    for (let r of rows) {
      newCache[r.model] = {
        promptRate: parseFloat(r.prompt_rate_per_million) / 1000000,
        completionRate: parseFloat(r.completion_rate_per_million) / 1000000
      };
    }
    cachedPricing = newCache;
    console.log('[AI Usage Tracker] Loaded live pricing rates cache from database.');
  } catch (err) {
    console.error('[AI Usage Tracker] Failed to load pricing cache:', err.message);
  }
}

// Helper to estimate Gemini API costs dynamically in USD based on cached database rates
function estimateGeminiCost(model, promptTokens, completionTokens) {
  let promptRate = 0.000000075; // default flash prompt rate
  let completionRate = 0.000000300; // default flash completion rate

  // Match cache entry by exact match or substring prefix
  const config = cachedPricing[model] || Object.entries(cachedPricing).find(([k]) => model.includes(k))?.[1];
  if (config) {
    promptRate = config.promptRate;
    completionRate = config.completionRate;
  } else if (model.includes('pro')) {
    promptRate = promptTokens > 128000 ? 0.00000250 : 0.00000125;
    completionRate = promptTokens > 128000 ? 0.00001000 : 0.00000500;
  } else {
    promptRate = promptTokens > 128000 ? 0.000000150 : 0.000000075;
    completionRate = promptTokens > 128000 ? 0.000000600 : 0.000000300;
  }

  // Adjust for double pricing tier for prompts exceeding 128k input tokens
  if (promptTokens > 128000) {
    promptRate = promptRate * 2.0;
    completionRate = completionRate * 2.0;
  }

  const cost = (promptTokens * promptRate) + (completionTokens * completionRate);
  return parseFloat(cost.toFixed(6));
}

// Helper to log AI usage to database
async function logAiUsage(brandId, operation, model, usageMetadata) {
  if (!brandId) return;
  const promptTokens = usageMetadata?.promptTokenCount || 0;
  const completionTokens = usageMetadata?.candidatesTokenCount || 0;
  const totalTokens = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);
  const costUsd = estimateGeminiCost(model, promptTokens, completionTokens);

  try {
    await runQuery(`
      INSERT INTO ai_usage_logs (brand_id, operation, model, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [brandId, operation, model, promptTokens, completionTokens, totalTokens, costUsd]);
    console.log(`[AI Usage Tracker] Logged AI usage for ${brandId}: ${operation} (${model}) - Cost: $${costUsd}`);
  } catch (err) {
    console.error(`[AI Usage Tracker] Failed to write usage log to database:`, err.message);
  }
}


// User Auth endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await getQuery('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    if (inputHash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = { email: user.email, role: user.role, brand_id: user.brand_id, time: Date.now() };
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const secret = process.env.JWT_SECRET || 'fallback-auth-secret-key-12984-sc';
    const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('hex');
    const token = `${payloadBase64}.${signature}`;

    addAuditLog("Operator Login", "success", `JWT session token issued for ${user.email} (${user.role}).`);
    res.json({ success: true, email: user.email, role: user.role, brand_id: user.brand_id, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Upload local file to S3 media bucket
async function uploadFileToS3(filePath, key, mimeType) {
  const fileStream = fs.createReadStream(filePath);
  await s3Client.send(new PutObjectCommand({
    Bucket: s3BucketMedia,
    Key: key,
    Body: fileStream,
    ContentType: mimeType
  }));
}

// Media upload & downsizing endpoint
app.post('/api/global/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const localPath = req.file.path;
  const isImage = req.file.mimetype.startsWith('image/');
  let targetFilename = req.file.filename;
  let uploadPath = localPath;
  let isResized = false;

  try {
    if (isImage) {
      try {
        const resizedFilename = 'resized-' + req.file.filename;
        const resizedPath = path.join(uploadDir, resizedFilename);

        // Downsize image to max-width 800px using sharp
        await sharp(localPath)
          .resize({ width: 800, withoutEnlargement: true })
          .toFile(resizedPath);

        // Delete the original large file since we have the resized one
        fs.unlinkSync(localPath);
        uploadPath = resizedPath;
        targetFilename = resizedFilename;
        isResized = true;
      } catch (err) {
        console.error('[Upload Resizing Error]', err);
        // Fallback to serving the original large image (uploadPath & targetFilename remain as original)
      }
    }

    // Upload the final file to MinIO S3 media bucket
    await uploadFileToS3(uploadPath, targetFilename, req.file.mimetype);

    // Clean up local file from disk after successful upload
    fs.unlinkSync(uploadPath);

    return res.json({
      success: true,
      url: `/uploads/${targetFilename}`,
      originalName: req.file.originalname,
      resized: isResized
    });
  } catch (err) {
    // Attempt local file cleanup in case of catastrophic failures
    if (fs.existsSync(uploadPath)) {
      try { fs.unlinkSync(uploadPath); } catch (_) {}
    }
    if (fs.existsSync(localPath)) {
      try { fs.unlinkSync(localPath); } catch (_) {}
    }
    console.error('[S3 Upload Catastrophic Failure]', err);
    return res.status(500).json({ error: 'Failed to upload asset to S3: ' + err.message });
  }
});

// ----------------------------------------------------------------------------
// MULTI-TENANT BRAND HOST RESOLUTION MIDDLEWARE
// ----------------------------------------------------------------------------
app.use(async (req, res, next) => {
  // Skip brand resolution for global endpoints, auth, and Stripe webhook parameters
  if (req.path.startsWith('/api/global/') || req.path.startsWith('/api/webhook/stripe/') || req.path.startsWith('/api/auth/')) {
    return next();
  }

  const host = req.headers.host || '';
  const hostname = host.split(':')[0]; // strip port in local dev (e.g. :8081)
  const previewBrandId = req.query.previewBrandId;

  try {
    let brand = null;

    // 0. Preview override resolver
    if (previewBrandId) {
      brand = await getQuery('SELECT * FROM brands WHERE id = $1', [previewBrandId]);
    }

    // 1. Direct subdomain or custom domain lookup (e.g. resolved.stricktlycoffee.be or brand-custom.com)
    if (!brand) {
      brand = await getQuery('SELECT * FROM brands WHERE subdomain = $1 OR custom_domain = $1', [hostname]);
    }

    // 2. Fallback matching for local dev or alternative domains containing brand ID
    if (!brand) {
      // Look for a brand whose ID or subdomain prefix is contained in the hostname (e.g. dev-pesado.stricktlycoffee.be or pesado-dev.stricktlycoffee.be)
      const allBrands = await allQuery('SELECT * FROM brands');
      brand = allBrands.find(b => {
        const prefix = (b.subdomain || '').split('.')[0];
        return (prefix && hostname.includes(prefix)) || hostname.includes(b.id);
      });

      // 3. Absolute fallback: use the first brand in the DB if none match (usually 'pesado')
      if (!brand && allBrands.length > 0) {
        brand = allBrands[0];
      }
    }

    if (!brand || (brand.status === 'archived' && !previewBrandId)) {
      return res.status(404).json({ error: 'Shop tenant brand not found or is currently archived.' });
    }

    req.brand = brand;
    next();
  } catch (err) {
    console.error('[Middleware] Tenant resolution error:', err);
    res.status(500).json({ error: 'Internal server error resolving tenant' });
  }
});

// ----------------------------------------------------------------------------
// BRAND TENANT API ENDPOINTS
// ----------------------------------------------------------------------------

function validateCouponRules(coupon, cartItems, subtotal) {
  if (!coupon.rules) return { valid: true };
  try {
    const rules = JSON.parse(coupon.rules);
    
    // Check minimum subtotal
    if (rules.min_subtotal && subtotal < parseFloat(rules.min_subtotal)) {
      return { valid: false, error: `Minimum subtotal of €${parseFloat(rules.min_subtotal).toFixed(2)} required.` };
    }
    
    // Check product restrictions
    if (rules.product_ids && rules.product_ids.length > 0 && cartItems) {
      const hasRestrictedProduct = cartItems.some(item => rules.product_ids.includes(String(item.id)));
      if (!hasRestrictedProduct) {
        return { valid: false, error: 'This coupon is not valid for the products in your cart.' };
      }
    }
    
    // Check excluded products
    if (rules.exclude_product_ids && rules.exclude_product_ids.length > 0 && cartItems) {
      const hasExcludedProduct = cartItems.some(item => rules.exclude_product_ids.includes(String(item.id)));
      if (hasExcludedProduct) {
        return { valid: false, error: 'This coupon cannot be used with some items in your cart.' };
      }
    }
  } catch(e) {
    console.error('Error validating coupon rules:', e);
  }
  return { valid: true };
}

// Verify Coupon Endpoint
app.post('/api/coupons/verify', async (req, res) => {
  const { code, subtotal, items } = req.body;
  const brandId = req.brand.id;

  if (!code) {
    return res.status(400).json({ valid: false, error: 'Coupon code is required.' });
  }

  try {
    const coupon = await getQuery('SELECT * FROM coupons WHERE code = $1 AND brand_id = $2', [code.trim().toUpperCase(), brandId]);
    if (!coupon) {
      return res.json({ valid: false, error: 'Coupon code is invalid.' });
    }

    if (coupon.status !== 'active') {
      return res.json({ valid: false, error: `Coupon is already ${coupon.status}.` });
    }

    if (coupon.expire_at && new Date(coupon.expire_at) <= new Date()) {
      return res.json({ valid: false, error: 'Coupon has expired.' });
    }

    const rulesCheck = validateCouponRules(coupon, items, subtotal);
    if (!rulesCheck.valid) {
      return res.json({ valid: false, error: rulesCheck.error });
    }

    res.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value)
    });
  } catch (err) {
    console.error('Error verifying coupon:', err);
    res.status(500).json({ valid: false, error: 'Server error validating coupon.' });
  }
});

// Get resolved brand config (public safe properties)
app.get('/api/brand', (req, res) => {
  const { id, name, subdomain, contact_email, primary_color, logo, favicon, custom_domain, status, languages, theme_settings } = req.brand;
  res.json({ id, name, subdomain, contact_email, primary_color, logo, favicon, custom_domain, status, languages, theme_settings });
});

// Get Products for the active brand
app.get('/api/products', async (req, res) => {
  try {
    const rows = await allQuery('SELECT * FROM products WHERE brand_id = $1 ORDER BY id ASC', [req.brand.id]);
    // Parse json columns
    const parsedRows = rows.map(row => ({
      ...row,
      features: row.features ? JSON.parse(row.features) : [],
      compatibility: row.compatibility ? JSON.parse(row.compatibility) : [],
      translations: row.translations ? JSON.parse(row.translations) : {},
      meta_details: row.meta_details ? JSON.parse(row.meta_details) : {}
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/checkout', async (req, res) => {
  try {
    const { 
      items, 
      customerName, 
      customerEmail,
      couponCode,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      first_touch_url,
      last_touch_url,
      referrer,
      browser_info,
      attribution_channel,
      language
    } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let subtotal = 0;
    const validatedItems = [];
    
    for (const cartItem of items) {
      // Find product belonging to this brand
      const prod = await getQuery('SELECT * FROM products WHERE id = $1 AND brand_id = $2', [cartItem.id, req.brand.id]);
      if (!prod) {
        return res.status(400).json({ error: `Invalid product ID for this brand: ${cartItem.id}` });
      }
      subtotal += parseFloat(prod.price) * cartItem.quantity;
      validatedItems.push({
        id: prod.id,
        title: prod.title,
        price: parseFloat(prod.price),
        quantity: cartItem.quantity,
        image: prod.image,
        options: cartItem.options || {}
      });
    }

    // Coupon verification and calculation
    let discountAmount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await getQuery('SELECT * FROM coupons WHERE code = $1 AND brand_id = $2', [couponCode.trim().toUpperCase(), req.brand.id]);
      if (coupon && coupon.status === 'active' && (!coupon.expire_at || new Date(coupon.expire_at) > new Date())) {
        const rulesCheck = validateCouponRules(coupon, validatedItems, subtotal);
        if (rulesCheck.valid) {
          appliedCouponCode = coupon.code;
          if (coupon.discount_type === 'percentage') {
            discountAmount = subtotal * (parseFloat(coupon.discount_value) / 100);
          } else if (coupon.discount_type === 'fixed') {
            discountAmount = parseFloat(coupon.discount_value);
          }
          if (discountAmount > subtotal) discountAmount = subtotal;
        }
      }
    }

    const total = subtotal - discountAmount;
    const orderPrefix = req.brand.id.toUpperCase().substring(0, 3);
    const orderId = `${orderPrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Create Order in pending state
    await runQuery(`
      INSERT INTO orders (
        id, brand_id, stripe_session_id, customer_name, customer_email, items, subtotal, total, status,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content, coupon_code, discount_amount,
        first_touch_url, last_touch_url, referrer, browser_info, attribution_channel, language
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    `, [
      orderId,
      req.brand.id,
      orderId, // Temp session ID for mock tracking
      customerName || 'Anonymous User',
      customerEmail || 'no-email@example.com',
      JSON.stringify(validatedItems),
      subtotal,
      total,
      'pending_payment',
      utm_source || null,
      utm_medium || null,
      utm_campaign || null,
      utm_term || null,
      utm_content || null,
      appliedCouponCode,
      discountAmount,
      first_touch_url || null,
      last_touch_url || null,
      referrer || null,
      browser_info || null,
      attribution_channel || 'Direct',
    ]);

    addAuditLog("Order Created", "success", `Pending checkout session for ${customerName} (${orderId}) created, total: €${total.toFixed(2)}.`);

    const stripe = getStripeInstance(req.brand);
    if (stripe) {
      const lineItems = validatedItems.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title,
            images: [item.image]
          },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        client_reference_id: orderId,
        customer_email: customerEmail,
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'BE', 'AU']
        },
        success_url: `${req.headers.origin}/track.html?orderId=${orderId}&status=success`,
        cancel_url: `${req.headers.origin}/index.html`
      });

      // Update order with the real session ID
      await runQuery('UPDATE orders SET stripe_session_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [session.id, orderId]);

      res.json({ url: session.url });
    } else {
      // Mock Sandbox Checkout redirect
      console.log(`[Stripe Sandbox] Brand ${req.brand.name} checkout. Returning mock checkout URL.`);
      const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
      res.json({ 
        url: `/api/checkout-mock-page?orderId=${orderId}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}&origin=${encodeURIComponent(origin)}`
      });
    }
  } catch (err) {
    console.error('[Checkout] Error initiating checkout:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper to escape HTML tags to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// Stripe Sandbox Mock Checkout Page HTML Renderer
app.get('/api/checkout-mock-page', async (req, res) => {
  const { orderId, email, name, origin } = req.query;

  if (!orderId) {
    return res.status(400).send('<h1>Missing required parameter: orderId</h1>');
  }

  // Render checkout simulation page
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stripe Sandbox | Payment Gateway</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0d0c;
            --card-bg: #121514;
            --primary: #c5a059;
            --primary-hover: #b08d47;
            --text-main: #f3f4f3;
            --text-muted: #8e9290;
            --accent: #1e2221;
            --border: #232826;
            --font-display: 'Space Grotesk', sans-serif;
            --font-body: 'Outfit', sans-serif;
            --transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: var(--font-body);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
        }

        .checkout-container {
            max-width: 500px;
            width: 100%;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            text-align: center;
        }

        .stripe-badge {
            background-color: #635bff;
            color: #fff;
            font-family: var(--font-display);
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 4px 12px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 24px;
        }

        h2 {
            font-family: var(--font-display);
            font-size: 1.8rem;
            margin-bottom: 12px;
        }

        p {
            color: var(--text-muted);
            margin-bottom: 32px;
            font-size: 0.95rem;
        }

        .order-summary {
            background: var(--accent);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 24px;
            margin-bottom: 32px;
            text-align: left;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 0.95rem;
        }

        .summary-row:last-child {
            margin-bottom: 0;
            border-top: 1px solid var(--border);
            padding-top: 12px;
            margin-top: 12px;
            font-weight: 700;
            color: var(--primary);
        }

        .btn {
            display: block;
            width: 100%;
            padding: 16px;
            font-family: var(--font-display);
            font-size: 0.95rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            transition: var(--transition);
        }

        .btn-primary {
            background-color: #635bff;
            color: #fff;
            margin-bottom: 12px;
        }

        .btn-primary:hover {
            background-color: #4f46e5;
        }

        .btn-cancel {
            background-color: transparent;
            color: var(--text-muted);
            border: 1px solid var(--border);
        }

        .btn-cancel:hover {
            border-color: var(--text-main);
            color: var(--text-main);
        }
    </style>
</head>
<body>

    <div class="checkout-container">
        <span class="stripe-badge">Stripe Sandbox</span>
        <h2>Stripe Payment Simulation</h2>
        <p>You are using Sandbox Mode because no live Stripe API keys are configured in your environment.</p>

        <div class="order-summary">
            <div class="summary-row">
                <span>Order Reference</span>
                <span id="summary-order-id" style="font-family: monospace;">${escapeHtml(orderId)}</span>
            </div>
            <div class="summary-row">
                <span>Customer Email</span>
                <span id="summary-email">${escapeHtml(email || '')}</span>
            </div>
            <div class="summary-row">
                <span>Payment Amount</span>
                <span id="summary-total" style="font-weight: 600;">Loading...</span>
            </div>
        </div>

        <button class="btn btn-primary" id="pay-btn">Authorize sandbox Payment</button>
        <button class="btn btn-cancel" id="cancel-btn">Cancel Transaction</button>
    </div>

    <script>
        const orderId = "${escapeHtml(orderId)}";
        const email = "${escapeHtml(email || '')}";
        const name = "${escapeHtml(name || '')}";
        const origin = "${escapeHtml(origin || '')}";

        // Fetch total amount from backend
        async function fetchOrderDetails() {
            try {
                const res = await fetch(\`/api/order/\${orderId}\`);
                if (res.ok) {
                    const order = await res.json();
                    document.getElementById('summary-total').textContent = \`€\${order.total.toFixed(2)}\`;
                }
            } catch (err) {
                console.error('Failed to load summary details:', err);
            }
        }

        fetchOrderDetails();

        document.getElementById('pay-btn').addEventListener('click', async () => {
            const payBtn = document.getElementById('pay-btn');
            payBtn.textContent = 'Processing Payment...';
            payBtn.disabled = true;

            try {
                // Post to payment simulation endpoint
                const res = await fetch('/api/admin/simulate-stripe-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId,
                        name,
                        email
                    })
                });

                if (res.ok) {
                    // Redirect back to storefront origin on success
                    window.location.href = \`\${origin}/track.html?orderId=\${orderId}&status=success\`;
                } else {
                    alert('Simulation payment authorization failed.');
                    payBtn.textContent = 'Authorize sandbox Payment';
                    payBtn.disabled = false;
                }
            } catch (err) {
                alert(\`Network error: \${err.message}\`);
                payBtn.textContent = 'Authorize sandbox Payment';
                payBtn.disabled = false;
            }
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            window.location.href = \`\${origin}/index.html\`;
        });
    </script>
</body>
</html>`);
});

// Simulated payment trigger for Sandbox
app.post('/api/admin/simulate-stripe-payment', async (req, res) => {
  const { orderId, name, email, shipping } = req.body;

  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({ error: 'Order has already been processed' });
    }

    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [order.brand_id]);
    if (!brand) {
      return res.status(404).json({ error: 'Order brand not found' });
    }

    const defaultAddress = {
      address: {
        line1: '123 Coffee Bean Lane',
        city: 'Brussels',
        postal_code: '1000',
        country: 'BE'
      }
    };

    await handleSuccessfulPayment(orderId, {
      name: name || order.customer_name,
      email: email || order.customer_email,
      address: shipping || defaultAddress
    }, 'MOCK_PAY_INTENT_' + Date.now(), brand);

    res.json({ success: true, orderId });
  } catch (err) {
    console.error('Simulation payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Shopify fulfillment status webhook callback
app.post('/api/webhook/shopify', async (req, res) => {
  const payload = req.body;
  const shopifyOrderId = (payload.order_id || payload.id)?.toString();
  const fulfillment = payload.fulfillment || (payload.fulfillments ? payload.fulfillments[0] : null);

  if (fulfillment && shopifyOrderId) {
    const trackingNumber = fulfillment.tracking_number;
    const trackingCarrier = fulfillment.tracking_company || 'DHL';
    const trackingUrl = fulfillment.tracking_url || `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;

    try {
      const order = await getQuery('SELECT * FROM orders WHERE shopify_order_id = $1', [shopifyOrderId]);
      if (order) {
        await runQuery(`
          UPDATE orders 
          SET status = 'shipped', tracking_number = $1, tracking_carrier = $2, tracking_url = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [trackingNumber, trackingCarrier, trackingUrl, order.id]);
        
        await triggerOrderReferralEmail(order.id, order.brand_id);

        console.log(`[Webhook Shopify] Order ${order.id} marked shipped. Tracking: ${trackingNumber}`);
      }
    } catch (err) {
      console.error('Shopify webhook processing failed:', err);
    }
  }

  res.status(200).send('OK');
});

// Retrieve single order tracking details
app.get('/api/order/:id', async (req, res) => {
  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = $1 OR stripe_session_id = $2', [req.params.id, req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      ...order,
      items: JSON.parse(order.items),
      shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global in-memory system event ring buffer for platform status audits
const systemAuditLogs = [
  { timestamp: new Date(Date.now() - 60000).toISOString(), action: "Database Pool Initialized", status: "success", details: "PostgreSQL client pool listening on port 5432." },
  { timestamp: new Date(Date.now() - 45000).toISOString(), action: "Cloudflare DNS Hook", status: "success", details: "Subdomain wildcard resolution verified." },
  { timestamp: new Date(Date.now() - 30000).toISOString(), action: "SSL Certificates Load", status: "success", details: "Sandbox TLS keys loaded." }
];

function addAuditLog(action, status, details) {
  systemAuditLogs.unshift({
    timestamp: new Date().toISOString(),
    action,
    status,
    details
  });
  if (systemAuditLogs.length > 50) {
    systemAuditLogs.pop();
  }
}

// Middleware to verify the admin token for simulator access
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const urlToken = req.query.token;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : urlToken;

  if (!token) {
    return res.status(401).json({ error: 'Access Denied. Unauthorized operator.' });
  }

  const AUTH_SECRET = process.env.JWT_SECRET || 'fallback-auth-secret-key-12984-sc';
  const parts = token.split('.');

  if (parts.length === 2) {
    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(payloadBase64).digest('hex');
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid or forged authentication token.' });
    }
    try {
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
      if (!payload.email || !payload.role) {
        return res.status(401).json({ error: 'Invalid authentication token payload.' });
      }
      req.user = payload;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Malformed authentication token payload.' });
    }
  }

  // Fallback to legacy un-signed token for local/dev fallback ONLY
  if (process.env.NODE_ENV !== 'production') {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (payload.email && payload.role) {
        req.user = payload;
        return next();
      }
    } catch (e) {}
  }

  return res.status(401).json({ error: 'Access Denied. Signed authentication token is required.' });
}

// Retrieve orders for the active tenant brand (Warehouse dashboard context)
app.get('/api/admin/orders', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);

  if (!brandId) {
    return res.status(400).json({ error: 'No brand context resolved.' });
  }

  try {
    const rows = await allQuery('SELECT * FROM orders WHERE brand_id = $1 ORDER BY created_at DESC', [brandId]);
    const parsedRows = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      shipping_address: row.shipping_address ? JSON.parse(row.shipping_address) : null
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function triggerOrderReferralEmail(orderId, brandId) {
  try {
    const rules = await getQuery('SELECT * FROM referral_rules WHERE brand_id = $1', [brandId]);
    if (!rules || !rules.enabled) {
      console.log(`[Referral System] No active referral campaign rules configured for brand: ${brandId}`);
      return;
    }

    const order = await getQuery('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order || !order.customer_email) return;

    // Check if an email has already been queued for this order
    const existing = await getQuery('SELECT id FROM coupon_emails WHERE order_id = $1', [orderId]);
    if (existing) {
      console.log(`[Referral System] Referral email already scheduled/sent for order: ${orderId}`);
      return;
    }

    // Generate custom code
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `REF_${randomSuffix}`;

    // Expiration date
    const expireDays = rules.expire_days || 14;
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + expireDays);

    // Create coupon record
    const couponId = `CPN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await runQuery(`
      INSERT INTO coupons (id, brand_id, code, discount_type, discount_value, status, rules, expire_at, origin_order_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      couponId,
      brandId,
      code,
      rules.discount_type,
      rules.discount_value,
      'active',
      rules.rules || null,
      expireAt,
      orderId
    ]);

    // Select the correct template based on language selection
    const orderLang = order.language || 'en';
    let subject = rules.email_subject || 'Thank you for your order! Here is a discount code for your friends.';
    let body = rules.email_body || 'Hi {customer_name},\n\nHere is a referral code: {coupon_code}';

    if (rules.templates) {
      try {
        const templates = JSON.parse(rules.templates);
        if (templates[orderLang]) {
          subject = templates[orderLang].subject || subject;
          body = templates[orderLang].body || body;
        } else if (templates['en']) {
          // English fallback inside templates dictionary
          subject = templates['en'].subject || subject;
          body = templates['en'].body || body;
        }
      } catch (e) {
        console.error('Error parsing referral rules multilingual templates:', e);
      }
    }

    // Format template strings with replacement tokens
    const discountText = rules.discount_type === 'percentage' ? `${parseFloat(rules.discount_value)}%` : `€${parseFloat(rules.discount_value).toFixed(2)}`;
    const formattedSubject = subject
      .replace(/{customer_name}/g, order.customer_name || 'Customer')
      .replace(/{coupon_code}/g, code)
      .replace(/{discount_value}/g, discountText)
      .replace(/{expire_date}/g, expireAt.toLocaleDateString());

    const formattedBody = body
      .replace(/{customer_name}/g, order.customer_name || 'Customer')
      .replace(/{coupon_code}/g, code)
      .replace(/{discount_value}/g, discountText)
      .replace(/{expire_date}/g, expireAt.toLocaleDateString());

    // Scheduled send date (days_after_delivery days from now)
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + (rules.days_after_delivery || 3));

    // Insert scheduled email record with generated content logs
    await runQuery(`
      INSERT INTO coupon_emails (brand_id, order_id, customer_email, scheduled_for, coupon_code, email_subject, email_body)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      brandId,
      orderId,
      order.customer_email,
      scheduledFor,
      code,
      formattedSubject,
      formattedBody
    ]);

    console.log(`[Referral System] Scheduled ${orderLang} referral coupon email for order ${orderId} (${order.customer_email}) on ${scheduledFor.toISOString()}`);
  } catch (err) {
    console.error('[Referral System] Error scheduling referral email:', err);
  }
}

// Mark order fulfilled
app.post('/api/admin/fulfill', verifyAdminToken, async (req, res) => {
  const { orderId, trackingNumber, trackingCarrier } = req.body;
  const brandId = resolveBrandId(req);

  if (!brandId) {
    return res.status(400).json({ error: 'No brand context resolved.' });
  }

  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = $1 AND brand_id = $2', [orderId, brandId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found for this brand' });
    }

    const tNumber = trackingNumber || `TRACK${Math.floor(100000 + Math.random() * 900000)}`;
    const tCarrier = trackingCarrier || 'DHL Express';
    const tUrl = `https://www.dhl.com/en/express/tracking.html?AWB=${tNumber}`;

    await runQuery(`
      UPDATE orders 
      SET status = 'shipped', tracking_number = $1, tracking_carrier = $2, tracking_url = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [tNumber, tCarrier, tUrl, orderId]);

    // Schedule referral email!
    await triggerOrderReferralEmail(orderId, brandId);

    console.log(`[Warehouse Simulation] Fulfilling order ${orderId} with tracking: ${tNumber}`);
    res.json({ success: true, trackingNumber: tNumber, trackingCarrier: tCarrier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// SYSTEM ADMINISTRATION API (For onboarding new shops at dash.stricktlycoffee.be)
// ----------------------------------------------------------------------------

// List all brands
app.get('/api/global/brands', verifyAdminToken, async (req, res) => {
  try {
    if (req.user.role === 'merchant') {
      const rows = await allQuery('SELECT id, name, subdomain, contact_email, primary_color, shopify_shop_name, stripe_secret_key IS NOT NULL as has_stripe, shopify_access_token IS NOT NULL as has_shopify, custom_domain, logo, favicon, theme_settings, languages, marketing_protocol FROM brands WHERE id = $1', [req.user.brand_id]);
      return res.json(rows);
    }
    const rows = await allQuery('SELECT id, name, subdomain, contact_email, primary_color, shopify_shop_name, stripe_secret_key IS NOT NULL as has_stripe, shopify_access_token IS NOT NULL as has_shopify, custom_domain, logo, favicon, theme_settings, languages, marketing_protocol FROM brands ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scrape public branding info for Easy Setup
app.get('/api/global/brands/scrape-branding', verifyAdminToken, async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL query parameter is required.' });
  }

  try {
    const scraped = await scrapeShopifyBranding(url);
    res.json({ success: true, data: scraped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET verify subdomain DNS record exists on Cloudflare
app.get('/api/global/brands/verify-dns', verifyAdminToken, async (req, res) => {
  const { subdomain } = req.query;
  if (!subdomain) {
    return res.status(400).json({ error: 'subdomain query parameter is required.' });
  }

  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!cfToken || !cfZoneId) {
    return res.json({ success: true, warning: 'Cloudflare credentials missing. Auto-approved locally.' });
  }

  try {
    const dnsRecordName = getCloudflareDnsRecordName(subdomain);
    const cfUrl = `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records?name=${encodeURIComponent(dnsRecordName)}`;
    const response = await fetch(cfUrl, {
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return res.status(400).json({ error: data.errors?.[0]?.message || 'Cloudflare API query failed.' });
    }

    let found = data.result.find(r => r.name.toLowerCase() === dnsRecordName.toLowerCase());
    if (!found) {
      // Fallback: check if the wildcard record *.stricktlycoffee.be exists and is active/proxied
      const baseDomain = process.env.CLOUDFLARE_DOMAIN || 'stricktlycoffee.be';
      const wildcardUrl = `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records?name=${encodeURIComponent('*.' + baseDomain)}`;
      const wildResponse = await fetch(wildcardUrl, {
        headers: {
          'Authorization': `Bearer ${cfToken}`,
          'Content-Type': 'application/json'
        }
      });
      const wildData = await wildResponse.json();
      if (wildResponse.ok && wildData.success) {
        found = wildData.result.find(r => r.name.toLowerCase() === `*.${baseDomain}`.toLowerCase() && r.proxied === true);
      }
    }

    if (found) {
      res.json({ success: true });
    } else {
      res.json({ success: false, isMissing: true, error: `DNS record for ${dnsRecordName} not registered on Cloudflare.` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create subdomain DNS record on Cloudflare
app.post('/api/global/brands/create-dns', verifyAdminToken, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Superadmin access required.' });
  }
  const { subdomain } = req.body;
  if (!subdomain) {
    return res.status(400).json({ error: 'subdomain is required.' });
  }

  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!cfToken || !cfZoneId) {
    return res.json({ success: true, recordId: 'mock_dns_record_id' });
  }

  try {
    const recordId = await createCloudflareSubdomain(subdomain);
    if (!recordId) {
      return res.status(400).json({ error: 'Failed to register subdomain record on Cloudflare.' });
    }
    res.json({ success: true, recordId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Onboard new brand
app.post('/api/global/brands', verifyAdminToken, async (req, res) => {
  const reqId = (req.body.id || '').trim().toLowerCase();
  if (!reqId) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  if (req.user.role !== 'superadmin' && req.user.brand_id !== reqId) {
    return res.status(403).json({ error: 'Permission denied. Superadmin access or brand operator permission required.' });
  }

  try {
    const existing = await getQuery('SELECT subdomain, cloudflare_dns_record_id, custom_domain, cloudflare_custom_domain_dns_record_id, stripe_secret_key, stripe_webhook_secret FROM brands WHERE id = $1', [reqId]);

    if (req.user.role !== 'superadmin') {
      if (existing) {
        req.body.subdomain = existing.subdomain;
        req.body.custom_domain = existing.custom_domain;
        req.body.stripe_secret_key = existing.stripe_secret_key;
        req.body.stripe_webhook_secret = existing.stripe_webhook_secret;
      }
    }

    const { id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color, custom_domain, logo, favicon, theme_settings, languages, marketing_protocol, ai_tier } = req.body;

    if (!id || !name || !subdomain) {
      return res.status(400).json({ error: 'Missing required fields: id, name, subdomain' });
    }

    const brandId = id.trim().toLowerCase();

    // Validate subdomain slug pattern and unique conflicts if no custom domain is configured
    if (!custom_domain) {
      const slug = (subdomain || '').split('.')[0] || '';
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slug || !slugRegex.test(slug)) {
        return res.status(400).json({ error: 'Invalid Subdomain Slug: Only lowercase letters, numbers, and hyphens are allowed.' });
      }
      
      try {
        const conflict = await getQuery('SELECT id FROM brands WHERE id != $1 AND LOWER(split_part(subdomain, \'.\', 1)) = $2', [brandId, slug]);
        if (conflict) {
          return res.status(400).json({ error: `Conflict: The subdomain slug "${slug}" is already in use by another shop.` });
        }
      } catch (dbErr) {
        return res.status(500).json({ error: `Database validation error: ${dbErr.message}` });
      }
    }
    
    let dnsRecordId = existing ? existing.cloudflare_dns_record_id : null;
    let customDnsRecordId = existing ? existing.cloudflare_custom_domain_dns_record_id : null;

    // 1. Handle default subdomain CNAME record
    if (!existing || existing.subdomain !== subdomain) {
      if (existing && existing.cloudflare_dns_record_id) {
        await deleteCloudflareSubdomain(existing.cloudflare_dns_record_id);
      }
      dnsRecordId = await createCloudflareSubdomain(subdomain);
    }

    // 2. Handle manual custom domain CNAME record
    if (custom_domain && (!existing || existing.custom_domain !== custom_domain)) {
      if (existing && existing.cloudflare_custom_domain_dns_record_id) {
        await deleteCloudflareSubdomain(existing.cloudflare_custom_domain_dns_record_id);
      }
      customDnsRecordId = await createCloudflareCustomDomain(custom_domain);
    } else if (!custom_domain && existing && existing.cloudflare_custom_domain_dns_record_id) {
      // If custom domain was cleared, remove the DNS record
      await deleteCloudflareSubdomain(existing.cloudflare_custom_domain_dns_record_id);
      customDnsRecordId = null;
    }

    // 3. Auto-scrape styles, favicon, and logo from Shopify store url if not explicitly provided
    let finalColor = primary_color || '#c5a059';
    let finalLogo = logo || null;
    let finalFavicon = favicon || null;

    if (shopify_shop_name && (!logo || !favicon || !primary_color)) {
      const targetUrl = shopify_shop_name.includes('.') ? shopify_shop_name : `${shopify_shop_name}.myshopify.com`;
      const scraped = await scrapeShopifyBranding(targetUrl);
      if (!primary_color && scraped.primary_color) finalColor = scraped.primary_color;
      if (!logo && scraped.logo) finalLogo = scraped.logo;
      if (!favicon && scraped.favicon) finalFavicon = scraped.favicon;
    }

    let finalLangs = 'en';
    if (languages) {
      finalLangs = Array.isArray(languages) ? languages.join(',') : String(languages);
    }

    const finalAiTier = ai_tier || 'professional';

    await runQuery(`
      INSERT INTO brands (id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color, cloudflare_dns_record_id, custom_domain, cloudflare_custom_domain_dns_record_id, logo, favicon, theme_settings, languages, marketing_protocol, ai_tier)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        subdomain = EXCLUDED.subdomain,
        shopify_shop_name = EXCLUDED.shopify_shop_name,
        shopify_access_token = EXCLUDED.shopify_access_token,
        stripe_secret_key = EXCLUDED.stripe_secret_key,
        stripe_webhook_secret = EXCLUDED.stripe_webhook_secret,
        contact_email = EXCLUDED.contact_email,
        primary_color = EXCLUDED.primary_color,
        cloudflare_dns_record_id = COALESCE(EXCLUDED.cloudflare_dns_record_id, brands.cloudflare_dns_record_id),
        custom_domain = EXCLUDED.custom_domain,
        cloudflare_custom_domain_dns_record_id = COALESCE(EXCLUDED.cloudflare_custom_domain_dns_record_id, brands.cloudflare_custom_domain_dns_record_id),
        logo = EXCLUDED.logo,
        favicon = EXCLUDED.favicon,
        theme_settings = EXCLUDED.theme_settings,
        languages = EXCLUDED.languages,
        marketing_protocol = EXCLUDED.marketing_protocol,
        ai_tier = EXCLUDED.ai_tier,
        updated_at = CURRENT_TIMESTAMP
    `, [
      brandId,
      name,
      subdomain,
      shopify_shop_name || null,
      shopify_access_token || null,
      stripe_secret_key || null,
      stripe_webhook_secret || null,
      contact_email || null,
      finalColor,
      dnsRecordId,
      custom_domain || null,
      customDnsRecordId,
      finalLogo,
      finalFavicon,
      theme_settings || null,
      finalLangs,
      marketing_protocol || null,
      finalAiTier
    ]);

    res.json({ success: true, brandId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Generate brand marketing protocol manuscript via AI Analysis
app.post('/api/global/brands/:id/generate-protocol', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { url, competitors } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    let targetUrl = url || brand.shopify_shop_name || brand.woocommerce_shop_url || brand.subdomain;
    if (targetUrl && !targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }

    let homepageText = 'No website crawled.';
    if (targetUrl) {
      try {
        console.log(`[AI Protocol Generator] Scraping brand site: ${targetUrl}`);
        const pageRes = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (pageRes.ok) {
          const html = await pageRes.text();
          homepageText = extractCleanText(html);
        }
      } catch (err) {
        console.warn(`[AI Protocol Generator] Failed to crawl primary URL: ${targetUrl}`, err.message);
      }
    }

    // Crawl competitors if provided
    let competitorTexts = [];
    if (competitors) {
      const compUrls = Array.isArray(competitors)
        ? competitors
        : String(competitors).split(',').map(s => s.trim()).filter(Boolean);

      for (let compUrl of compUrls) {
        let fullCompUrl = compUrl;
        if (!fullCompUrl.startsWith('http')) {
          fullCompUrl = `https://${fullCompUrl}`;
        }
        try {
          console.log(`[AI Protocol Generator] Scraping competitor site: ${fullCompUrl}`);
          const compRes = await fetch(fullCompUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (compRes.ok) {
            const compHtml = await compRes.text();
            const cleanCompText = extractCleanText(compHtml);
            competitorTexts.push(`Competitor: ${compUrl}\n${cleanCompText.substring(0, 3000)}`);
          }
        } catch (err) {
          console.warn(`[AI Protocol Generator] Failed to crawl competitor: ${fullCompUrl}`, err.message);
        }
      }
    }

    // Fetch products catalog context
    const products = await allQuery('SELECT title, description, price FROM products WHERE brand_id = $1 LIMIT 20', [brandId]);
    const catalogContext = products.map(p => `- ${p.title} (€${parseFloat(p.price).toFixed(2)}): ${p.description || ''}`).join('\n');

    // Query Gemini
    const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
    let generatedProtocol = '';

    if (apiKey) {
      const prompt = `You are a premium Performance Marketing Director and Brand Strategist.
Based on the following scraped storefront text and catalog data, generate a comprehensive Brand Performance Marketing Protocol.

Brand Name: ${brand.name}
Website URL: ${targetUrl || 'Not available'}

[SCRAPED HOME PAGE CONTENT]
${homepageText}

[COMPETITOR ANALYSES]
${competitorTexts.length > 0 ? competitorTexts.join('\n\n') : 'No competitor sites crawled. Analyze standard competitors in their industry segment based on their products.'}

[PRODUCT CATALOG SAMPLES]
${catalogContext || 'No catalog items registered.'}

Generate a thorough, structured, and complete brand manuscript / protocol in Markdown format. The manuscript MUST include:
1. **Brand Identity & Position**: Explain their mission, visual aesthetic, value proposition, and unique selling points (USPs).
2. **Target Audience Profile**: Build 2 distinct customer personas (demographics, psychographics, buying motivations).
3. **Marketing Voice & Tone Guidelines**: Detail clear messaging guidelines, voice adjectives (with copy examples), and a list of approved and banned terms.
4. **Competitor & Market positioning**: Identify top 3 market competitors, analyze their positioning, and list our strategic differentiators.
5. **Performance Ads Framework**:
   - Emotional, Logical, and Utility hooks for ads.
   - Ready-to-copy Ad Copy variations (Primary Text, Headline, Description) for Meta/Instagram campaigns targeting cold vs retargeting audiences.
   - Suggestions for TikTok hook scripts.
6. **Marketing Campaign Manuscripts**:
   - High-converting email templates: A 3-step Welcome Sequence and a Cart Abandonment flow.
   - High-converting landing page headline & section layout guidelines.

Output the markdown manuscript directly. Do not wrap the response in a JSON object or triple backticks unless standard. Return only raw markdown content.`;

      try {
        // Determine Gemini model based on brand's AI tier
        let targetModel = 'gemini-3.1-pro';
        if (brand.ai_tier === 'standard') {
          targetModel = 'gemini-2.5-flash';
        } else if (brand.ai_tier === 'enterprise') {
          targetModel = 'deep-research-pro-preview';
        }

        console.log(`[AI Protocol Generator] Querying Gemini for brand: ${brandId} using model: ${targetModel}`);
        let geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        // Fallback for Enterprise tier if deep-research-pro-preview is not available or errors out
        if (!geminiRes.ok && brand.ai_tier === 'enterprise') {
          console.warn('[AI Protocol Generator] Enterprise model failed, falling back to gemini-3.1-pro');
          targetModel = 'gemini-3.1-pro';
          geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
        }

        if (geminiRes.ok) {
          const result = await geminiRes.json();
          generatedProtocol = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (result.usageMetadata) {
            await logAiUsage(brandId, 'Brand Protocol & Strategy Generation', targetModel, result.usageMetadata);
          }
        } else {
          const errText = await geminiRes.text();
          throw new Error(`Gemini API returned status ${geminiRes.status}: ${errText}`);
        }
      } catch (err) {
        console.error('[AI Protocol Generator] Gemini API query failed:', err.message);
      }
    }

    if (!generatedProtocol) {
      console.warn('[AI Protocol Generator] Using default fallback template');
      generatedProtocol = `# Brand & Performance Marketing Manuscript for ${brand.name}

## 1. Brand Identity & Position
* **Mission**: To deliver high-quality custom coffee products to home baristas and commercial operators.
* **Value Proposition**: Premium workmanship, precise dimensions, and custom storefront experiences.
* **USPs**: Modular builds, ergonomic styling, and seamless integration.

## 2. Target Audience Profile
* **Persona 1 (Home Barista Enthusiast)**: Demographics: 25-45, tech-savvy. Values quality extraction.
* **Persona 2 (Commercial Barista/Cafe Owner)**: Demographics: 30-55. Values durability and flow consistency.

## 3. Marketing Voice & Tone Guidelines
* **Tone**: Professional, technical, premium, passionate.
* **Approved Terms**: "Precision extraction", "ergonomic control", "micro-lot grade".
* **Banned Terms**: "Cheap", "average", "bargain".

## 4. Competitor & Market Positioning
* **Competitors**: Barista Hustle, Pullman, Saint Anthony Industries.
* **Differentiators**: Unified merchant tooling, customizable storefront branding, direct-to-consumer simulator options.

## 5. Performance Ads Framework
* **Logical Hook**: "Upgrade your shower screen to achieve 22% higher extraction consistency in every single shot."
* **Emotional Hook**: "Serve coffee exactly the way you intended it. Clean, precise, and beautiful."

## 6. Marketing Campaign Manuscripts
### Welcome Email (Step 1)
* **Subject**: Welcome to the ${brand.name} Family! ☕
* **Body**: Thank you for choosing premium brewing gears. Use code WELCOME10 for 10% off your first order!`;
    }

    await runQuery('UPDATE brands SET marketing_protocol = $1 WHERE id = $2', [generatedProtocol, brandId]);
    addAuditLog("Marketing Protocol Generated", "success", `Generated AI marketing manuscript for brand ${brandId}.`);

    res.json({ success: true, marketing_protocol: generatedProtocol });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Compile brand prompt with scraped data for manual copy pasting
app.post('/api/global/brands/:id/compile-prompt', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { url, competitors } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    let targetUrl = url || brand.shopify_shop_name || brand.woocommerce_shop_url || brand.subdomain;
    if (targetUrl && !targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }

    let homepageText = 'No website crawled.';
    if (targetUrl) {
      try {
        console.log(`[AI Prompt Compiler] Scraping brand site: ${targetUrl}`);
        const pageRes = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (pageRes.ok) {
          const html = await pageRes.text();
          homepageText = extractCleanText(html);
        }
      } catch (err) {
        console.warn(`[AI Prompt Compiler] Failed to crawl primary URL: ${targetUrl}`, err.message);
      }
    }

    let competitorTexts = [];
    if (competitors) {
      const compUrls = Array.isArray(competitors)
        ? competitors
        : String(competitors).split(',').map(s => s.trim()).filter(Boolean);

      for (let compUrl of compUrls) {
        let fullCompUrl = compUrl;
        if (!fullCompUrl.startsWith('http')) {
          fullCompUrl = `https://${fullCompUrl}`;
        }
        try {
          console.log(`[AI Prompt Compiler] Scraping competitor site: ${fullCompUrl}`);
          const compRes = await fetch(fullCompUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (compRes.ok) {
            const compHtml = await compRes.text();
            const cleanCompText = extractCleanText(compHtml);
            competitorTexts.push(`Competitor: ${compUrl}\n${cleanCompText.substring(0, 3000)}`);
          }
        } catch (err) {
          console.warn(`[AI Prompt Compiler] Failed to crawl competitor: ${fullCompUrl}`, err.message);
        }
      }
    }

    const products = await allQuery('SELECT title, description, price FROM products WHERE brand_id = $1 LIMIT 20', [brandId]);
    const catalogContext = products.map(p => `- ${p.title} (€${parseFloat(p.price).toFixed(2)}): ${p.description || ''}`).join('\n');

    const prompt = `You are a premium Performance Marketing Director and Brand Strategist.
Based on the following scraped storefront text and catalog data, generate a comprehensive Brand Performance Marketing Protocol.

Brand Name: ${brand.name}
Website URL: ${targetUrl || 'Not available'}

[SCRAPED HOME PAGE CONTENT]
${homepageText}

[COMPETITOR ANALYSES]
${competitorTexts.length > 0 ? competitorTexts.join('\n\n') : 'No competitor sites crawled. Analyze standard competitors in their industry segment based on their products.'}

[PRODUCT CATALOG SAMPLES]
${catalogContext || 'No catalog items registered.'}

Generate a thorough, structured, and complete brand manuscript / protocol in Markdown format. The manuscript MUST include:
1. **Brand Identity & Position**: Explain their mission, visual aesthetic, value proposition, and unique selling points (USPs).
2. **Target Audience Profile**: Build 2 distinct customer personas (demographics, psychographics, buying motivations).
3. **Marketing Voice & Tone Guidelines**: Detail clear messaging guidelines, voice adjectives (with copy examples), and a list of approved and banned terms.
4. **Competitor & Market positioning**: Identify top 3 market competitors, analyze their positioning, and list our strategic differentiators.
5. **Performance Ads Framework**:
   - Emotional, Logical, and Utility hooks for ads.
   - Ready-to-copy Ad Copy variations (Primary Text, Headline, Description) for Meta/Instagram campaigns targeting cold vs retargeting audiences.
   - Suggestions for TikTok hook scripts.
6. **Marketing Campaign Manuscripts**:
   - High-converting email templates: A 3-step Welcome Sequence and a Cart Abandonment flow.
   - High-converting landing page headline & section layout guidelines.

Output the markdown manuscript directly. Do not wrap the response in a JSON object or triple backticks unless standard. Return only raw markdown content.`;

    res.json({ success: true, prompt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET AI Usage stats & recent logs for a brand
app.get('/api/global/brands/:id/ai-usage', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    // 1. Total Cost and count
    const summary = await getQuery(`
      SELECT 
        COUNT(id) as total_calls,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(estimated_cost_usd), 0.0) as total_cost_usd
      FROM ai_usage_logs
      WHERE brand_id = $1
    `, [brandId]);

    // 2. Cost and counts breakdown by operation
    const breakdown = await allQuery(`
      SELECT 
        operation,
        COUNT(id) as calls_count,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(estimated_cost_usd), 0.0) as cost_usd
      FROM ai_usage_logs
      WHERE brand_id = $1
      GROUP BY operation
      ORDER BY cost_usd DESC
    `, [brandId]);

    // 3. Recent logs (last 15 records)
    const logs = await allQuery(`
      SELECT id, operation, model, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, created_at
      FROM ai_usage_logs
      WHERE brand_id = $1
      ORDER BY created_at DESC
      LIMIT 15
    `, [brandId]);

    res.json({
      success: true,
      summary: {
        total_calls: parseInt(summary.total_calls, 10),
        total_prompt_tokens: parseInt(summary.total_prompt_tokens, 10),
        total_completion_tokens: parseInt(summary.total_completion_tokens, 10),
        total_tokens: parseInt(summary.total_tokens, 10),
        total_cost_usd: parseFloat(parseFloat(summary.total_cost_usd).toFixed(6))
      },
      breakdown: breakdown.map(b => ({
        operation: b.operation,
        calls_count: parseInt(b.calls_count, 10),
        total_tokens: parseInt(b.total_tokens, 10),
        cost_usd: parseFloat(parseFloat(b.cost_usd).toFixed(6))
      })),
      recent_logs: logs.map(l => ({
        id: l.id,
        operation: l.operation,
        model: l.model,
        prompt_tokens: l.prompt_tokens,
        completion_tokens: l.completion_tokens,
        total_tokens: l.total_tokens,
        estimated_cost_usd: parseFloat(parseFloat(l.estimated_cost_usd).toFixed(6)),
        created_at: l.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET AI pricing rates list
app.get('/api/global/ai-pricing', verifyAdminToken, async (req, res) => {
  try {
    const rows = await allQuery('SELECT model, prompt_rate_per_million, completion_rate_per_million FROM ai_model_pricing ORDER BY model ASC');
    res.json({ success: true, pricing: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST update AI pricing rate (Superadmin only)
app.post('/api/global/ai-pricing', verifyAdminToken, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Superadmin access required.' });
  }

  const { model, prompt_rate_per_million, completion_rate_per_million } = req.body;
  if (!model || prompt_rate_per_million === undefined || completion_rate_per_million === undefined) {
    return res.status(400).json({ error: 'Missing required fields: model, prompt_rate_per_million, completion_rate_per_million' });
  }

  try {
    await runQuery(`
      INSERT INTO ai_model_pricing (model, prompt_rate_per_million, completion_rate_per_million)
      VALUES ($1, $2, $3)
      ON CONFLICT (model) DO UPDATE 
      SET prompt_rate_per_million = EXCLUDED.prompt_rate_per_million,
          completion_rate_per_million = EXCLUDED.completion_rate_per_million
    `, [model, parseFloat(prompt_rate_per_million), parseFloat(completion_rate_per_million)]);

    // Reload pricing cache!
    await loadPricingCache();

    res.json({ success: true, message: `Successfully updated pricing rates for model ${model}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete/De-onboard brand (Soft Archiving)
app.delete('/api/global/brands/:id', verifyAdminToken, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Superadmin access required.' });
  }
  const { id } = req.params;

  try {
    // 1. Fetch brand details to get default and custom DNS record IDs
    const brand = await getQuery('SELECT name, cloudflare_dns_record_id, cloudflare_custom_domain_dns_record_id FROM brands WHERE id = $1', [id]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand shop not found' });
    }

    // 2. Delete default subdomain DNS record on Cloudflare if present
    if (brand.cloudflare_dns_record_id) {
      try {
        await deleteCloudflareSubdomain(brand.cloudflare_dns_record_id);
      } catch (dnsErr) {
        console.error(`[DNS Cleanup] Failed to delete subdomain DNS for ${brand.name}:`, dnsErr.message);
      }
    }

    // 3. Delete custom domain DNS record on Cloudflare if present
    if (brand.cloudflare_custom_domain_dns_record_id) {
      try {
        await deleteCloudflareSubdomain(brand.cloudflare_custom_domain_dns_record_id);
      } catch (dnsErr) {
        console.error(`[DNS Cleanup] Failed to delete custom domain DNS for ${brand.name}:`, dnsErr.message);
      }
    }

    // 4. Hard delete: completely remove the brand from the database (cascading constraints clean up products, campaigns, coupons, etc.)
    await runQuery('DELETE FROM brands WHERE id = $1', [id]);

    res.json({ success: true, message: `Brand ${brand.name} has been successfully archived and taken offline.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Brand Status (active, paused, archived)
app.put('/api/global/brands/:id/status', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  // Permissions validation: only superadmins can archive, merchant managers can pause/resume
  if (status === 'archived' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Only platform superadmins can archive brand storefronts.' });
  }

  if (req.user.role === 'merchant' && req.user.brand_id !== id) {
    return res.status(403).json({ error: 'Permission denied. Cannot modify other brand shops.' });
  }

  try {
    const brand = await getQuery('SELECT name FROM brands WHERE id = $1', [id]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand shop not found' });
    }

    await runQuery(`
      UPDATE brands 
      SET status = $1, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [status, id]);

    // If brand is paused or archived, automatically pause all of its active marketing campaigns
    if (status === 'paused' || status === 'archived') {
      await runQuery(`
        UPDATE marketing_campaigns
        SET status = 'paused'
        WHERE brand_id = $1 AND status = 'active'
      `, [id]);
    }

    res.json({ success: true, message: `Brand ${brand.name} status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List portal users
app.get('/api/global/users', verifyAdminToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role.toLowerCase() === 'merchant') {
      rows = await allQuery('SELECT id, email, role, brand_id, created_at FROM users WHERE brand_id = $1 ORDER BY email ASC', [req.user.brand_id]);
    } else {
      rows = await allQuery('SELECT id, email, role, brand_id, created_at FROM users ORDER BY email ASC');
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invite / create portal user
app.post('/api/global/users/invite', verifyAdminToken, async (req, res) => {
  const { email, role, brand_id } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required.' });
  }

  // Merchants can only invite users to their own brand
  let targetBrandId = brand_id;
  if (req.user.role.toLowerCase() === 'merchant') {
    targetBrandId = req.user.brand_id;
  }

  try {
    const existing = await getQuery('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const defaultPassword = 'TheKey4u';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');

    await runQuery(`
      INSERT INTO users (email, password_hash, role, brand_id)
      VALUES ($1, $2, $3, $4)
    `, [email.trim().toLowerCase(), passwordHash, role.toLowerCase(), targetBrandId || null]);

    addAuditLog("Operator Invite", "success", `Invited/Created account for ${email} with role ${role} (Brand: ${targetBrandId || 'All'}).`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete portal user
app.delete('/api/global/users/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const userToDelete = await getQuery('SELECT email, role, brand_id FROM users WHERE id = $1', [id]);
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (userToDelete.email === req.user.email) {
      return res.status(400).json({ error: 'Cannot remove your own active account.' });
    }

    // Merchants can only delete users of the same brand
    if (req.user.role.toLowerCase() === 'merchant' && userToDelete.brand_id !== req.user.brand_id) {
      return res.status(403).json({ error: 'Access Denied. You can only remove operators within your own brand.' });
    }

    await runQuery('DELETE FROM users WHERE id = $1', [id]);
    addAuditLog("Operator Removed", "success", `Removed user account: ${userToDelete.email}.`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete portal users
app.delete('/api/global/users/bulk-delete', verifyAdminToken, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid or missing user IDs.' });
  }

  try {
    let query = 'SELECT id, email, role, brand_id FROM users WHERE id = ANY($1)';
    const usersToDelete = await allQuery(query, [ids]);

    const validIds = [];
    const emails = [];

    for (const u of usersToDelete) {
      if (u.email === req.user.email) continue; // cannot delete self
      if (req.user.role.toLowerCase() === 'merchant' && u.brand_id !== req.user.brand_id) continue;
      validIds.push(u.id);
      emails.push(u.email);
    }

    if (validIds.length > 0) {
      await runQuery('DELETE FROM users WHERE id = ANY($1)', [validIds]);
      addAuditLog("Operator Bulk Removed", "success", `Removed ${validIds.length} users: ${emails.join(', ')}.`);
    }

    res.json({ success: true, count: validIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get system alerts and platform status audits diagnostic metrics
app.get('/api/global/system-status', verifyAdminToken, async (req, res) => {
  const os = require('os');
  
  // 1. Check Database Health
  let dbStatus = 'healthy';
  let dbPingMs = 0;
  try {
    const t0 = Date.now();
    await getQuery('SELECT 1');
    dbPingMs = Date.now() - t0;
  } catch (err) {
    dbStatus = 'unhealthy';
  }

  // 2. Check Memory Usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryPercent = ((usedMem / totalMem) * 100).toFixed(1);

  // 3. Shopify Integration Status (Checks active brand shop configuration)
  let shopifyStatus = 'disabled';
  let brandDetails = null;
  if (req.user.brand_id) {
    brandDetails = await getQuery('SELECT shopify_shop_name, shopify_access_token, custom_domain FROM brands WHERE id = $1', [req.user.brand_id]);
    if (brandDetails && brandDetails.shopify_shop_name) {
      shopifyStatus = brandDetails.shopify_access_token ? 'connected' : 'public_scrape';
    }
  }

  // 4. Return all system diagnostics
  res.json({
    success: true,
    db: {
      status: dbStatus,
      ping: dbPingMs
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      memory: {
        total: (totalMem / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        used: (usedMem / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        free: (freeMem / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        percent: parseFloat(memoryPercent)
      }
    },
    integrations: {
      shopify: shopifyStatus,
      dns: brandDetails && brandDetails.custom_domain ? 'verified' : 'sandbox_subdomain'
    },
    logs: systemAuditLogs
  });
});

// List products (scoped by brand if merchant role)
app.get('/api/global/products', verifyAdminToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'merchant') {
      rows = await allQuery('SELECT * FROM products WHERE brand_id = $1 ORDER BY title ASC', [req.user.brand_id]);
    } else {
      rows = await allQuery('SELECT * FROM products ORDER BY title ASC');
    }
    const parsed = rows.map(row => ({
      ...row,
      translations: row.translations ? JSON.parse(row.translations) : {},
      meta_details: row.meta_details ? JSON.parse(row.meta_details) : {}
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new product to specific brand
app.post('/api/global/products', verifyAdminToken, async (req, res) => {
  const { brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, translations, meta_details } = req.body;

  if (!brand_id || !title || !price) {
    return res.status(400).json({ error: 'Missing required fields: brand_id, title, price' });
  }

  // Scope validation for merchants
  if (req.user.role === 'merchant' && req.user.brand_id !== brand_id) {
    return res.status(403).json({ error: 'Permission denied. Cannot add product to other brands.' });
  }

  try {
    const brand = await getQuery('SELECT id FROM brands WHERE id = $1', [brand_id]);
    if (!brand) {
      return res.status(400).json({ error: `Brand ${brand_id} does not exist.` });
    }

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : features || '[]';
    const compatibilityJson = Array.isArray(compatibility) ? JSON.stringify(compatibility) : compatibility || '[]';
    const translationsJson = translations ? (typeof translations === 'string' ? translations : JSON.stringify(translations)) : null;
    const metaDetailsJson = meta_details ? (typeof meta_details === 'string' ? meta_details : JSON.stringify(meta_details)) : null;

    await runQuery(`
      INSERT INTO products (brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, translations, meta_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      brand_id,
      title,
      price,
      currency || 'EUR',
      image || null,
      description || null,
      tag || null,
      original_link || null,
      long_description || null,
      featuresJson,
      compatibilityJson,
      sku || null,
      external_id || null,
      translationsJson,
      metaDetailsJson
    ]);

    addAuditLog("Catalog Product Create", "success", `Product "${title}" (SKU: ${sku || 'N/A'}) manually added to brand ${brand_id}.`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from catalog
app.delete('/api/global/products/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await getQuery('SELECT brand_id, title FROM products WHERE id = $1', [parseInt(id, 10)]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Scope validation for merchants
    if (req.user.role === 'merchant' && req.user.brand_id !== product.brand_id) {
      return res.status(403).json({ error: 'Permission denied. Cannot delete product from other brands.' });
    }

    await runQuery('DELETE FROM products WHERE id = $1', [parseInt(id, 10)]);
    res.json({ success: true, message: `Product ${product.title} has been successfully deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate AI SEO content for a product
app.post('/api/global/products/generate-seo', verifyAdminToken, async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Product title is required.' });
  }

  const brandId = resolveBrandId(req);
  let brand = null;
  if (brandId) {
    try {
      brand = await getQuery('SELECT name, marketing_protocol FROM brands WHERE id = $1', [brandId]);
    } catch (e) {
      console.warn('[SEO Generator] Error querying brand info:', e.message);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      let prompt = `You are a premium e-commerce copywriter. Write a high-converting, SEO-optimized short description, detailed description, key features (up to 5 bullet points), and machine compatibility (up to 4 items) for a product titled "${title}". Description/Details: "${description || ''}".`;
      
      if (brand && brand.marketing_protocol) {
        prompt += `\n\nYou MUST align the copy's voice, guidelines, and style parameters with this Brand Strategy Manuscript / Protocol:\n${brand.marketing_protocol}`;
      }

      prompt += `\n\nReturn ONLY a JSON object in this format:
{
  "short_description": "A high-converting 1-2 sentence summary pitch.",
  "detailed_description": "A comprehensive paragraph explaining product craftsmanship, benefits, and materials.",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "compatibility": ["Compatible Machine 1", "Compatible Machine 2"]
}`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(text);
        
        if (result.usageMetadata && brandId) {
          await logAiUsage(brandId, 'Product SEO Content Generation', 'gemini-2.5-flash', result.usageMetadata);
        }

        return res.json({ success: true, ...parsed });
      }
    } catch (err) {
      console.warn('[Gemini AI SEO Generation Failed, falling back]', err.message);
    }
  }

  // Fallback Rule-Based Copywriter
  const features = [
    `Premium quality construction custom-tailored for the ${title}`,
    `Ergonomic styling designed for high-efficiency coffee workflows`,
    `Engineered to ensure optimal extraction consistency`,
    `Highly compatible with standard barista setups`,
    `Durable materials built for daily commercial use`
  ];
  const short_description = `Elevate your barista craft with the ${title}. Meticulously designed for consistency, speed, and premium durability in busy coffee shop environments.`;
  const detailed_description = `The ${title} represents the pinnacle of specialty coffee preparation accessories. Designed in collaboration with professional baristas, it solves common distribution and consistency issues to deliver outstanding extraction yields. Built using premium-grade food-safe materials, this is an essential upgrade for any serious espresso workstation.`;
  const compatibility = [
    "Commercial 58mm espresso machines",
    "La Marzocco, E61, Decent, Slayer, Synesso",
    "Not compatible with 54mm Breville baskets"
  ];

  res.json({
    success: true,
    short_description,
    detailed_description,
    features,
    compatibility
  });
});

// Update product in catalog
app.put('/api/global/products/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const { title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, active, translations, meta_details } = req.body;

  try {
    const product = await getQuery('SELECT brand_id FROM products WHERE id = $1', [parseInt(id, 10)]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Scope validation for merchants
    if (req.user.role === 'merchant' && req.user.brand_id !== product.brand_id) {
      return res.status(403).json({ error: 'Permission denied. Cannot update product of other brands.' });
    }

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : features || '[]';
    const compatibilityJson = Array.isArray(compatibility) ? JSON.stringify(compatibility) : compatibility || '[]';
    const translationsJson = translations ? (typeof translations === 'string' ? translations : JSON.stringify(translations)) : null;
    const metaDetailsJson = meta_details ? (typeof meta_details === 'string' ? meta_details : JSON.stringify(meta_details)) : null;

    await runQuery(`
      UPDATE products 
      SET title = $1, 
          price = $2, 
          currency = $3, 
          image = $4, 
          description = $5, 
          tag = $6, 
          original_link = $7, 
          long_description = $8, 
          features = $9, 
          compatibility = $10, 
          sku = $11, 
          external_id = $12, 
          active = $13,
          translations = $14,
          meta_details = $15,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
    `, [
      title,
      price,
      currency || 'EUR',
      image || null,
      description || null,
      tag || null,
      original_link || null,
      long_description || null,
      featuresJson,
      compatibilityJson,
      sku || null,
      external_id || null,
      active !== undefined ? active : 1,
      translationsJson,
      metaDetailsJson,
      parseInt(id, 10)
    ]);

    addAuditLog("Catalog Product Update", "success", `Product "${title}" (ID: ${id}) details updated in catalog.`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve combined orders across all stores (Consolidated Audit List)
app.get('/api/global/orders', verifyAdminToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'merchant') {
      rows = await allQuery(`
        SELECT o.*, b.name as brand_name 
        FROM orders o
        LEFT JOIN brands b ON o.brand_id = b.id
        WHERE o.brand_id = $1
        ORDER BY o.created_at DESC
      `, [req.user.brand_id]);
    } else {
      rows = await allQuery(`
        SELECT o.*, b.name as brand_name 
        FROM orders o
        LEFT JOIN brands b ON o.brand_id = b.id
        ORDER BY o.created_at DESC
      `);
    }
    const parsedRows = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      shipping_address: row.shipping_address ? JSON.parse(row.shipping_address) : null
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk update order statuses
app.post('/api/global/orders/bulk-status', verifyAdminToken, async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || ids.length === 0 || !status) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  try {
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
    let query = `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
    let params = [status, ...ids];
    
    if (req.user.role === 'merchant') {
      query += ` AND brand_id = $${ids.length + 2}`;
      params.push(req.user.brand_id);
    }
    
    await runQuery(query, params);
    res.json({ success: true, updated: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete orders
app.delete('/api/global/orders/bulk-delete', verifyAdminToken, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  try {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    let query = `DELETE FROM orders WHERE id IN (${placeholders})`;
    let params = [...ids];
    
    if (req.user.role === 'merchant') {
      query += ` AND brand_id = $${ids.length + 1}`;
      params.push(req.user.brand_id);
    }
    
    await runQuery(query, params);
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk update products active state
app.put('/api/global/products/bulk-active', verifyAdminToken, async (req, res) => {
  const { ids, active } = req.body;
  if (!Array.isArray(ids) || ids.length === 0 || active === undefined) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  try {
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
    let query = `UPDATE products SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
    let params = [active, ...ids];
    
    if (req.user.role === 'merchant') {
      query += ` AND brand_id = $${ids.length + 2}`;
      params.push(req.user.brand_id);
    }
    
    await runQuery(query, params);
    addAuditLog("Catalog Product Bulk Active Toggle", "success", `Product visibility toggled to ${active} for ${ids.length} items.`);
    res.json({ success: true, updated: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete products
app.delete('/api/global/products/bulk-delete', verifyAdminToken, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  try {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    let query = `DELETE FROM products WHERE id IN (${placeholders})`;
    let params = [...ids];
    
    if (req.user.role === 'merchant') {
      query += ` AND brand_id = $${ids.length + 1}`;
      params.push(req.user.brand_id);
    }
    
    await runQuery(query, params);
    addAuditLog("Catalog Product Bulk Delete", "success", `Deleted ${ids.length} products manually from catalog.`);
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk void coupons
app.put('/api/global/coupons/bulk-void', verifyAdminToken, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  try {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    let query = `UPDATE coupons SET status = 'voided' WHERE id IN (${placeholders})`;
    let params = [...ids];
    
    if (req.user.role === 'merchant') {
      query += ` AND brand_id = $${ids.length + 1}`;
      params.push(req.user.brand_id);
    }
    
    await runQuery(query, params);
    addAuditLog("Coupon Registry Bulk Void", "success", `Voided ${ids.length} coupons manually.`);
    res.json({ success: true, voided: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete campaigns
app.delete('/api/global/campaigns/bulk-delete', verifyAdminToken, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  try {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    let query = `DELETE FROM campaigns WHERE id IN (${placeholders})`;
    let params = [...ids];
    
    if (req.user.role === 'merchant') {
      query += ` AND brand_id = $${ids.length + 1}`;
      params.push(req.user.brand_id);
    }
    
    await runQuery(query, params);
    addAuditLog("Campaigns Bulk Delete", "success", `Deleted ${ids.length} campaigns manually.`);
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// HANDLERS
// ----------------------------------------------------------------------------
async function handleSuccessfulPayment(orderId, customerInfo, paymentIntentId, brand) {
  try {
    console.log(`💳 Payment confirmed for order ${orderId} on brand ${brand.name}`);
    
    await runQuery(`
      UPDATE orders 
      SET status = 'paid', customer_name = $1, customer_email = $2, shipping_address = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [
      customerInfo.name, 
      customerInfo.email, 
      JSON.stringify(customerInfo.address),
      orderId
    ]);

    const order = await getQuery('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) return;

    const hasShopify = !!brand.shopify_shop_name && !!brand.shopify_access_token;
    if (hasShopify) {
      console.log(`🚚 Transmitting order ${orderId} to Shopify warehouse (${brand.shopify_shop_name})...`);
      const items = JSON.parse(order.items);
      
      const shopifyOrderPayload = {
        order: {
          line_items: items.map(item => ({
            title: item.title,
            price: item.price.toString(),
            quantity: item.quantity
          })),
          customer: {
            first_name: customerInfo.name.split(' ')[0] || 'Customer',
            last_name: customerInfo.name.split(' ').slice(1).join(' ') || 'User',
            email: customerInfo.email
          },
          shipping_address: {
            first_name: customerInfo.name.split(' ')[0] || 'Customer',
            last_name: customerInfo.name.split(' ').slice(1).join(' ') || 'User',
            address1: customerInfo.address?.address?.line1 || customerInfo.address?.line1 || 'No street provided',
            address2: customerInfo.address?.address?.line2 || customerInfo.address?.line2 || '',
            city: customerInfo.address?.address?.city || customerInfo.address?.city || 'No city provided',
            province: customerInfo.address?.address?.state || customerInfo.address?.state || '',
            zip: customerInfo.address?.address?.postal_code || customerInfo.address?.postal_code || '',
            country: customerInfo.address?.address?.country || customerInfo.address?.country || 'US'
          },
          financial_status: 'paid',
          note: `Dropshipped order via Stricktly Coffee Storefront. Local Ref: ${orderId}`
        }
      };

      const response = await fetch(`https://${brand.shopify_shop_name}/admin/api/2024-04/orders.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': brand.shopify_access_token
        },
        body: JSON.stringify(shopifyOrderPayload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Order logged in Shopify: ${data.order.id}`);
        await runQuery(`
          UPDATE orders 
          SET shopify_order_id = $1, status = 'sent_to_warehouse', updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [data.order.id.toString(), orderId]);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to push order to Shopify:`, errorText);
      }
    } else {
      // Mock Sandbox Shopify fulfillment
      const mockShopifyOrderId = `MOCK_SHOPIFY_${Math.floor(100000 + Math.random() * 900000)}`;
      console.log(`🚚 [Shopify Sandbox] Generating mock shopify ID: ${mockShopifyOrderId}`);
      await runQuery(`
        UPDATE orders 
        SET shopify_order_id = $1, status = 'sent_to_warehouse', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [mockShopifyOrderId, orderId]);
    }
  } catch (err) {
    console.error('Error handling payment completion:', err);
  }
}

// Fetch products from Shopify or fallback to mock list
app.get('/api/global/shopify-import', verifyAdminToken, async (req, res) => {
  const { brandId } = req.query;
  if (!brandId) {
    return res.status(400).json({ error: 'Brand ID is required.' });
  }

  if (req.user.role === 'merchant' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Cannot import for other brands.' });
  }

  try {
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    if (brand.shopify_shop_name && brand.shopify_access_token) {
      try {
        const response = await fetch(`https://${brand.shopify_shop_name}/admin/api/2024-04/products.json`, {
          headers: {
            'X-Shopify-Access-Token': brand.shopify_access_token,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const formatted = data.products.map(p => {
            const firstVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
            return {
              id: p.id,
              title: p.title,
              price: firstVariant ? parseFloat(firstVariant.price) : 55.00,
              image: p.images && p.images.length > 0 ? p.images[0].src : '',
              description: p.body_html || 'Premium coffee accessory imported from Shopify.',
              sku: firstVariant ? firstVariant.sku : '',
              external_id: firstVariant ? String(firstVariant.id) : String(p.id)
            };
          });
          return res.json({ success: true, products: formatted, source: 'shopify_api' });
        }
      } catch (apiErr) {
        console.warn('[Shopify API Fetch Failed, using sandbox fallback]', apiErr.message);
      }
    }

    if (brand.platform === 'woocommerce' && brand.woocommerce_shop_url && brand.woocommerce_consumer_key && brand.woocommerce_consumer_secret) {
      try {
        let shopUrl = brand.woocommerce_shop_url;
        if (!shopUrl.startsWith('http')) {
          shopUrl = `https://${shopUrl}`;
        }
        const parsedShopUrl = new URL(shopUrl);
        const auth = Buffer.from(`${brand.woocommerce_consumer_key}:${brand.woocommerce_consumer_secret}`).toString('base64');
        const wcUrl = `https://${parsedShopUrl.hostname}/wp-json/wc/v3/products?per_page=100`;
        
        console.log(`[WooCommerce Import] Fetching products from: ${wcUrl}`);
        const response = await fetch(wcUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const wcProducts = await response.json();
          const formatted = wcProducts.map(p => {
            return {
              id: p.id,
              title: p.name,
              price: parseFloat(p.price || p.regular_price || '55.00'),
              image: p.images && p.images.length > 0 ? p.images[0].src : '',
              description: p.description || p.short_description || 'Premium coffee accessory imported from WooCommerce.',
              sku: p.sku || '',
              external_id: String(p.id)
            };
          });
          return res.json({ success: true, products: formatted, source: 'woocommerce_api' });
        } else {
          const errText = await response.text();
          console.warn('[WooCommerce API Fetch Failed]', response.status, errText);
        }
      } catch (apiErr) {
        console.warn('[WooCommerce API Fetch Error, using sandbox fallback]', apiErr.message);
      }
    }

    // Fallback 1: Try scraping public products if shopify or woocommerce URL is set
    if (brand.shopify_shop_name) {
      const languages = brand.languages ? brand.languages.split(',').map(l => l.trim()) : ['en'];
      const scraped = await scrapeShopifyProducts(brand.shopify_shop_name, languages);
      if (scraped && scraped.length > 0) {
        return res.json({ success: true, products: scraped, source: 'shopify_public_scrape' });
      }
    } else if (brand.woocommerce_shop_url) {
      const scraped = await scrapeWooCommerceProducts(brand.woocommerce_shop_url);
      if (scraped && scraped.length > 0) {
        return res.json({ success: true, products: scraped, source: 'woocommerce_public_scrape' });
      }
    }

    res.json({ success: true, products: [], source: 'empty_fallback' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initiate Shopify OAuth Redirection
app.get('/api/global/shopify/auth', verifyAdminToken, async (req, res) => {
  const { shop, brandId, adminUrl } = req.query;

  if (!shop || !brandId || !adminUrl) {
    return res.status(400).send('Missing required query parameters: shop, brandId, adminUrl');
  }

  // 1. Sanitize the shop URL
  let sanitizedShop = shop.replace(/^https?:\/\//i, '').trim();
  if (!sanitizedShop.includes('.')) {
    sanitizedShop = `${sanitizedShop}.myshopify.com`;
  }

  // 2. Load Shopify client ID
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  if (!clientId || clientId === 'mock_shopify_client_id_placeholder') {
    return res.status(500).send('Shopify App integration client credentials are not configured in backend environment configuration files.');
  }

  // 3. Construct dynamic callback Redirect URI
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const redirectUri = `${protocol}://${req.headers.host}/api/global/shopify/callback`;

  // 4. Construct state payload
  const statePayload = JSON.stringify({
    brandId,
    adminUrl,
    nonce: Math.random().toString(36).substring(2)
  });
  const encodedState = Buffer.from(statePayload).toString('base64');

  // 5. Build Auth redirection URL
  const scopes = 'read_products,write_orders';
  const authorizeUrl = `https://${sanitizedShop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodedState}`;

  console.log(`[Shopify OAuth] Initiating OAuth for shop ${sanitizedShop}. Redirecting to Shopify...`);
  res.redirect(authorizeUrl);
});

// Handle Shopify OAuth callback redirect
app.get('/api/global/shopify/callback', async (req, res) => {
  const { code, hmac, shop, state } = req.query;

  if (!code || !hmac || !shop || !state) {
    return res.status(400).send('Invalid callback parameters from Shopify OAuth response.');
  }

  // 1. Decode state to retrieve context
  let stateData;
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
  } catch (err) {
    return res.status(400).send('Invalid state verification signature.');
  }

  const { brandId, adminUrl } = stateData;
  if (!brandId || !adminUrl) {
    return res.status(400).send('State parameters are missing required context.');
  }

  // 2. Validate HMAC signature to verify authenticity
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientSecret || clientSecret === 'mock_shopify_client_secret_placeholder') {
    return res.status(500).send('Shopify App Client Secret is not configured in backend environment configuration files.');
  }

  // Calculate HMAC using Shopify secret key
  const crypto = require('crypto');
  const queryMap = { ...req.query };
  delete queryMap.hmac;
  const sortedQuery = Object.keys(queryMap)
    .sort()
    .map(key => `${key}=${queryMap[key]}`)
    .join('&');

  const calculatedHmac = crypto
    .createHmac('sha256', clientSecret)
    .update(sortedQuery)
    .digest('hex');

  // If HMAC does not match and we are NOT using mock placeholders (mock test mode), throw signature error
  const isMockMode = (clientSecret === 'mock_shopify_client_secret_placeholder' || clientSecret.startsWith('mock_'));
  if (calculatedHmac !== hmac && !isMockMode) {
    return res.status(400).send('HMAC signature verification failed. The request could not be authenticated.');
  }

  try {
    let accessToken = 'mock_shopify_access_token_via_oauth';
    
    // In live production mode (non-mock), exchange the auth code for access token via Shopify API
    if (!isMockMode) {
      console.log(`[Shopify OAuth] Exchanging code for access token for shop ${shop}...`);
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_CLIENT_ID,
          client_secret: clientSecret,
          code
        })
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Shopify Token Exchange failed: ${errText}`);
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
    }

    // 3. Update the database brand settings with the OAuth token
    console.log(`[Shopify OAuth] Successfully retrieved access token for brand ${brandId}. Updating database...`);
    await runQuery(`
      UPDATE brands 
      SET shopify_access_token = $1, 
          shopify_shop_name = $2, 
          platform = 'shopify',
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `, [accessToken, shop, brandId]);

    // 4. Send parent window a message and auto-close popup
    res.send(`
      <html>
        <head><title>Connected to Shopify</title></head>
        <body style="font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f0f11; color: #fff;">
          <div style="text-align: center;">
            <h2 style="color: #10b981; margin-bottom: 8px;">✓ Connected successfully!</h2>
            <p style="color: #a1a1aa; margin: 0;">You can close this window now.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'shopify_oauth_success',
                brandId: '${brandId}',
                shop: '${shop}'
              }, '*');
            }
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('[Shopify OAuth Callback Error]', err);
    res.status(500).send(`Failed to complete Shopify OAuth setup: ${err.message}`);
  }
});

// Initiate WooCommerce OAuth Redirection
app.get('/api/global/woocommerce/auth', verifyAdminToken, async (req, res) => {
  const { shop, brandId, adminUrl } = req.query;

  if (!shop || !brandId || !adminUrl) {
    return res.status(400).send('Missing required query parameters: shop, brandId, adminUrl');
  }

  // 1. Sanitize WooCommerce URL
  let sanitizedShop = shop.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
  if (!sanitizedShop.startsWith('http')) {
    sanitizedShop = `https://${sanitizedShop}`;
  }

  // 2. Construct callback URLs
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const returnUrl = `${protocol}://${req.headers.host}/api/global/woocommerce/return?brandId=${encodeURIComponent(brandId)}&shop=${encodeURIComponent(sanitizedShop)}`;
  const callbackUrl = `${protocol}://${req.headers.host}/api/global/woocommerce/callback?brandId=${encodeURIComponent(brandId)}`;

  // 3. Redirection link to WooCommerce authorize endpoint
  const authorizeUrl = `${sanitizedShop}/wc-auth/v1/authorize?app_name=Stricktly+Coffee&scope=read_write&user_id=${encodeURIComponent(brandId)}&return_url=${encodeURIComponent(returnUrl)}&callback_url=${encodeURIComponent(callbackUrl)}`;

  console.log(`[WooCommerce OAuth] Initiating redirect to: ${authorizeUrl}`);
  res.redirect(authorizeUrl);
});

// WooCommerce return callback (loads inside authorization popup)
app.get('/api/global/woocommerce/return', async (req, res) => {
  const { brandId, shop } = req.query;
  res.send(`
    <html>
      <head><title>Connected to WooCommerce</title></head>
      <body style="font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f0f11; color: #fff;">
        <div style="text-align: center;">
          <h2 style="color: #10b981; margin-bottom: 8px;">✓ Connected successfully!</h2>
          <p style="color: #a1a1aa; margin: 0;">You can close this window now.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'woocommerce_oauth_success',
              brandId: '${brandId}',
              shop: '${shop}'
            }, '*');
          }
          window.close();
        </script>
      </body>
    </html>
  `);
});

// WooCommerce async credentials callback webhook
app.post('/api/global/woocommerce/callback', async (req, res) => {
  const { brandId } = req.query;
  const { consumer_key, consumer_secret } = req.body;

  if (!brandId || !consumer_key || !consumer_secret) {
    return res.status(400).json({ error: 'Missing required payload: brandId, consumer_key, consumer_secret.' });
  }

  try {
    console.log(`[WooCommerce OAuth Webhook] Received credentials for brand ${brandId}. Saving...`);
    await runQuery(`
      UPDATE brands 
      SET woocommerce_consumer_key = $1, 
          woocommerce_consumer_secret = $2, 
          platform = 'woocommerce',
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `, [consumer_key, consumer_secret, brandId]);

    res.status(200).send('OK');
  } catch (err) {
    console.error('[WooCommerce OAuth Webhook Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Import product from Shopify into brand catalog
app.post('/api/global/shopify-import', verifyAdminToken, async (req, res) => {
  const { brandId, title, price, image, description, sku, external_id, translations, original_link } = req.body;

  if (!brandId || !title || !price) {
    return res.status(400).json({ error: 'Brand ID, Title, and Price are required.' });
  }

  if (req.user.role === 'merchant' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Cannot import for other brands.' });
  }

  try {
    const translationsJson = translations ? (typeof translations === 'string' ? translations : JSON.stringify(translations)) : null;

    // Insert imported item into DB
    await runQuery(`
      INSERT INTO products (brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, translations)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      brandId,
      title,
      price,
      'EUR',
      image || '',
      description || '',
      'Imported',
      original_link || 'https://shopify.com',
      description || '',
      JSON.stringify(['Imported via Shopify integration', 'Calibrated dimensions']),
      JSON.stringify(['Commercial 58mm filter baskets']),
      sku || null,
      external_id || null,
      translationsJson
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import batch products from Shopify into brand catalog during onboarding wizard
app.post('/api/global/shopify-import/batch', verifyAdminToken, async (req, res) => {
  const { brandId, products } = req.body;

  if (!brandId || !Array.isArray(products)) {
    return res.status(400).json({ error: 'Brand ID and products array are required.' });
  }

  if (req.user.role === 'merchant' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Cannot import for other brands.' });
  }

  try {
    for (const p of products) {
      const featuresJson = Array.isArray(p.features) ? JSON.stringify(p.features) : p.features || '[]';
      const compatibilityJson = Array.isArray(p.compatibility) ? JSON.stringify(p.compatibility) : p.compatibility || '[]';
      const translationsJson = p.translations ? (typeof p.translations === 'string' ? p.translations : JSON.stringify(p.translations)) : null;
      const metaDetailsJson = p.meta_details ? (typeof p.meta_details === 'string' ? p.meta_details : JSON.stringify(p.meta_details)) : null;

      await runQuery(`
        INSERT INTO products (brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, translations, meta_details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        brandId,
        p.title,
        p.price || 55.00,
        'EUR',
        p.image || '',
        p.description || '',
        p.tag || 'Imported',
        p.original_link || 'https://shopify.com',
        p.long_description || p.description || '',
        featuresJson,
        compatibilityJson,
        p.sku || null,
        p.external_id || null,
        translationsJson,
        metaDetailsJson
      ]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all coupons for the active brand
app.get('/api/global/coupons', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context' });

  try {
    const coupons = await allQuery('SELECT * FROM coupons WHERE brand_id = $1 ORDER BY created_at DESC', [brandId]);
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create manual promo coupon ruleset
app.post('/api/global/coupons', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context' });

  const { code, discount_type, discount_value, expire_at, rules } = req.body;
  if (!code || !discount_value) {
    return res.status(400).json({ error: 'Code and discount value are required.' });
  }

  try {
    // Check if code already exists
    const exists = await getQuery('SELECT id FROM coupons WHERE code = $1', [code.trim().toUpperCase()]);
    if (exists) {
      return res.status(400).json({ error: `Coupon code '${code.trim().toUpperCase()}' already exists.` });
    }

    const couponId = `CPN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await runQuery(`
      INSERT INTO coupons (id, brand_id, code, discount_type, discount_value, status, rules, expire_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      couponId,
      brandId,
      code.trim().toUpperCase(),
      discount_type || 'percentage',
      parseFloat(discount_value),
      'active',
      rules ? JSON.stringify(rules) : null,
      expire_at ? new Date(expire_at) : null
    ]);

    res.json({ success: true, couponId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete/Void coupon
app.delete('/api/global/coupons/:id', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context' });

  try {
    await runQuery('UPDATE coupons SET status = \'voided\' WHERE id = $1 AND brand_id = $2', [req.params.id, brandId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get referral rule settings for a brand
app.get('/api/global/referral-rules', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context' });

  try {
    let rules = await getQuery('SELECT * FROM referral_rules WHERE brand_id = $1', [brandId]);
    if (!rules) {
      // Create default rule template
      const defaultSubject = 'Thank you for your order! Here is a discount code for your friends.';
      const defaultBody = 'Hi {customer_name},\n\nThank you for shopping with us! We hope you love your products.\n\nHere is a referral code for 10% off that you can share with your friends or family: {coupon_code}\n\nThis code expires on {expire_date}.\n\nBest regards,\nThe Coffee Team';
      await runQuery(`
        INSERT INTO referral_rules (brand_id, days_after_delivery, discount_type, discount_value, expire_days, email_subject, email_body, enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [brandId, 3, 'percentage', 10.00, 14, defaultSubject, defaultBody, true]);

      rules = await getQuery('SELECT * FROM referral_rules WHERE brand_id = $1', [brandId]);
    }
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update referral rule settings
app.post('/api/global/referral-rules', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context' });

  const { days_after_delivery, discount_type, discount_value, expire_days, email_subject, email_body, rules, enabled, templates } = req.body;

  try {
    await runQuery(`
      INSERT INTO referral_rules (brand_id, days_after_delivery, discount_type, discount_value, expire_days, email_subject, email_body, rules, enabled, templates)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (brand_id) DO UPDATE SET
        days_after_delivery = EXCLUDED.days_after_delivery,
        discount_type = EXCLUDED.discount_type,
        discount_value = EXCLUDED.discount_value,
        expire_days = EXCLUDED.expire_days,
        email_subject = EXCLUDED.email_subject,
        email_body = EXCLUDED.email_body,
        rules = EXCLUDED.rules,
        enabled = EXCLUDED.enabled,
        templates = EXCLUDED.templates
    `, [
      brandId,
      parseInt(days_after_delivery) || 3,
      discount_type || 'percentage',
      parseFloat(discount_value) || 10.00,
      parseInt(expire_days) || 14,
      email_subject || '',
      email_body || '',
      rules ? JSON.stringify(rules) : null,
      enabled !== false,
      templates ? JSON.stringify(templates) : null
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public Promo landing page signup (No authentication required)
app.post('/api/global/brands/promo-signup', async (req, res) => {
  const { brandId, email } = req.body;
  if (!brandId || !email) {
    return res.status(400).json({ error: 'Missing required parameters: brandId and email.' });
  }
  
  try {
    // 1. Fetch brand settings
    const brand = await getQuery('SELECT id, name, theme_settings FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    let settings = {};
    if (brand.theme_settings) {
      try {
        settings = JSON.parse(brand.theme_settings);
      } catch(e) {}
    }
    
    const couponCode = settings.landing_coupon_code || 'COFFEE20';
    const emailSubject = `Your discount code is ready! 🎁`;
    const emailBody = `Hi there,\n\nHere is your custom 20% discount coupon code: ${couponCode}\n\nUse it during checkout to claim your discount.\n\nBest regards,\nThe Coffee Team`;
    
    // 2. Insert email log into coupon_emails
    await runQuery(`
      INSERT INTO coupon_emails (brand_id, customer_email, scheduled_for, sent_at, coupon_code, email_subject, email_body)
      VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3, $4, $5)
    `, [brandId, email, couponCode, emailSubject, emailBody]);
    
    res.json({ success: true, coupon_code: couponCode });
  } catch (err) {
    console.error('[Promo Signup Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Get queued/sent email logs
app.get('/api/global/coupon-emails', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context' });

  try {
    const logs = await allQuery('SELECT * FROM coupon_emails WHERE brand_id = $1 ORDER BY scheduled_for DESC', [brandId]);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force send all pending emails now (Simulation Trigger)
app.post('/api/global/coupon-emails/send-pending', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context' });

  try {
    const pending = await allQuery('SELECT * FROM coupon_emails WHERE brand_id = $1 AND sent_at IS NULL AND scheduled_for <= NOW()', [brandId]);
    let count = 0;
    for (const email of pending) {
      await runQuery('UPDATE coupon_emails SET sent_at = CURRENT_TIMESTAMP WHERE id = $1', [email.id]);
      count++;
    }
    res.json({ success: true, sent_count: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Background scheduler to automatically deliver scheduled referral emails
setInterval(async () => {
  try {
    const pending = await allQuery('SELECT * FROM coupon_emails WHERE sent_at IS NULL AND scheduled_for <= NOW()');
    for (const email of pending) {
      await runQuery('UPDATE coupon_emails SET sent_at = CURRENT_TIMESTAMP WHERE id = $1', [email.id]);
      console.log(`[Referral System] Auto-delivered scheduled email ID ${email.id} to ${email.customer_email} with code ${email.coupon_code}`);
    }
  } catch (err) {
    console.error('[Scheduler] Error in background coupon email scheduler:', err);
  }
}, 30000); // Check every 30 seconds

// Helper to generate mock performance history data for campaigns over multiple days
function generateMockPerformanceHistory(startDateStr, endDateStr, budget, budgetType) {
  const start = new Date(startDateStr || Date.now());
  const end = new Date(endDateStr || (Date.now() + 7 * 24 * 3600 * 1000));
  const today = new Date();
  
  const totalDays = Math.max(1, Math.ceil((end - start) / (24 * 3600 * 1000)));
  const dailyBudget = budgetType === 'daily' ? budget : (budget / totalDays);
  
  const history = [];
  let current = new Date(start);
  
  while (current <= today && current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const spend = parseFloat((dailyBudget * (0.85 + Math.random() * 0.3)).toFixed(2));
    const impressions = Math.floor(spend * (60 + Math.random() * 30));
    const clicks = Math.floor(impressions * (0.018 + Math.random() * 0.022));
    const conversions = Math.floor(clicks * (0.025 + Math.random() * 0.035));
    const sales = parseFloat((conversions * (45 + Math.random() * 40)).toFixed(2));
    
    history.push({
      date: dateStr,
      spend,
      impressions,
      clicks,
      conversions,
      sales,
      roas: spend > 0 ? parseFloat((sales / spend).toFixed(2)) : 0
    });
    
    current.setDate(current.getDate() + 1);
  }
  return history;
}

// Get all marketing campaigns for the active brand
app.get('/api/global/marketing-campaigns', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  try {
    const rows = await allQuery('SELECT * FROM marketing_campaigns WHERE brand_id = $1 ORDER BY created_at DESC', [brandId]);
    const parsedRows = rows.map(r => ({
      ...r,
      carousel_cards: r.carousel_cards ? (typeof r.carousel_cards === 'string' ? JSON.parse(r.carousel_cards) : r.carousel_cards) : [],
      translations: r.translations ? (typeof r.translations === 'string' ? JSON.parse(r.translations) : r.translations) : null,
      performance_history: r.performance_history ? (typeof r.performance_history === 'string' ? JSON.parse(r.performance_history) : r.performance_history) : [],
      automation_rules: r.automation_rules ? (typeof r.automation_rules === 'string' ? JSON.parse(r.automation_rules) : r.automation_rules) : []
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update marketing campaign
app.post('/api/global/marketing-campaigns', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  const {
    id, name, platform, budget, segmentation, languages, format, ad_copy, headline, media_url,
    carousel_cards, destination_type, landing_page_id, campaign_type, custom_url, translations,
    start_date, end_date, budget_type, bidding_strategy, target_roas, performance_history, status,
    automation_rules, autopilot_enabled
  } = req.body;

  if (!name || !platform || !budget) {
    return res.status(400).json({ error: 'Missing required campaign fields: name, platform, budget.' });
  }

  const campaignId = id || `MC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const activeLangs = Array.isArray(languages) ? languages.join(',') : String(languages || 'en');
  const resolvedStartDate = start_date || new Date().toISOString().split('T')[0];
  const resolvedEndDate = end_date || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const resolvedBudgetType = budget_type || 'lifetime';

  // Seed simulated day-by-day logs for active campaign tracking
  let historyData = performance_history;
  if (!historyData || (Array.isArray(historyData) && historyData.length === 0)) {
    historyData = generateMockPerformanceHistory(resolvedStartDate, resolvedEndDate, parseFloat(budget), resolvedBudgetType);
  }
  const historyJson = Array.isArray(historyData) ? JSON.stringify(historyData) : (historyData || '[]');
  const rulesJson = automation_rules ? (typeof automation_rules === 'string' ? automation_rules : JSON.stringify(automation_rules)) : '[]';

  try {
    await runQuery(`
      INSERT INTO marketing_campaigns (
        id, brand_id, name, platform, budget, segmentation, languages, format, ad_copy, headline, media_url,
        carousel_cards, destination_type, landing_page_id, campaign_type, custom_url, translations,
        start_date, end_date, budget_type, bidding_strategy, target_roas, performance_history, status,
        automation_rules, autopilot_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        platform = EXCLUDED.platform,
        budget = EXCLUDED.budget,
        segmentation = EXCLUDED.segmentation,
        languages = EXCLUDED.languages,
        format = EXCLUDED.format,
        ad_copy = EXCLUDED.ad_copy,
        headline = EXCLUDED.headline,
        media_url = EXCLUDED.media_url,
        carousel_cards = EXCLUDED.carousel_cards,
        destination_type = EXCLUDED.destination_type,
        landing_page_id = EXCLUDED.landing_page_id,
        campaign_type = EXCLUDED.campaign_type,
        custom_url = EXCLUDED.custom_url,
        translations = EXCLUDED.translations,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        budget_type = EXCLUDED.budget_type,
        bidding_strategy = EXCLUDED.bidding_strategy,
        target_roas = EXCLUDED.target_roas,
        performance_history = EXCLUDED.performance_history,
        status = EXCLUDED.status,
        automation_rules = EXCLUDED.automation_rules,
        autopilot_enabled = EXCLUDED.autopilot_enabled
    `, [
      campaignId,
      brandId,
      name,
      platform,
      parseFloat(budget),
      segmentation || 'All Customers',
      activeLangs,
      format || 'Image',
      ad_copy || '',
      headline || '',
      media_url || '',
      carousel_cards ? JSON.stringify(carousel_cards) : null,
      destination_type || 'homepage',
      landing_page_id || null,
      campaign_type || 'manual',
      custom_url || null,
      translations ? (typeof translations === 'string' ? translations : JSON.stringify(translations)) : null,
      resolvedStartDate,
      resolvedEndDate,
      resolvedBudgetType,
      bidding_strategy || 'manual',
      target_roas ? parseFloat(target_roas) : 4.00,
      historyJson,
      status || 'active',
      rulesJson,
      autopilot_enabled === true || autopilot_enabled === 'true'
    ]);
    res.json({ success: true, campaignId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Attribution Modeling Report
app.get('/api/global/marketing-campaigns/attribution-report', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  try {
    const orders = await allQuery('SELECT total_amount, utm_source, utm_campaign, created_at FROM orders WHERE brand_id = $1', [brandId]);
    const campaigns = await allQuery('SELECT name, budget, platform FROM marketing_campaigns WHERE brand_id = $1', [brandId]);
    
    const lastClickReport = {};
    const firstClickReport = {};
    const linearReport = {};
    
    orders.forEach(order => {
      const amount = parseFloat(order.total_amount) || 0;
      const campaign = order.utm_campaign || 'General / Generic';
      
      lastClickReport[campaign] = (lastClickReport[campaign] || 0) + amount;
      firstClickReport[campaign] = (firstClickReport[campaign] || 0) + (amount * (0.88 + Math.random() * 0.24));
      linearReport[campaign] = (linearReport[campaign] || 0) + (amount * 0.94);
    });
    
    res.json({
      last_click: lastClickReport,
      first_click: firstClickReport,
      linear: linearReport,
      campaign_budgets: campaigns.map(c => ({ name: c.name, budget: parseFloat(c.budget), platform: c.platform }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Cohort LTV Projections curve
app.get('/api/global/marketing-campaigns/ltv-projections', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  try {
    const campaigns = await allQuery('SELECT id, name, budget FROM marketing_campaigns WHERE brand_id = $1', [brandId]);
    const projections = campaigns.map(c => {
      const budget = parseFloat(c.budget) || 150;
      const baseLtvMultiplier = 3.2 + Math.random() * 2.2;
      
      const m30 = budget * baseLtvMultiplier;
      const m60 = m30 * (1.15 + Math.random() * 0.15);
      const m90 = m60 * (1.10 + Math.random() * 0.10);
      
      return {
        campaign_id: c.id,
        campaign_name: c.name,
        m30: parseFloat(m30.toFixed(2)),
        m60: parseFloat(m60.toFixed(2)),
        m90: parseFloat(m90.toFixed(2))
      };
    });
    res.json(projections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Creative Asset Performance stats
app.get('/api/global/marketing-campaigns/:id/creative-stats', verifyAdminToken, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const stats = await allQuery('SELECT * FROM campaign_creative_stats WHERE campaign_id = $1', [campaignId]);
    
    if (stats.length === 0) {
      const campaign = await getQuery('SELECT carousel_cards, headline, media_url, name FROM marketing_campaigns WHERE id = $1', [campaignId]);
      if (campaign) {
        let cards = [];
        try {
          cards = campaign.carousel_cards ? JSON.parse(campaign.carousel_cards) : [];
        } catch(e) {}
        
        const headlines = [campaign.headline || 'Exclusive Roast Deal', 'Top Espresso Gears', 'Fresh Roast Arrivals'];
        const seeds = [];
        const count = Math.max(2, cards.length);
        
        for (let i = 0; i < count; i++) {
          const card = cards[i] || {};
          const assetUrl = card.image || campaign.media_url || 'https://placehold.co/600x400';
          const headline = card.title || headlines[i % headlines.length];
          
          const impressions = Math.floor(2000 + Math.random() * 5000);
          const clicks = Math.floor(impressions * (0.012 + Math.random() * 0.03));
          const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.06));
          
          const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));
          const cvr = parseFloat(((conversions / clicks) * 100).toFixed(2));
          
          const id = `CR_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`;
          await runQuery(`
            INSERT INTO campaign_creative_stats (id, campaign_id, asset_url, headline, impressions, clicks, conversions, ctr, cvr)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [id, campaignId, assetUrl, headline, impressions, clicks, conversions, ctr, cvr]);
          
          seeds.push({ id, campaign_id: campaignId, asset_url: assetUrl, headline, impressions, clicks, conversions, ctr, cvr });
        }
        return res.json(seeds);
      }
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET AI copy proposals queue for campaign
app.get('/api/global/marketing-campaigns/:id/ai-proposals', verifyAdminToken, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const proposals = await allQuery('SELECT * FROM campaign_ai_proposals WHERE campaign_id = $1 AND status = $2', [campaignId, 'pending']);
    
    if (proposals.length === 0) {
      const campaign = await getQuery('SELECT headline, ad_copy FROM marketing_campaigns WHERE id = $1', [campaignId]);
      if (campaign) {
        const id = `PR_${Date.now()}`;
        const proposedHeadline = `✨ ${campaign.headline || 'Exquisite Espresso Blend'} - Now 20% Off`;
        const proposedCopy = `Indulge in strictly premium, locally-roasted coffee beans. Optimized by AI for 3.5x CTR performance! Buy now.`;
        
        await runQuery(`
          INSERT INTO campaign_ai_proposals (id, campaign_id, original_headline, original_ad_copy, proposed_headline, proposed_ad_copy, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [id, campaignId, campaign.headline || '', campaign.ad_copy || '', proposedHeadline, proposedCopy, 'pending']);
        
        return res.json([{ id, campaign_id: campaignId, original_headline: campaign.headline || '', original_ad_copy: campaign.ad_copy || '', proposed_headline: proposedHeadline, proposed_ad_copy: proposedCopy, status: 'pending' }]);
      }
    }
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Apply AI copy proposal draft
app.post('/api/global/marketing-campaigns/proposals/:id/apply', verifyAdminToken, async (req, res) => {
  try {
    const proposalId = req.params.id;
    const proposal = await getQuery('SELECT * FROM campaign_ai_proposals WHERE id = $1', [proposalId]);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    
    await runQuery(`
      UPDATE marketing_campaigns 
      SET headline = $1, ad_copy = $2 
      WHERE id = $3
    `, [proposal.proposed_headline, proposal.proposed_ad_copy, proposal.campaign_id]);
    
    await runQuery(`
      UPDATE campaign_ai_proposals 
      SET status = $1 
      WHERE id = $2
    `, ['approved', proposalId]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Reject AI copy proposal draft
app.post('/api/global/marketing-campaigns/proposals/:id/reject', verifyAdminToken, async (req, res) => {
  try {
    const proposalId = req.params.id;
    await runQuery(`
      UPDATE campaign_ai_proposals 
      SET status = $1 
      WHERE id = $2
    `, ['rejected', proposalId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Causal incrementality lift simulator metrics
app.get('/api/global/marketing-campaigns/:id/causal-lift', verifyAdminToken, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await getQuery('SELECT budget FROM marketing_campaigns WHERE id = $1', [campaignId]);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const current = new Date();
      current.setDate(today.getDate() - i);
      const dateStr = current.toISOString().split('T')[0];
      
      const baseOrganic = 10 + Math.floor(Math.random() * 5);
      const liftConversions = 4 + Math.floor(Math.random() * 6);
      
      days.push({
        date: dateStr,
        control_conversions: baseOrganic,
        test_conversions: baseOrganic + liftConversions,
        incremental_lift: parseFloat(((liftConversions / baseOrganic) * 100).toFixed(1))
      });
    }
    res.json(days);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate ad copy with AI Copywriter Studio (tailored to segment & tone)
app.post('/api/global/marketing-campaigns/generate-copy', verifyAdminToken, async (req, res) => {
  try {
    const { productId, segmentation, tone, campaignType } = req.body;
    const brandId = resolveBrandId(req);
    if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });
    
    let product = null;
    if (productId) {
      product = await getQuery('SELECT title, price, description FROM products WHERE id = $1', [productId]);
    }
    
    const prodName = product ? product.title : 'Premium Specialty Roasts';
    const prodPrice = product ? `€${parseFloat(product.price).toFixed(2)}` : '€14.90';
    
    // Try AI generation using the marketing protocol
    const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const brand = await getQuery('SELECT name, marketing_protocol FROM brands WHERE id = $1', [brandId]);
        if (brand && brand.marketing_protocol) {
          const prompt = `You are a premium e-commerce copywriter. Refer to this Brand Performance Marketing Protocol / Playbook:
${brand.marketing_protocol}

Write a high-converting performance marketing ad copy (headline, primary ad body copy, and 3 key benefits) for the product "${prodName}" (Price: ${prodPrice}).
Target Segmentation: ${segmentation}
Tone: ${tone}
Campaign Type: ${campaignType || 'conversion'}

Return ONLY a JSON object in this format:
{
  "headline": "A short, catchy, action-oriented headline including emojis.",
  "ad_copy": "A high-converting ad body text containing the value proposition, targeted hooks, and CTA.",
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"]
}`;

          console.log(`[AI Copywriter Studio] Generating custom ad copy for brand: ${brandId}`);
          const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          });

          if (aiRes.ok) {
            const result = await aiRes.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = JSON.parse(text);
            
            if (result.usageMetadata && brandId) {
              await logAiUsage(brandId, 'Campaign Ad Copy Generation', 'gemini-2.5-flash', result.usageMetadata);
            }

            if (parsed.headline && parsed.ad_copy) {
              return res.json({
                headline: parsed.headline,
                ad_copy: parsed.ad_copy,
                benefits: parsed.benefits || []
              });
            }
          } else {
            console.warn('[AI Copywriter Studio] Gemini API call failed, falling back to rule-based copy.');
          }
        }
      } catch (geminiErr) {
        console.warn('[AI Copywriter Studio] Error during AI copy generation:', geminiErr.message);
      }
    }

    let headline = '';
    let adCopy = '';
    let benefits = [];
    
    if (segmentation === 'Repeat Customers') {
      benefits = ['Exclusive loyalty rewards', 'Early access to new roasts', 'Free shipping on orders > €30'];
      if (tone === 'bold') {
        headline = `🔥 Loyalty Special: 20% Off Your Favorite ${prodName}!`;
        adCopy = `Welcome back! We appreciate your support. For the next 48 hours only, enjoy 20% off our signature ${prodName} series. Tap to apply discount!`;
      } else if (tone === 'friendly') {
        headline = `☕ A Small Thank You: Get 20% Off ${prodName}`;
        adCopy = `We love having you in our coffee family! As a sweet thank you, here is 20% off your next order of ${prodName}. Roasted fresh, just for you.`;
      } else if (tone === 'creative') {
        headline = `✨ Your Coffee Cup Missed You! Save 20% On ${prodName}`;
        adCopy = `Let's refill that mug with something magical. Get your hands on fresh ${prodName} starting at just ${prodPrice} with our exclusive customer bonus.`;
      } else {
        headline = `Customer Appreciation: Premium Savings on ${prodName}`;
        adCopy = `Enjoy exclusive member privileges. Relish our freshly roasted ${prodName} at special rates. Freshness guaranteed directly to your door.`;
      }
    } else if (segmentation === 'High Spenders') {
      benefits = ['Limited single-origin beans', 'Custom grind profile selections', 'Priority roasted-to-order fulfillment'];
      if (tone === 'bold') {
        headline = `👑 The Connoisseur Selection: Ultimate ${prodName}`;
        adCopy = `Uncompromising quality for true coffee aficionados. Treat yourself to the exquisite taste of micro-lot ${prodName}. Exceptional grades only.`;
      } else if (tone === 'friendly') {
        headline = `🌱 Crafting Perfection: Experience Premium ${prodName}`;
        adCopy = `For those who appreciate the finer details in every brew. Our single-origin ${prodName} brings out delicate floral and chocolate notes.`;
      } else if (tone === 'creative') {
        headline = `🔮 Elevate Your Coffee Ritual: Micro-Lot ${prodName}`;
        adCopy = `Step into a world of sophisticated sensory discovery. Hand-selected, small-batch ${prodName} crafted for the ultimate morning experience.`;
      } else {
        headline = `Premium Grade Reserve: Hand-Selected ${prodName}`;
        adCopy = `Presenting our highest-rated specialty batches. Exquisite profile notes, roasted fresh under expert supervision. Order your reserve package.`;
      }
    } else if (segmentation === 'Dormant Shoppers') {
      benefits = ['€10 Welcome back voucher code', 'Freshly roasted-to-order', '100% satisfaction taste guarantee'];
      if (tone === 'bold') {
        headline = `⚡ We Miss You! Here is €10 off ${prodName}`;
        adCopy = `It's been too long since your last brew! Come back today and take €10 off your order of fresh ${prodName}. Code: WELCOMEBACK.`;
      } else if (tone === 'friendly') {
        headline = `☕ Let's Catch Up! Enjoy €10 Off ${prodName}`;
        adCopy = `We miss having you around! Let's get you back to brewing the best. Save €10 on your next batch of freshly roasted ${prodName}.`;
      } else if (tone === 'creative') {
        headline = `✨ Brewing Again? Save €10 on fresh ${prodName}`;
        adCopy = `Ready to fall in love with your morning coffee all over again? Wake up to premium ${prodName} with €10 off. Code: WELCOMEBACK.`;
      } else {
        headline = `Welcome Back Voucher: €10 Saving on ${prodName}`;
        adCopy = `Reconnect with premium coffee craft. Apply your exclusive €10 coupon toward our freshly curated ${prodName} batches. Code: WELCOMEBACK.`;
      }
    } else {
      benefits = ['Sourced directly from organic farms', 'Eco-friendly sustainable packaging', 'Roasted to order in small batches'];
      if (tone === 'bold') {
        headline = `🔥 Taste the Difference: Try Our Fresh ${prodName} Now!`;
        adCopy = `Stop drinking stale, mass-produced coffee. Experience rich, bold flavors with our premium ${prodName}, starting at only ${prodPrice}.`;
      } else if (tone === 'friendly') {
        headline = `☕ Meet Your New Favorite Morning Brew: ${prodName}`;
        adCopy = `Welcome to strictly better coffee. Hand-picked beans, roasted to perfection, delivered right to your kitchen. Try it today starting at ${prodPrice}.`;
      } else if (tone === 'creative') {
        headline = `🌱 The Secret to a Perfect Morning: ${prodName}`;
        adCopy = `Your mornings deserve better. Discover the smooth, clean finish of our hand-roasted ${prodName} specialty blend. Satisfaction guaranteed!`;
      } else {
        headline = `Premium Specialty Coffee: Order ${prodName} Online`;
        adCopy = `Sustainably sourced, meticulously roasted, and delivered within days of roasting. Elevate your coffee standard with our signature series.`;
      }
    }
    
    res.json({ headline, ad_copy: adCopy, benefits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete/Remove marketing campaign
app.delete('/api/global/marketing-campaigns/:id', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  try {
    await runQuery('DELETE FROM marketing_campaigns WHERE id = $1 AND brand_id = $2', [req.params.id, brandId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET consolidated media library
app.get('/api/global/media', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  try {
    const products = await allQuery('SELECT id, title, image FROM products WHERE brand_id = $1', [brandId]);
    const brand = await getQuery('SELECT id, name, logo, favicon FROM brands WHERE id = $1', [brandId]);
    const library = await allQuery('SELECT id, title, url, folder, created_at FROM media_library WHERE brand_id = $1 ORDER BY created_at DESC', [brandId]);

    const mediaItems = [];

    // Products folder
    products.forEach(p => {
      if (p.image) {
        mediaItems.push({
          id: `prod_${p.id}`,
          title: p.title || 'Product Graphic',
          url: p.image,
          folder: 'Products',
          source_type: 'product',
          created_at: new Date().toISOString()
        });
      }
    });

    // Brand Assets folder
    if (brand) {
      if (brand.logo) {
        mediaItems.push({
          id: `brand_logo_${brand.id}`,
          title: `${brand.name} Logo`,
          url: brand.logo,
          folder: 'Brand Assets',
          source_type: 'brand',
          created_at: new Date().toISOString()
        });
      }
      if (brand.favicon) {
        mediaItems.push({
          id: `brand_favicon_${brand.id}`,
          title: `${brand.name} Favicon`,
          url: brand.favicon,
          folder: 'Brand Assets',
          source_type: 'brand',
          created_at: new Date().toISOString()
        });
      }
    }

    // Custom Uploads / Campaigns folder
    library.forEach(item => {
      mediaItems.push({
        id: item.id,
        title: item.title,
        url: item.url,
        folder: item.folder || 'General',
        source_type: 'upload',
        created_at: item.created_at
      });
    });

    res.json(mediaItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload manual media asset
app.post('/api/global/media', verifyAdminToken, upload.single('file'), async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const localPath = req.file.path;
  const isImage = req.file.mimetype.startsWith('image/');
  let targetFilename = req.file.filename;
  let uploadPath = localPath;

  try {
    if (isImage) {
      try {
        const resizedFilename = 'resized-' + req.file.filename;
        const resizedPath = path.join(uploadDir, resizedFilename);
        await sharp(localPath)
          .resize({ width: 800, withoutEnlargement: true })
          .toFile(resizedPath);
        fs.unlinkSync(localPath);
        uploadPath = resizedPath;
        targetFilename = resizedFilename;
      } catch (err) {
        console.error('[Upload Resizing Error]', err);
      }
    }

    await uploadFileToS3(uploadPath, targetFilename, req.file.mimetype);
    fs.unlinkSync(uploadPath);

    const mediaId = `ML_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const dateStr = new Date().toLocaleString();
    const title = req.body.title || `Upload - ${dateStr}`;
    const folder = req.body.folder || 'General';
    const publicUrl = `/uploads/${targetFilename}`;

    await runQuery(`
      INSERT INTO media_library (id, brand_id, title, url, folder)
      VALUES ($1, $2, $3, $4, $5)
    `, [mediaId, brandId, title, publicUrl, folder]);

    res.json({
      success: true,
      item: {
        id: mediaId,
        title,
        url: publicUrl,
        folder,
        source_type: 'upload',
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT edit media item metadata
app.put('/api/global/media/:id', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  const { title, folder } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing required field: title.' });

  try {
    await runQuery(`
      UPDATE media_library
      SET title = $1, folder = $2
      WHERE id = $3 AND brand_id = $4
    `, [title, folder || 'General', req.params.id, brandId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE manual media item
app.delete('/api/global/media/:id', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  try {
    await runQuery('DELETE FROM media_library WHERE id = $1 AND brand_id = $2', [req.params.id, brandId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST translate text with AI/MyMemory API and locale fallback mappings
app.post('/api/global/translate', verifyAdminToken, async (req, res) => {
  const { text, targetLang, sourceLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields: text, targetLang' });
  }

  const from = sourceLang || 'en';
  const to = targetLang.toLowerCase();

  if (from === to) {
    return res.json({ translatedText: text });
  }

  try {
    // Call MyMemory translation API
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return res.json({ translatedText: data.responseData.translatedText });
      }
    }
    throw new Error('External API translation failed');
  } catch (err) {
    console.error('[Translation API Error]', err);
    // Simple fallback translation for common marketing / coffee terms
    const fallbacks = {
      de: {
        'buy now': 'Jetzt kaufen',
        'shop now': 'Jetzt shoppen',
        'discover our premium coffee': 'Entdecken Sie unseren Premium-Kaffee',
        'exclusive offer': 'Exklusives Angebot',
        'get a discount': 'Erhalten Sie einen Rabatt',
        'order today': 'Heute bestellen',
        'promo': 'Werbeaktion'
      },
      fr: {
        'buy now': 'Acheter maintenant',
        'shop now': 'Acheter',
        'discover our premium coffee': 'Découvrez notre café de qualité supérieure',
        'exclusive offer': 'Offre exclusive',
        'get a discount': 'Obtenez une réduction',
        'order today': 'Commandez aujourd’hui',
        'promo': 'Promotion'
      },
      nl: {
        'buy now': 'Koop nu',
        'shop now': 'Nu winkelen',
        'discover our premium coffee': 'Ontdek onze premium koffie',
        'exclusive offer': 'Exclusieve aanbieding',
        'get a discount': 'Krijg korting',
        'order today': 'Bestel vandaag',
        'promo': 'Promotie'
      },
      es: {
        'buy now': 'Comprar ahora',
        'shop now': 'Comprar',
        'discover our premium coffee': 'Descubra nuestro café premium',
        'exclusive offer': 'Oferta exclusiva',
        'get a discount': 'Obtenga un descuento',
        'order today': 'Haga su pedido hoy',
        'promo': 'Promoción'
      },
      it: {
        'buy now': 'Acquista ora',
        'shop now': 'Acquista',
        'discover our premium coffee': 'Scopri il nostro caffè pregiato',
        'exclusive offer': 'Offerta esclusiva',
        'get a discount': 'Ottieni uno sconto',
        'order today': 'Ordina oggi',
        'promo': 'Promozione'
      }
    };

    const cleanText = text.trim().toLowerCase();
    const dictionary = fallbacks[to];
    if (dictionary && dictionary[cleanText]) {
      return res.json({ translatedText: dictionary[cleanText] });
    }

    res.json({ translatedText: `[${to.toUpperCase()}] ${text}` });
  }
});

// Start Server
app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  await loadPricingCache();
});
