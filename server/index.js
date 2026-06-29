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
import nodemailer from 'nodemailer';

dotenv.config();

// AbortControllers map for cancelable background jobs
const activeAborts = new Map();

// Global Fetch Interceptor to translate invalid/experimental model names to active Google API ones
const originalFetch = globalThis.fetch;
globalThis.fetch = async function(url, options) {
  let urlStr = '';
  if (typeof url === 'string') {
    urlStr = url;
  } else if (url && typeof url === 'object' && url.href) {
    urlStr = url.href;
  } else if (url && typeof url === 'object' && url.url) {
    urlStr = url.url;
  }

  let replacedStr = urlStr;

  if (urlStr) {
    if (urlStr.includes('models/gemini-3.1-pro')) {
      replacedStr = urlStr.replace('models/gemini-3.1-pro', 'models/gemini-3.1-pro-preview');
      console.log(`[AI Fetch Interceptor] Rewrote model path to gemini-3.1-pro-preview for: ${urlStr}`);
    } else if (urlStr.includes('models/deep-research-pro-preview')) {
      replacedStr = urlStr.replace('models/deep-research-pro-preview', 'models/deep-research-pro-preview-12-2025');
      console.log(`[AI Fetch Interceptor] Rewrote model path to deep-research-pro-preview-12-2025 for: ${urlStr}`);
    }

    if (replacedStr !== urlStr) {
      if (typeof url === 'string') {
        url = replacedStr;
      } else if (url && typeof url === 'object' && url.href) {
        try {
          url = new URL(replacedStr);
        } catch (e) {
          url.href = replacedStr;
        }
      } else if (url && typeof url === 'object' && url.url) {
        try {
          url = new Request(replacedStr, url);
        } catch (e) {
          url.url = replacedStr;
        }
      }
    }
  }

  let res = await originalFetch(url, options);

  // If call to v1beta fails with 404 or 400, retry using stable v1 version first
  let currentUrlStr = replacedStr;
  if (!res.ok && (res.status === 404 || res.status === 400) && currentUrlStr && currentUrlStr.includes('/v1beta/')) {
    const stableStr = currentUrlStr.replace('/v1beta/', '/v1/');
    console.log(`[AI Fetch Interceptor] Request failed on v1beta. Retrying with stable v1 endpoint: ${stableStr}`);
    let stableUrl = url;
    if (typeof url === 'string') {
      stableUrl = stableStr;
    } else if (url && typeof url === 'object' && url.href) {
      try {
        stableUrl = new URL(stableStr);
      } catch (e) {
        url.href = stableStr;
        stableUrl = url;
      }
    } else if (url && typeof url === 'object' && url.url) {
      try {
        stableUrl = new Request(stableStr, url);
      } catch (e) {
        url.url = stableStr;
        stableUrl = url;
      }
    }
    res = await originalFetch(stableUrl, options);
    if (res.ok) {
      return res; // succeeded!
    }
    currentUrlStr = stableStr; // update url string for potential next fallbacks
  }

  // Fallback 1: If deep-research-pro-preview-12-2025 fails, fallback to gemini-3.1-pro-preview
  if (!res.ok && currentUrlStr && currentUrlStr.includes('models/deep-research-pro-preview-12-2025')) {
    const fallbackStr = currentUrlStr.replace('models/deep-research-pro-preview-12-2025', 'models/gemini-3.1-pro-preview');
    console.warn(`[AI Fetch Interceptor] deep-research-pro-preview-12-2025 call failed. Falling back transparently to gemini-3.1-pro-preview: ${fallbackStr}`);
    
    let fallbackUrl = url;
    if (typeof url === 'string') {
      fallbackUrl = fallbackStr;
    } else if (url && typeof url === 'object' && url.href) {
      try {
        fallbackUrl = new URL(fallbackStr);
      } catch (e) {
        url.href = fallbackStr;
        fallbackUrl = url;
      }
    } else if (url && typeof url === 'object' && url.url) {
      try {
        fallbackUrl = new Request(fallbackStr, url);
      } catch (e) {
        url.url = fallbackStr;
        fallbackUrl = url;
      }
    }

    res = await originalFetch(fallbackUrl, options);
    currentUrlStr = fallbackStr;
  }

  // Fallback 2: If gemini-3.1-pro-preview (or gemini-2.5-pro) fails, fallback to gemini-2.5-flash
  if (!res.ok && currentUrlStr && (currentUrlStr.includes('models/gemini-3.1-pro-preview') || currentUrlStr.includes('models/gemini-2.5-pro'))) {
    const targetFallback = 'models/gemini-2.5-flash';
    let fallbackStr = currentUrlStr;
    if (currentUrlStr.includes('models/gemini-3.1-pro-preview')) {
      fallbackStr = currentUrlStr.replace('models/gemini-3.1-pro-preview', targetFallback);
    } else {
      fallbackStr = currentUrlStr.replace('models/gemini-2.5-pro', targetFallback);
    }
    console.warn(`[AI Fetch Interceptor] Pro model call failed. Falling back transparently to gemini-2.5-flash: ${fallbackStr}`);
    
    let fallbackUrl = url;
    if (typeof url === 'string') {
      fallbackUrl = fallbackStr;
    } else if (url && typeof url === 'object' && url.href) {
      try {
        fallbackUrl = new URL(fallbackStr);
      } catch (e) {
        url.href = fallbackStr;
        fallbackUrl = url;
      }
    } else if (url && typeof url === 'object' && url.url) {
      try {
        fallbackUrl = new Request(fallbackStr, url);
      } catch (e) {
        url.url = fallbackStr;
        fallbackUrl = url;
      }
    }

    res = await originalFetch(fallbackUrl, options);
  }

  return res;
};

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

// Helper to determine AI model based on brand's AI tier
function getTargetModel(aiTier) {
  const tier = aiTier || 'professional';
  if (tier === 'standard') return 'gemini-2.5-flash';
  if (tier === 'enterprise') return 'deep-research-pro-preview';
  return 'gemini-3.1-pro';
}

// Stripe Instances Cache per brand
const stripeInstances = {};
function getStripeInstance(brand) {
  if ((brand.billing_type === 'external_split' || brand.billing_type === 'free') && !brand.stripe_secret_key) {
    if (process.env.STRIPE_SECRET_KEY) {
      if (!stripeInstances['platform_master']) {
        stripeInstances['platform_master'] = new stripeLib(process.env.STRIPE_SECRET_KEY);
      }
      return stripeInstances['platform_master'];
    }
    return null;
  }
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
    
    // 1. Extract favicon link (prefer apple-touch-icon or high-res square formats first)
    let faviconUrl = null;
    const appleTouchMatch = html.match(/<link[^>]+(?:rel=["']apple-touch-icon["'])[^>]+href=["']([^"']+)["']/i) ||
                            html.match(/<link[^>]+href=["']([^"']+)["'][^>]+(?:rel=["']apple-touch-icon["'])/i);
    if (appleTouchMatch) {
      faviconUrl = appleTouchMatch[1];
    } else {
      const iconMatches = [...html.matchAll(/<link[^>]+(?:rel=["'](?:shortcut )?icon["'])[^>]+/gi)];
      let bestIcon = null;
      let maxDim = 0;
      for (const m of iconMatches) {
        const tag = m[0];
        const hrefM = tag.match(/href=["']([^"']+)["']/i);
        const sizesM = tag.match(/sizes=["'](\d+)x\d+["']/i);
        if (hrefM) {
          const href = hrefM[1];
          const dim = sizesM ? parseInt(sizesM[1], 10) : 16;
          if (bestIcon === null || dim > maxDim) {
            maxDim = dim;
            bestIcon = href;
          }
        }
      }
      if (bestIcon) {
        faviconUrl = bestIcon;
      } else {
        const faviconMatch = html.match(/<link[^>]+(?:rel=["'](?:shortcut )?icon["'])[^>]+href=["']([^"']+)["']/i) ||
                             html.match(/<link[^>]+href=["']([^"']+)["']/i);
        if (faviconMatch) {
          faviconUrl = faviconMatch[1];
        }
      }
    }

    if (faviconUrl) {
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
        external_id: `woocommerce-rss-${slug}`,
        original_link: link
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
    let endpointSecret = brand.stripe_webhook_secret;
    if ((brand.billing_type === 'external_split' || brand.billing_type === 'free') && !endpointSecret) {
      endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    }

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

// Helper to verify brand has not exceeded its monthly subscription AI spend limit
async function checkAiLimits(brandId) {
  if (!brandId) return true;
  try {
    const brand = await getQuery('SELECT ai_tier, ai_free_tier, pay_as_you_go_enabled FROM brands WHERE id = $1', [brandId]);
    if (!brand) return true;
    if (brand.ai_free_tier) return true;
    if (brand.pay_as_you_go_enabled) return true;
    
    const currentMonthCost = await getQuery(`
      SELECT COALESCE(SUM(estimated_cost_usd), 0.0) as cost 
      FROM ai_usage_logs 
      WHERE brand_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)
    `, [brandId]);
    
    const limits = {
      standard: 10.00,
      professional: 50.00,
      enterprise: 200.00
    };
    
    const limit = limits[brand.ai_tier || 'professional'] || 50.00;
    if (parseFloat(currentMonthCost.cost) >= limit) {
      throw new Error(`Monthly AI subscription spend limit exceeded ($${parseFloat(currentMonthCost.cost).toFixed(2)} / $${limit.toFixed(2)} USD). Please upgrade your subscription tier.`);
    }
    return true;
  } catch (err) {
    throw err;
  }
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


// Temporary Preview Debug Logger
app.post('/api/preview-debug-log', async (req, res) => {
  console.log('[PREVIEW_DEBUG]', JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});


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
    res.json({ success: true, email: user.email, role: user.role, brand_id: user.brand_id, first_name: user.first_name, last_name: user.last_name, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User registration endpoint (public/outside)
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (password.trim().length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = await getQuery('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    await runQuery(`
      INSERT INTO users (email, password_hash, role, brand_id)
      VALUES ($1, $2, 'merchant', NULL)
    `, [trimmedEmail, passwordHash]);

    addAuditLog("Merchant Registration", "success", `New merchant user registered: ${trimmedEmail}`);
    res.json({ success: true, message: 'Account registered successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve current operator profile details
app.get('/api/global/users/me', verifyAdminToken, async (req, res) => {
  try {
    const user = await getQuery('SELECT id, email, role, brand_id, first_name, last_name, created_at FROM users WHERE email = $1', [req.user.email]);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update operator user profile details (e.g. password)
app.post('/api/global/users/update-profile', verifyAdminToken, async (req, res) => {
  const { password, firstName, lastName } = req.body;
  
  try {
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      await runQuery('UPDATE users SET password_hash = $1, first_name = $2, last_name = $3 WHERE email = $4', [passwordHash, firstName || null, lastName || null, req.user.email]);
    } else {
      await runQuery('UPDATE users SET first_name = $1, last_name = $2 WHERE email = $3', [firstName || null, lastName || null, req.user.email]);
    }
    
    addAuditLog("Update Profile", "success", `Operator profile successfully updated for ${req.user.email}`);
    res.json({ success: true, message: 'Profile updated successfully.' });
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
        id, brand_id, stripe_session_id, customer_name, customer_email, items, subtotal, total, total_amount, status,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content, coupon_code, discount_amount,
        first_touch_url, last_touch_url, referrer, browser_info, attribution_channel, language
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    `, [
      orderId,
      req.brand.id,
      orderId, // Temp session ID for mock tracking
      customerName || 'Anonymous User',
      customerEmail || 'no-email@example.com',
      JSON.stringify(validatedItems),
      subtotal,
      total,
      total, // total_amount
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
      language || 'en'
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

      const sessionConfig = {
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
      };

      // If split billing is configured with Stripe Connect, split the payment
      if (req.brand.billing_type === 'external_split' && req.brand.stripe_connect_account_id) {
        const totalAmountCents = lineItems.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0);
        const takeRate = req.brand.platform_take_rate !== null && req.brand.platform_take_rate !== undefined ? parseFloat(req.brand.platform_take_rate) : 0.15;
        const appFeeCents = Math.round(totalAmountCents * takeRate);
        
        sessionConfig.payment_intent_data = {
          application_fee_amount: appFeeCents,
          transfer_data: {
            destination: req.brand.stripe_connect_account_id,
          },
        };
        console.log(`[Stripe Connect Split Checkout] Configured Destination Charge. Connected ID: ${req.brand.stripe_connect_account_id}, App Fee: €${(appFeeCents / 100).toFixed(2)}`);
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

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
      const rows = await allQuery('SELECT id, name, subdomain, contact_email, primary_color, shopify_shop_name, stripe_secret_key IS NOT NULL as has_stripe, shopify_access_token IS NOT NULL as has_shopify, custom_domain, logo, favicon, theme_settings, languages, marketing_protocol, ai_tier, ai_free_tier, pay_as_you_go_enabled, protocol_status, protocol_error, competitors, auto_find_competitors, price_markup, billing_type, platform_take_rate FROM brands WHERE id = $1', [req.user.brand_id]);
      return res.json(rows);
    }
    const rows = await allQuery('SELECT id, name, subdomain, contact_email, primary_color, shopify_shop_name, stripe_secret_key IS NOT NULL as has_stripe, shopify_access_token IS NOT NULL as has_shopify, custom_domain, logo, favicon, theme_settings, languages, marketing_protocol, ai_tier, ai_free_tier, pay_as_you_go_enabled, protocol_status, protocol_error, competitors, auto_find_competitors, price_markup, billing_type, platform_take_rate FROM brands ORDER BY id ASC');
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

  // Permit brand creation if merchant has no brand associated yet (self-onboarding flow)
  if (req.user.role !== 'superadmin' && req.user.brand_id && req.user.brand_id !== reqId) {
    return res.status(403).json({ error: 'Permission denied. Superadmin access or brand operator permission required.' });
  }

  try {
    const existing = await getQuery('SELECT subdomain, cloudflare_dns_record_id, custom_domain, cloudflare_custom_domain_dns_record_id, stripe_secret_key, stripe_webhook_secret, ai_tier, ai_free_tier, pay_as_you_go_enabled, competitors, auto_find_competitors, price_markup, billing_type, platform_take_rate, stripe_connect_account_id, subscription_billing_method, stripe_customer_id FROM brands WHERE id = $1', [reqId]);

    if (req.user.role !== 'superadmin') {
      if (existing) {
        req.body.subdomain = existing.subdomain;
        req.body.custom_domain = existing.custom_domain;
        req.body.stripe_secret_key = existing.stripe_secret_key;
        req.body.stripe_webhook_secret = existing.stripe_webhook_secret;
        req.body.ai_free_tier = existing.ai_free_tier;
        req.body.price_markup = existing.price_markup;
        req.body.billing_type = existing.billing_type;
        req.body.platform_take_rate = existing.platform_take_rate;
        req.body.stripe_connect_account_id = existing.stripe_connect_account_id;
        req.body.stripe_customer_id = existing.stripe_customer_id;
      } else {
        // Support initial self-onboarding subscription tier select
        req.body.ai_tier = req.body.ai_tier || 'professional';
        req.body.ai_free_tier = false;
        req.body.price_markup = req.body.price_markup || 0.00;
        req.body.billing_type = req.body.billing_type || 'standard';
        req.body.platform_take_rate = 0.15;
        req.body.stripe_connect_account_id = null;
        req.body.subscription_billing_method = 'ledger';
        req.body.stripe_customer_id = null;
      }
    }

    const { id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color, custom_domain, logo, favicon, theme_settings, languages, marketing_protocol, ai_tier, ai_free_tier, pay_as_you_go_enabled, competitors, auto_find_competitors, price_markup, billing_type, platform_take_rate, stripe_connect_account_id, subscription_billing_method, stripe_customer_id } = req.body;

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
    const finalAiFreeTier = ai_free_tier === true || ai_free_tier === 'true';
    const finalPayAsYouGo = pay_as_you_go_enabled === true || pay_as_you_go_enabled === 'true';
    let finalCompetitors = existing ? existing.competitors : null;
    if (competitors !== undefined) {
      finalCompetitors = Array.isArray(competitors) ? competitors.join(', ') : (competitors || null);
    }
    let finalAutoFind = existing ? existing.auto_find_competitors : true;
    if (auto_find_competitors !== undefined) {
      finalAutoFind = auto_find_competitors === true || auto_find_competitors === 'true';
    }
    const finalPriceMarkup = price_markup !== undefined ? parseFloat(price_markup) : (existing ? parseFloat(existing.price_markup) : 0.00);
    const finalBillingType = billing_type !== undefined ? billing_type : (existing ? existing.billing_type : 'standard');
    const finalPlatformTakeRate = platform_take_rate !== undefined ? parseFloat(platform_take_rate) : (existing ? parseFloat(existing.platform_take_rate) : 0.15);

    const finalBillingMethod = (subscription_billing_method && subscription_billing_method !== '') ? subscription_billing_method : (existing && existing.subscription_billing_method ? existing.subscription_billing_method : 'ledger');

    await runQuery(`
      INSERT INTO brands (id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color, cloudflare_dns_record_id, custom_domain, cloudflare_custom_domain_dns_record_id, logo, favicon, theme_settings, languages, marketing_protocol, ai_tier, ai_free_tier, pay_as_you_go_enabled, competitors, auto_find_competitors, price_markup, billing_type, platform_take_rate, stripe_connect_account_id, subscription_billing_method, stripe_customer_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
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
        ai_free_tier = EXCLUDED.ai_free_tier,
        pay_as_you_go_enabled = EXCLUDED.pay_as_you_go_enabled,
        competitors = EXCLUDED.competitors,
        auto_find_competitors = EXCLUDED.auto_find_competitors,
        price_markup = EXCLUDED.price_markup,
        billing_type = EXCLUDED.billing_type,
        platform_take_rate = EXCLUDED.platform_take_rate,
        stripe_connect_account_id = EXCLUDED.stripe_connect_account_id,
        subscription_billing_method = EXCLUDED.subscription_billing_method,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
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
      finalAiTier,
      finalAiFreeTier,
      finalPayAsYouGo,
      finalCompetitors,
      finalAutoFind,
      finalPriceMarkup,
      finalBillingType,
      finalPlatformTakeRate,
      stripe_connect_account_id || null,
      finalBillingMethod,
      stripe_customer_id || null
    ]);

    // If price_markup changed, update all external synced products' prices
    if (existing && parseFloat(existing.price_markup) !== parseFloat(finalPriceMarkup)) {
      console.log(`[Price Markup Change] Recalculating prices for brand ${brandId} from ${existing.price_markup}% to ${finalPriceMarkup}%`);
      await runQuery(`
        UPDATE products 
        SET price = ROUND(original_price * (1 + $1 / 100), 2)
        WHERE brand_id = $2 AND price_source = 'external' AND original_price IS NOT NULL
      `, [finalPriceMarkup, brandId]);
    }

    // Provision subscription fee charges if paid tier selected and brand is being created for the first time
    if (!existing && finalAiTier && finalAiTier !== 'none') {
      let subAmount = 49.00;
      if (finalAiTier === 'professional') subAmount = 99.00;
      if (finalAiTier === 'enterprise') subAmount = 199.00;

      // 1. Create merchant subscription record
      await runQuery(`
        INSERT INTO merchant_subscriptions (brand_id, name, amount, interval, status, last_charged_at, next_charge_at)
        VALUES ($1, $2, $3, 'monthly', 'active', CURRENT_TIMESTAMP, $4)
      `, [
        brandId,
        `ai_subscription_${finalAiTier}`,
        subAmount,
        new Date(Date.now() + 30 * 24 * 3600 * 1000) // 30 days from now
      ]);

      // 2. Perform immediate first charge deduction in the payout ledger (reduces payout balance)
      await runQuery(`
        INSERT INTO merchant_payout_ledger (brand_id, order_id, amount, platform_margin, net_amount, type, description)
        VALUES ($1, NULL, $2, $2, $3, 'subscription_fee', $4)
      `, [
        brandId,
        subAmount,
        -subAmount,
        `Immediate charge for initial ${finalAiTier} tier subscription`
      ]);

      console.log(`[Subscription Engine] Self-onboarding charged initial first-month subscription for brand ${brandId} (${finalAiTier}: €${subAmount})`);
    }

    // Update active subscription if user upgrades/downgrades AI Operation Tier
    if (existing && existing.ai_tier !== finalAiTier) {
      let subAmount = 49.00;
      if (finalAiTier === 'none') subAmount = 0.00;
      else if (finalAiTier === 'standard') subAmount = 49.00;
      else if (finalAiTier === 'professional') subAmount = 99.00;
      else if (finalAiTier === 'enterprise') subAmount = 199.00;

      if (finalAiTier === 'none') {
        // Cancel subscription
        await runQuery(`UPDATE merchant_subscriptions SET status = 'cancelled' WHERE brand_id = $1`, [brandId]);
        console.log(`[Subscription Engine] Cancelled AI subscription for brand ${brandId} (Tier changed to none)`);
      } else {
        // Find existing active subscription
        const hasSub = await getQuery(`SELECT id FROM merchant_subscriptions WHERE brand_id = $1 AND status = 'active'`, [brandId]);
        if (hasSub) {
          await runQuery(`
            UPDATE merchant_subscriptions 
            SET name = $1, amount = $2
            WHERE brand_id = $3 AND status = 'active'
          `, [`ai_subscription_${finalAiTier}`, subAmount, brandId]);
          console.log(`[Subscription Engine] Updated active AI subscription for brand ${brandId} to ${finalAiTier} (€${subAmount})`);
        } else {
          // If no active sub found, create one
          await runQuery(`
            INSERT INTO merchant_subscriptions (brand_id, name, amount, interval, status, last_charged_at, next_charge_at)
            VALUES ($1, $2, $3, 'monthly', 'active', CURRENT_TIMESTAMP, $4)
          `, [
            brandId,
            `ai_subscription_${finalAiTier}`,
            subAmount,
            new Date(Date.now() + 30 * 24 * 3600 * 1000)
          ]);
          console.log(`[Subscription Engine] Provisioned new active AI subscription for brand ${brandId} for ${finalAiTier} (€${subAmount})`);
        }
      }
    }

    // If user had no brand_id associated, link it now and generate updated token
    let newToken = null;
    if (!req.user.brand_id) {
      await runQuery('UPDATE users SET brand_id = $1 WHERE email = $2', [brandId, req.user.email]);
      console.log(`[User Onboarding] Linked user ${req.user.email} to newly created brand ${brandId}`);
      
      const payload = { email: req.user.email, role: req.user.role, brand_id: brandId, time: Date.now() };
      const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
      const secret = process.env.JWT_SECRET || 'fallback-auth-secret-key-12984-sc';
      const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('hex');
      newToken = `${payloadBase64}.${signature}`;
    }

    res.json({ success: true, brandId, token: newToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate subscription tier upgrade or downgrade costs/proration
app.post('/api/global/brands/:id/subscription/calculate-change', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { target_tier, target_interval } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    const brand = await getQuery('SELECT ai_tier FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const oldTier = brand.ai_tier || 'none';
    
    // Find current active subscription
    const sub = await getQuery(`SELECT * FROM merchant_subscriptions WHERE brand_id = $1 AND status = 'active'`, [brandId]);
    
    const oldAmount = sub ? parseFloat(sub.amount) : 0.00;
    const currentInterval = sub ? sub.interval : 'monthly';
    const nextChargeAt = sub ? new Date(sub.next_charge_at) : new Date(Date.now() + 30 * 24 * 3600 * 1000);
    const lastChargedAt = sub ? new Date(sub.last_charged_at) : new Date();

    // Map monthly equivalent costs
    const monthlyEquivalent = {
      none: 0,
      standard: 49.00,
      professional: 99.00,
      enterprise: 199.00
    };
    const yearlyEquivalent = {
      none: 0,
      standard: 39.00,
      professional: 79.00,
      enterprise: 159.00
    };

    const getMonthlyCost = (tier, interval) => {
      if (tier === 'none') return 0;
      return interval === 'yearly' ? yearlyEquivalent[tier] : monthlyEquivalent[tier];
    };

    const oldMonthlyEquivalent = getMonthlyCost(oldTier, currentInterval);
    const newMonthlyEquivalent = getMonthlyCost(target_tier, target_interval);

    let newAmount = 0.00;
    if (target_tier !== 'none') {
      if (target_interval === 'yearly') {
        if (target_tier === 'standard') newAmount = 468.00;
        else if (target_tier === 'professional') newAmount = 948.00;
        else if (target_tier === 'enterprise') newAmount = 1908.00;
      } else {
        newAmount = monthlyEquivalent[target_tier];
      }
    }

    const isUpgrade = newMonthlyEquivalent > oldMonthlyEquivalent;
    const isDowngrade = newMonthlyEquivalent < oldMonthlyEquivalent;

    let upfrontCharge = 0.00;
    let rolloverCharge = newAmount;

    // Proration details
    const now = Date.now();
    const cycleStart = lastChargedAt.getTime();
    const cycleEnd = nextChargeAt.getTime();
    const totalCycleTime = cycleEnd - cycleStart;
    const remainingTime = cycleEnd - now;
    const remainingRatio = totalCycleTime > 0 ? Math.max(0, Math.min(1, remainingTime / totalCycleTime)) : 0;

    if (isUpgrade) {
      if (target_interval !== currentInterval) {
        const oldCredit = oldAmount * remainingRatio;
        upfrontCharge = Math.max(0, newAmount - oldCredit);
      } else {
        const oldCredit = oldAmount * remainingRatio;
        const newProratedCost = newAmount * remainingRatio;
        upfrontCharge = Math.max(0, newProratedCost - oldCredit);
      }
    } else if (isDowngrade) {
      upfrontCharge = 0.00;
    }

    res.json({
      success: true,
      current_tier: oldTier,
      current_interval: currentInterval,
      target_tier,
      target_interval,
      is_upgrade: isUpgrade,
      is_downgrade: isDowngrade,
      upfront_charge: parseFloat(upfrontCharge.toFixed(2)),
      rollover_charge: parseFloat(rolloverCharge.toFixed(2)),
      next_charge_date: nextChargeAt.toISOString().split('T')[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply subscription tier upgrade or downgrade costs/proration
app.post('/api/global/brands/:id/subscription/apply-change', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { target_tier, target_interval } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    const brand = await getQuery('SELECT ai_tier FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const oldTier = brand.ai_tier || 'none';
    
    const sub = await getQuery(`SELECT * FROM merchant_subscriptions WHERE brand_id = $1 AND status = 'active'`, [brandId]);
    
    const oldAmount = sub ? parseFloat(sub.amount) : 0.00;
    const currentInterval = sub ? sub.interval : 'monthly';
    const nextChargeAt = sub ? new Date(sub.next_charge_at) : new Date(Date.now() + 30 * 24 * 3600 * 1000);
    const lastChargedAt = sub ? new Date(sub.last_charged_at) : new Date();

    const monthlyEquivalent = {
      none: 0,
      standard: 49.00,
      professional: 99.00,
      enterprise: 199.00
    };
    const yearlyEquivalent = {
      none: 0,
      standard: 39.00,
      professional: 79.00,
      enterprise: 159.00
    };

    const getMonthlyCost = (tier, interval) => {
      if (tier === 'none') return 0;
      return interval === 'yearly' ? yearlyEquivalent[tier] : monthlyEquivalent[tier];
    };

    const oldMonthlyEquivalent = getMonthlyCost(oldTier, currentInterval);
    const newMonthlyEquivalent = getMonthlyCost(target_tier, target_interval);

    let newAmount = 0.00;
    if (target_tier !== 'none') {
      if (target_interval === 'yearly') {
        if (target_tier === 'standard') newAmount = 468.00;
        else if (target_tier === 'professional') newAmount = 948.00;
        else if (target_tier === 'enterprise') newAmount = 1908.00;
      } else {
        newAmount = monthlyEquivalent[target_tier];
      }
    }

    const isUpgrade = newMonthlyEquivalent > oldMonthlyEquivalent;
    const isDowngrade = newMonthlyEquivalent < oldMonthlyEquivalent;

    // Proration calculation
    const now = Date.now();
    const cycleStart = lastChargedAt.getTime();
    const cycleEnd = nextChargeAt.getTime();
    const totalCycleTime = cycleEnd - cycleStart;
    const remainingTime = cycleEnd - now;
    const remainingRatio = totalCycleTime > 0 ? Math.max(0, Math.min(1, remainingTime / totalCycleTime)) : 0;

    if (target_tier === 'none') {
      await runQuery(`UPDATE merchant_subscriptions SET status = 'cancelled', pending_tier = NULL, pending_interval = NULL WHERE brand_id = $1`, [brandId]);
      await runQuery(`UPDATE brands SET ai_tier = 'none' WHERE id = $1`, [brandId]);
      addAuditLog("Subscription Cancelled", "success", `Brand ${brandId} cancelled AI tier subscription.`);
      return res.json({ success: true, message: 'Subscription cancelled successfully.' });
    }

    if (isUpgrade || oldTier === 'none') {
      let upfrontCharge = 0.00;
      let newCycleEnd = nextChargeAt;

      if (target_interval !== currentInterval) {
        const oldCredit = oldAmount * remainingRatio;
        upfrontCharge = Math.max(0, newAmount - oldCredit);
        const cycleDays = target_interval === 'yearly' ? 365 : 30;
        newCycleEnd = new Date(now + cycleDays * 24 * 3600 * 1000);
      } else {
        const oldCredit = oldAmount * remainingRatio;
        const newProratedCost = newAmount * remainingRatio;
        upfrontCharge = Math.max(0, newProratedCost - oldCredit);
      }

      if (upfrontCharge > 0) {
        await runQuery(`
          INSERT INTO merchant_payout_ledger (brand_id, order_id, amount, platform_margin, net_amount, type, description)
          VALUES ($1, NULL, $2, $3, $4, 'subscription_fee', $5)
        `, [
          brandId,
          upfrontCharge,
          upfrontCharge,
          -upfrontCharge,
          `Immediate prorated charge for upgrading to ${target_tier} tier (${target_interval})`
        ]);
      }

      if (sub) {
        await runQuery(`
          UPDATE merchant_subscriptions 
          SET name = $1, amount = $2, interval = $3, last_charged_at = CURRENT_TIMESTAMP, next_charge_at = $4, pending_tier = NULL, pending_interval = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE brand_id = $5 AND status = 'active'
        `, [`ai_subscription_${target_tier}`, newAmount, target_interval, newCycleEnd, brandId]);
      } else {
        await runQuery(`
          INSERT INTO merchant_subscriptions (brand_id, name, amount, interval, status, last_charged_at, next_charge_at)
          VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP, $5)
        `, [
          brandId,
          `ai_subscription_${target_tier}`,
          newAmount,
          target_interval,
          newCycleEnd
        ]);
      }

      await runQuery(`UPDATE brands SET ai_tier = $1 WHERE id = $2`, [target_tier, brandId]);
      addAuditLog("Subscription Upgraded", "success", `Brand ${brandId} upgraded to ${target_tier} tier (${target_interval}). Upfront: €${upfrontCharge.toFixed(2)}`);
      
      res.json({ success: true, message: `Successfully upgraded to ${target_tier} tier. Prorated charge applied.` });
    } else {
      if (sub) {
        if (process.env.NODE_ENV !== 'production') {
          // Dev/Local instant downgrade bypass
          await runQuery(`
            UPDATE merchant_subscriptions 
            SET name = $1, amount = $2, interval = $3, pending_tier = NULL, pending_interval = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
          `, [`ai_subscription_${target_tier}`, newAmount, target_interval, sub.id]);
          await runQuery(`UPDATE brands SET ai_tier = $1 WHERE id = $2`, [target_tier, brandId]);
          addAuditLog("Subscription Downgraded (Instant Dev Mode)", "success", `Brand ${brandId} instantly downgraded to ${target_tier} tier (${target_interval}) in dev environment.`);
          res.json({ success: true, message: `[Dev Mode] Plan downgraded instantly to ${target_tier} tier.` });
        } else {
          await runQuery(`
            UPDATE merchant_subscriptions 
            SET pending_tier = $1, pending_interval = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `, [target_tier, target_interval, sub.id]);
          
          addAuditLog("Subscription Downgrade Scheduled", "success", `Brand ${brandId} scheduled downgrade to ${target_tier} tier (${target_interval}) for ${nextChargeAt.toISOString().split('T')[0]}`);
          res.json({ success: true, message: `Downgrade scheduled. Your current plan remains active until ${nextChargeAt.toISOString().split('T')[0]}.` });
        }
      } else {
        await runQuery(`UPDATE brands SET ai_tier = $1 WHERE id = $2`, [target_tier, brandId]);
        res.json({ success: true, message: `Settings updated to ${target_tier} tier.` });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Create or Retrieve Stripe Connect Onboarding Account Link URL
app.post('/api/global/brands/:id/stripe-connect-link', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    const brand = await getQuery('SELECT stripe_connect_account_id FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({ error: 'Stripe is not configured on the platform.' });
    }

    const stripe = new stripeLib(process.env.STRIPE_SECRET_KEY);
    let accountId = brand.stripe_connect_account_id;

    if (!accountId) {
      // Create new Express Connected Account
      console.log(`[Stripe Connect] Creating new Express account for brand: ${brandId}...`);
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: {
          brand_id: brandId
        }
      });
      accountId = account.id;

      // Save the account ID in the database
      await runQuery('UPDATE brands SET stripe_connect_account_id = $1 WHERE id = $2', [accountId, brandId]);
    }

    // Generate onboarding link
    console.log(`[Stripe Connect] Creating account onboarding link for account: ${accountId}...`);
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.origin}/admin/index.html?stripe_connect=refresh&brandId=${brandId}`,
      return_url: `${req.headers.origin}/admin/index.html?stripe_connect=success&brandId=${brandId}`,
      type: 'account_onboarding'
    });

    res.json({ success: true, url: accountLink.url });
  } catch (err) {
    console.error(`[Stripe Connect Link Error] Brand ${brandId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// POST Create Stripe Setup Session for Card-on-File
app.post('/api/global/brands/:id/stripe-setup-session', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    const brand = await getQuery('SELECT name, contact_email, stripe_customer_id FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({ error: 'Stripe is not configured on the platform.' });
    }

    const stripe = new stripeLib(process.env.STRIPE_SECRET_KEY);
    let customerId = brand.stripe_customer_id;

    // Create a Stripe Customer if not already created
    if (!customerId) {
      console.log(`[Stripe Billing] Creating Customer object for brand: ${brandId}...`);
      const customer = await stripe.customers.create({
        email: brand.contact_email || `${brandId}@stricktlycoffee.be`,
        name: brand.name,
        metadata: { brand_id: brandId }
      });
      customerId = customer.id;
      
      // Save it in DB
      await runQuery('UPDATE brands SET stripe_customer_id = $1 WHERE id = $2', [customerId, brandId]);
    }

    // Create Setup Session
    console.log(`[Stripe Billing] Creating Card Setup Session for Customer: ${customerId}...`);
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      payment_method_types: ['card'],
      customer: customerId,
      success_url: `${req.headers.origin}/admin/index.html?stripe_setup=success&brandId=${brandId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/admin/index.html?stripe_setup=cancel&brandId=${brandId}`
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error(`[Stripe Card Setup Session Error] Brand ${brandId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET Setup Complete Callback verification
app.get('/api/global/billing/setup-complete', verifyAdminToken, async (req, res) => {
  const { brandId, sessionId } = req.query;
  if (!brandId || !sessionId) {
    return res.status(400).json({ error: 'Missing required parameters: brandId, sessionId' });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({ error: 'Stripe is not configured on the platform.' });
    }

    const stripe = new stripeLib(process.env.STRIPE_SECRET_KEY);
    
    // Retrieve Setup Checkout Session
    console.log(`[Stripe Billing] Verifying Setup Checkout Session: ${sessionId}...`);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['setup_intent', 'setup_intent.payment_method']
    });

    if (session.status === 'complete' && session.setup_intent) {
      const customerId = session.customer;
      const paymentMethodId = session.setup_intent.payment_method?.id || session.setup_intent.payment_method;
      
      if (paymentMethodId) {
        console.log(`[Stripe Billing] Setting payment method ${paymentMethodId} as default for Customer ${customerId}...`);
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
        
        res.json({ success: true, message: 'Card linked successfully!' });
      } else {
        res.status(400).json({ error: 'No payment method returned in setup intent.' });
      }
    } else {
      res.status(400).json({ error: `Setup Checkout Session is not complete (Status: ${session.status}).` });
    }
  } catch (err) {
    console.error(`[Stripe Card Setup Complete Error] Brand ${brandId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// POST Generate brand marketing protocol manuscript via AI Analysis
app.post('/api/global/brands/:id/generate-protocol', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { url, competitors, auto_find_competitors } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    await checkAiLimits(brandId);
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    // Set status to generating immediately and reset error
    await runQuery("UPDATE brands SET protocol_status = 'generating', protocol_error = NULL WHERE id = $1", [brandId]);

    // Setup AbortController for cancelability
    const controller = new AbortController();
    activeAborts.set(brandId, controller);

    // Send immediate response
    res.json({ success: true, message: 'Brand protocol generation started in the background.' });

    // Execute generation asynchronously in the background
    (async () => {
      let generatedProtocol = '';
      try {
        let targetUrl = url || brand.shopify_shop_name || brand.woocommerce_shop_url || brand.subdomain;
        if (targetUrl && !targetUrl.startsWith('http')) {
          targetUrl = `https://${targetUrl}`;
        }

        let homepageText = 'No website crawled.';
        if (targetUrl) {
          try {
            console.log(`[AI Protocol Generator] Scraping brand site: ${targetUrl}`);
            const pageRes = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal });
            if (pageRes.ok) {
              const html = await pageRes.text();
              homepageText = extractCleanText(html);
            }
          } catch (err) {
            console.warn(`[AI Protocol Generator] Failed to crawl primary URL: ${targetUrl}`, err.message);
          }
        }

        const products = await allQuery('SELECT title, description, price FROM products WHERE brand_id = $1 LIMIT 20', [brandId]);
        const catalogContext = products.map(p => `- ${p.title} (€${parseFloat(p.price).toFixed(2)}): ${p.description || ''}`).join('\n');

        const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;

        // Auto-find competitors if enabled and none provided
        let autoDiscoveredCompetitors = [];
        const shouldAutoFind = auto_find_competitors === true || auto_find_competitors === 'true' || brand.auto_find_competitors;
        if (shouldAutoFind && (!competitors || (Array.isArray(competitors) ? competitors.length === 0 : !String(competitors).trim())) && apiKey) {
          console.log(`[AI Protocol Generator] Auto-discovering competitors for brand: ${brand.name}`);
          try {
            const discoverPrompt = `You are a market research AI. Based on the following brand details and product catalog, identify exactly 3 real competitor website domains in their industry segment.
Brand Name: ${brand.name}
Primary Shop URL/Subdomain: ${targetUrl || 'Not available'}
Clean homepage text snippet: ${homepageText.substring(0, 1000)}
Catalog sample products:
${catalogContext.substring(0, 1000) || 'None'}

Return ONLY a comma-separated list of the 3 competitor domains (e.g. "competitor1.com, competitor2.com, competitor3.com"). Do not return any other text, markdown formatting, or explanation.`;

            const discRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: discoverPrompt }] }]
              }),
              signal: controller.signal
            });
            if (discRes.ok) {
              const discJson = await discRes.json();
              const discText = discJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
              console.log(`[AI Protocol Generator] Raw discovered competitors: ${discText}`);
              const parsedComps = discText.split(',').map(s => s.replace(/['"`]/g, '').trim()).filter(s => s.includes('.') && !s.includes(' '));
              if (parsedComps.length > 0) {
                autoDiscoveredCompetitors = parsedComps;
                console.log(`[AI Protocol Generator] Auto-discovered competitor domains: ${autoDiscoveredCompetitors.join(', ')}`);
                // Update the competitors list in the database for the brand
                await runQuery('UPDATE brands SET competitors = $1 WHERE id = $2', [autoDiscoveredCompetitors.join(', '), brandId]);
              }
            }
          } catch (discErr) {
            console.error('[AI Protocol Generator] Error auto-discovering competitors:', discErr.message);
          }
        }

        let competitorTexts = [];
        let compUrls = [];
        const activeCompetitors = (competitors !== undefined) ? competitors : brand.competitors;
        if (activeCompetitors && (Array.isArray(activeCompetitors) ? activeCompetitors.length > 0 : String(activeCompetitors).trim())) {
          compUrls = Array.isArray(activeCompetitors)
            ? activeCompetitors
            : String(activeCompetitors).split(',').map(s => s.trim()).filter(Boolean);
        } else if (autoDiscoveredCompetitors.length > 0) {
          compUrls = autoDiscoveredCompetitors;
        }

        if (compUrls.length > 0) {
          for (let compUrl of compUrls) {
            let fullCompUrl = compUrl;
            if (!fullCompUrl.startsWith('http')) {
              fullCompUrl = `https://${fullCompUrl}`;
            }
            try {
              console.log(`[AI Protocol Generator] Scraping competitor site: ${fullCompUrl}`);
              const compRes = await fetch(fullCompUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal });
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

        if (apiKey) {
          let prompt = '';
          const isPesado = brand.name.toLowerCase().includes('pesado');
          if (isPesado) {
            prompt = `You are an elite, premium DTC Performance Marketing Director and Brand Strategist specializing in luxury espresso hardware, precision barista equipment, and architectural home assets.
Your task is to analyze the brand data, catalog specifications, and competitive landscape provided below to generate a comprehensive, highly tactical Brand Performance Marketing Protocol and copy suite.
To maintain a luxury and professional standard, avoid typical DTC clichés (e.g., "revolutionize your morning," "game-changing hack," "we founded this to change the world"). Write with quiet, clinical confidence, focusing on physical engineering, material integrity, and aesthetic value.

BRAND DATA & PRODUCT INFRASTRUCTURE
1. Brand Profile & Core Web Data
•	Brand Name: Pesado 58.5
•	Website URL: https://pesado585.com
•	Meta Description: Precision Coffee tools for all barista levels - begin your coffee journey with Pesado premium coffee accessories and coffee tools.
•	Core Shipping & Offers: Free Shipping Australia Wide over $89+ AUD. Free shipping to USA over $100+ USD.
•	Scraped Web Content / Core Claims:
${homepageText}

2. Unique Selling Propositions & Claims
•	Modular Styling System: Ability to mix and match tamper and portafilter handles to coordinate with home interiors. Interchangeable handle selection includes sustainable timber, metallic, or custom resins.
•	Sustainable Material Focus: Handcrafted handles crafted from highly sustainable cross-layered European birch wood. Vacuum-dyed to achieve a rich oak finish and sealed with a heat- and water-resistant wax.
•	Calibrated Tamping Collaboration: A spring-loaded, self-leveling tamper developed with 2022 World Barista Champion Anthony Douglas. Features a concave thumb-matching grip, an integrated leveling guide, and a 3-wing depth adjuster.
•	High Extraction He[%] Filter Baskets: Engineered from rigid 1.1mm marine-grade stainless steel to prevent base-flexing under 9-bar pressure. Edge-to-edge laser perforations maximize the extraction surface to extract more Total Dissolved Solids (TDS) and eliminate peripheral channeling.

3. Core Product Catalog Sizing & Sizing Benchmarks
•	High Extraction He[%] Filter Basket: $71.50 USD (Sizes: Small 15-17g, Medium 17-19g, Large 19-21g, XL 21-22g). 1.1mm thick steel. Fits 54mm and 58mm systems.
•	Spring-Loaded Self-Leveling Tamper x AD Coffee: $132.00 USD. 316-grade stainless base, POM ergonomic handle, 616g weight.
•	Hybrid Portafilter (Spouted & Bottomless): From $150.70 USD. Forged high-grade stainless steel head, versatile removable spout design.
•	High Diffusion Espresso Shower Screen: $55.00 - $60.50 USD. Even water distribution membranes to prevent channel jetting.
•	Stainless Steel Clump Crusher V2.0 (WDT): $37.79 USD. Ultra-fine flexible pins, anodized alloy handle.
•	Impact Gravity Espresso Grounds Distributor: $132.00 USD. Weighted base with automatic gravity depth-leveling.
Active Catalog Data Context:
${catalogContext || 'No catalog items registered.'}

4. Competitor Landscape & Friction Points
•	Normcore Coffee (Accessible Premium): Popular calibrated tampers, but uses mass-produced multi-spring mechanisms that can trap grounds between plates and show minor alignment variances over time.
•	Pullman Espresso (Ultra-Premium Performance): High-precision BigStep bases machined locally in Australia, but maintains a highly industrial, rigid visual design.
•	Saint Anthony Industries (Design-First Minimalist): Beautiful solid wood handles and wedge distributors, but lacks a heavy emphasis on high-extraction fluid dynamics and mathematical precision.
•	The Workflow Gap: Consumers often buy high-extraction baskets without upgrading their tampers, leading to extreme water channeling because finer grinds require perfectly level compaction. Pesado solves this through coordinated "Workflow Ecosystems" (bundling baskets, self-leveling tampers, and WDT clump crushers).

GENERATION INSTRUCTIONS & OUTLINES
Generate a thorough, structured, and complete manuscript in Markdown based on the above data. You must execute every single section below in full detail, without shortcuts or placeholders.
SECTION 1: Strategic Market Position & Product Architecture
	1.	The Technical Narrative: Detail the technical position of Pesado 58.5. Explain why the physical engineering details matter (e.g., how 1.1mm rigid steel prevents base flexing under 9 bars of pressure, or how specific tolerances reduce flow channeling).
	2.	Fluid Dynamics / Physical Modeling: Include mathematical representations of the problems solved by the products. Write Darcy's Law for fluid flow through porous media ($Q = \\frac{-k A \\Delta P}{\\mu L}$) to describe hydraulic flow uniformity, and the Extraction Yield ($EY\\% = \\frac{\\text{Weight of Brewed Espresso} \\times \\text{TDS\\%}}{\\text{Dry Coffee Dose}}$) equation in clean LaTeX format.
	3.	Product Catalog Matrix: Create a clean Markdown table mapping the core products to their exact physical specs, raw materials, and price points.
SECTION 2: Multi-Segment Customer Personas
Build 2 highly distinct consumer profiles based on buying psychological motivations:
	1.	Persona A (The Technical Enthusiast / Extraction Scientist): Typically software developers or engineers. Obsessed with TDS data, micro-tolerances, physical science, and repeat performance. Explain their triggers, frustrations, and preferred specs.
	2.	Persona B (The Design Curator): Typically architects or creative professionals. Focuses on the beauty of their home setup, tactile feedback, materials (natural wood/resins), and workstation aesthetics. Explain their triggers, frustrations, and visual alignment goals.
SECTION 3: Brand Voice Guidelines & Vocabulary Protocol
	1.	Adjectives & Application: Define 4 voice adjectives that represent Pesado's premium, technical tone. Provide an applied copy example for each.
	2.	Controlled Vocabulary Matrix: Provide a clear table of:
•	Approved Terminology (e.g., hydraulic uniformity, edge-to-edge percolation, zero-compromise engineering, structural rigidity under pressure).
•	Banned Terminology (e.g., cheap, budget-friendly, morning routine hack, game-changing, world's best, ultimate trick).
SECTION 4: Performance Ads Copywriting Framework
Develop ad variations based on three psychological angles:
	1.	Emotional (Tactile & Aesthetic Satisfaction): Focuses on custom materials, balanced weight, and the daily visual ritual.
	2.	Logical (Data & Science): Focuses on eliminating channeling, structural base rigidity, and maximizing extraction yields.
	3.	Utility (Workflow & Durability): Focuses on machine compatibility, simple maintenance, and long-term durability.
For each angle, provide:
•	One Cold Prospecting (TOFU) ad copy variation (Primary Text, Headline, Description).
•	One Retargeting (MOFU/BOFU) ad copy variation (Primary Text, Headline, Description).
•	Strict Copy Rule: Write descriptions and primary texts from an objective, premium third-person perspective using strong imperative calls-to-action. Do not use cheesy, spammy emojis.
SECTION 5: Video & Image Creative Briefs (AI Generation Ready)
	1.	Vertical Video Scripts (TikTok/Reels - 9:16): Provide 2 highly detailed, multi-scene video scripts. Each must include time stamps, specific visual directions, text overlays, and audio/ASMR cues (e.g., the physical click of a calibrated tamper or metal locking).
	2.	Text-to-Image Prompts (Midjourney/DALL-E style): Provide 3 highly descriptive, photorealistic text prompts for product photography. Structure them with Scene, Subject, Motion, Camera Angle/Lens, and Atmosphere/Lighting (e.g., "Premium product shot of [Product Name] on a marble countertop, warm side lighting, shallow depth of field, 85mm lens, high-end architectural digest aesthetic").
SECTION 6: High-Converting Email Flows
Provide raw, copy-pasteable email copy for:
	1.	Onboarding / Welcome Sequence (3 Steps): Step 1: The Principle of 58.5mm Precision. Step 2: The physics of 1.1mm stainless steel and preventing puck flex. Step 3: Elite collaboration and World Champion design standards. Include subject lines, preheaders, and button CTA text.
	2.	Cart Abandonment Sequence (3 Steps): Step 1: Eliminating the performance variable. Step 2: Sizing and machine compatibility validation checklist. Step 3: Designing the workstation aesthetic.
SECTION 7: Landing Page Visual Architecture
Provide a step-by-step structural blueprint for a high-converting landing page. Map out the exact visual containers, value statements, functional modules (e.g., an interactive machine compatibility engine to find the right portafilter/tamper sizes), and social proof blocks.
[EXECUTION RULE]
Output the complete Markdown document directly. Write all ad copy and email templates in ready-to-use, professional English. Do not explain your process, provide meta-commentary, or write conversational filler. Start directly with the first section header.`;
          } else {
            prompt = `You are an elite, premium DTC Performance Marketing Director and Brand Strategist specializing in high-end consumer hardware, luxury lifestyle products, and precision-engineered gear.
Your task is to analyze the raw storefront data, catalog samples, and competitor context provided below to generate a comprehensive, highly tactical Brand Performance Marketing Protocol and Strategic Manuscript.
To maintain a luxury and professional standard, avoid typical DTC clichés (e.g., "we founded this brand to change the world," "revolutionary," "game-changer," "ultimate hack"). Write with quiet, clinical confidence, focusing on physical engineering, material integrity, and aesthetic value.

[INPUT DATA]
1. Brand Profile & Core Web Data
•	Brand Name: ${brand.name}
•	Website URL: ${targetUrl || 'Not available'}
•	Primary Value Prop / Meta Description: Precision coffee tools for all barista levels, premium accessories.
•	Scraped Web Content / Core Claims:
${homepageText}

2. Competitor Context & Market Positioning
•	Primary Direct Competitors: ${compUrls.length > 0 ? compUrls.join(', ') : 'Pullman, Normcore, Saint Anthony Industries'}
•	Target Price Segment: Premium, high-end ($50 - $200+ USD accessories)
•	Core Market Pain Points: Uneven extraction, channeling, cheap plastic tools, lack of setup aesthetic cohesion
${competitorTexts.length > 0 ? '\nCompetitor Scraping Context:\n' + competitorTexts.join('\n\n') : ''}

3. Core Product Catalog Samples
${catalogContext || 'No catalog items registered.'}

[GENERATION INSTRUCTIONS & OUTLINES]
Generate a thorough, structured, and complete manuscript in Markdown. You must execute every single section below in full detail, without shortcuts or placeholders.
SECTION 1: Strategic Market Position & Product Architecture
	1.	The Technical Narrative: Detail the technical position of the brand. Explain why the physical engineering details matter (e.g., how 1.1mm rigid steel prevents base flexing under 9 bar pressure, or how specific tolerances reduce flow channeling).
	2.	Fluid Dynamics / Physical Modeling: Include a mathematical representation of the problem the product solves. Use a relevant scientific or physical formula in clean LaTeX format (e.g., Darcy's Law for fluid flow through porous media: $Q = \\frac{-k A \\Delta P}{\\mu L}$ to describe hydraulic flow uniformity, or Extraction Yield % equations).
	3.	Product Catalog Matrix: Create a clean Markdown table mapping the core products to their exact physical specs, raw materials (e.g., 316-grade stainless steel, POM, vacuum-dyed birch), and price points.
SECTION 2: Multi-Segment Customer Personas
Build 2 highly distinct consumer profiles based on buying psychological motivations:
	1.	Persona A (The Technical Enthusiast): Focuses heavily on data, micro-tolerances, physical science, and repeatability. Detail their demographics, psychological triggers, and core friction points.
	2.	Persona B (The Design Curator): Focuses heavily on kitchen aesthetics, tactile materials (wood, resin), and visual alignment with their living space. Detail their demographics, aesthetic triggers, and core friction points.
SECTION 3: Brand Voice Guidelines & Vocabulary Protocol
	1.	Adjectives & Application: Define 4 voice adjectives that represent a premium, expert tone. Provide a copy example for each.
	2.	Controlled Vocabulary Matrix: Provide a clear table of:
•	Approved Terminology (e.g., hydraulic uniformity, zero-compromise engineering, structural rigidity).
•	Banned Terminology (e.g., cheap, budget-friendly, morning routine hack, game-changing, world's best).
SECTION 4: Performance Ads Copywriting Framework
Develop ad variations based on three psychological angles:
	1.	Emotional (Tactile & Aesthetic Satisfaction): Focuses on materials, weight, and visual ritual.
	2.	Logical (Data & Science): Focuses on eliminating channeling, extraction yield, and math.
	3.	Utility (Workflow & Durability): Focuses on compatibility, cleaning, and long-term use.
For each angle, provide:
•	One Cold Prospecting (TOFU) ad copy variation (Primary Text, Headline, Description).
•	One Retargeting (MOFU/BOFU) ad copy variation (Primary Text, Headline, Description).
•	Strict Copy Rule: Write descriptions and primary texts from an objective, premium third-person perspective using strong imperative calls-to-action. Do not use cheesy, spammy emojis.
SECTION 5: Video & Image Creative Briefs (AI Generation Ready)
	1.	Vertical Video Scripts (TikTok/Reels - 9:16): Provide 2 highly detailed, multi-scene video scripts. Each must include time stamps, specific visual directions, text overlays, and audio/ASMR cues (e.g., the physical click of a calibrated tamper or metal locking).
	2.	Text-to-Image Prompts (Midjourney/DALL-E style): Provide 3 highly descriptive, photorealistic text prompts for product photography. Structure them with Scene, Subject, Motion, Camera Angle/Lens, and Atmosphere/Lighting (e.g., \"Premium product shot of [Product Name] on a marble countertop, warm side lighting, shallow depth of field, 85mm lens, high-end architectural digest aesthetic\").
SECTION 6: High-Converting Email Flows
Provide raw, copy-pasteable email copy for:
	1.	Onboarding / Welcome Sequence (3 Steps): Step 1: Brand ethos and precision. Step 2: The physical science behind a key product feature. Step 3: Elite collaboration or design standards. Include subject lines, preheaders, and button CTA text.
	2.	Cart Abandonment Sequence (3 Steps): Step 1: Resolving performance hesitation. Step 2: Technical sizing and machine compatibility checklist. Step 3: Upgrading setup visual styling.
SECTION 7: Landing Page Visual Architecture
Provide a step-by-step structural blueprint for a high-converting landing page. Map out the exact visual containers, value statements, functional modules (e.g., an interactive compatibility sizing engine), and social proof blocks required to maximize conversion rates.
[EXECUTION RULE]
Output the complete Markdown document directly. Write all ad copy and email templates in ready-to-use, professional English. Do not explain your process or write conversational filler. Start directly with the first section header.`;
          }

          // Determine Gemini model based on brand's AI tier
          let targetModel = getTargetModel(brand.ai_tier);
 
          console.log(`[AI Protocol Generator] Querying Gemini for brand: ${brandId} using model: ${targetModel}`);
          let geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            }),
            signal: controller.signal
          });
 
          // Fallback for Enterprise tier if deep-research-pro-preview is not available or errors out
          if (!geminiRes.ok && brand.ai_tier === 'enterprise') {
            console.warn('[AI Protocol Generator] Enterprise model failed/throttled, falling back to gemini-3.1-pro');
            targetModel = 'gemini-3.1-pro';
            geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              }),
              signal: controller.signal
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

        let summary = '';
        const narrativeMatch = generatedProtocol.match(/### 1\.\s+The Technical Narrative\s*\n+([\s\S]+?)(?=\n+###|\n+##|$)/i);
        if (narrativeMatch) {
          summary = narrativeMatch[1].trim().split('\n')[0].substring(0, 160);
        } else {
          summary = generatedProtocol.substring(0, 160).trim().replace(/\r?\n/g, ' ');
        }
        if (summary && !summary.endsWith('...')) summary += '...';
        if (!summary) summary = 'DTC strategy manuscript...';

        await runQuery('UPDATE brand_manuscripts SET is_active = FALSE WHERE brand_id = $1', [brandId]);
        await runQuery('INSERT INTO brand_manuscripts (brand_id, content, summary, is_active) VALUES ($1, $2, $3, TRUE)', [brandId, generatedProtocol, summary]);

        await runQuery("UPDATE brands SET marketing_protocol = $1, protocol_status = 'completed', protocol_error = NULL WHERE id = $2", [generatedProtocol, brandId]);
        addAuditLog("Marketing Protocol Generated", "success", `Generated AI marketing manuscript for brand ${brandId}.`);
        activeAborts.delete(brandId);
      } catch (backgroundErr) {
        activeAborts.delete(brandId);
        if (backgroundErr.name === 'AbortError') {
          console.log(`[AI Protocol Generator] Strategist generation aborted by user for brand: ${brandId}`);
          await runQuery("UPDATE brands SET protocol_status = 'failed', protocol_error = 'Generation aborted by user.' WHERE id = $1", [brandId]);
          addAuditLog("Marketing Protocol Generation Aborted", "failed", `Strategy generation aborted for brand ${brandId}.`);
        } else {
          console.error('[AI Protocol Generator] Background generation failed:', backgroundErr.message);
          await runQuery("UPDATE brands SET protocol_status = 'failed', protocol_error = $1 WHERE id = $2", [backgroundErr.message, brandId]);
          addAuditLog("Marketing Protocol Generation Failed", "failed", `Error: ${backgroundErr.message}`);
        }
      }
    })();
  } catch (err) {
    console.error('[AI Protocol Generator] Failed to initialize background task:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Cancel ongoing protocol generation
app.post('/api/global/brands/:id/cancel-protocol', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  const controller = activeAborts.get(brandId);
  if (controller) {
    console.log(`[AI Protocol Generator] Aborting ongoing generation for brand: ${brandId}`);
    controller.abort();
    activeAborts.delete(brandId);
    return res.json({ success: true, message: 'Strategy playbook generation successfully cancelled.' });
  }

  // If not currently in memory, reset database state to failed/aborted
  await runQuery("UPDATE brands SET protocol_status = 'failed', protocol_error = 'Generation cancelled by user.' WHERE id = $1", [brandId]);
  res.json({ success: true, message: 'Strategy playbook generation status reset.' });
});

// GET Retrieve all manuscripts for a brand (metadata/thumbnails)
app.get('/api/global/brands/:id/manuscripts', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }
  try {
    const rows = await allQuery('SELECT id, brand_id, summary, created_at, is_active FROM brand_manuscripts WHERE brand_id = $1 ORDER BY created_at DESC', [brandId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Retrieve a specific manuscript's content
app.get('/api/global/brands/:id/manuscripts/:manuscriptId', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const manuscriptId = req.params.manuscriptId;
  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }
  try {
    const row = await getQuery('SELECT * FROM brand_manuscripts WHERE id = $1 AND brand_id = $2', [manuscriptId, brandId]);
    if (!row) return res.status(404).json({ error: 'Manuscript not found.' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Activate a specific manuscript version
app.post('/api/global/brands/:id/manuscripts/:manuscriptId/activate', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const manuscriptId = req.params.manuscriptId;
  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }
  try {
    const manuscript = await getQuery('SELECT content FROM brand_manuscripts WHERE id = $1 AND brand_id = $2', [manuscriptId, brandId]);
    if (!manuscript) return res.status(404).json({ error: 'Manuscript not found.' });

    await runQuery('UPDATE brand_manuscripts SET is_active = FALSE WHERE brand_id = $1', [brandId]);
    await runQuery('UPDATE brand_manuscripts SET is_active = TRUE WHERE id = $1 AND brand_id = $2', [manuscriptId, brandId]);
    
    // Sync the activated manuscript to the main brands marketing_protocol text column
    await runQuery('UPDATE brands SET marketing_protocol = $1 WHERE id = $2', [manuscript.content, brandId]);

    res.json({ success: true, message: 'Manuscript version successfully activated and synchronized.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a specific manuscript version
app.delete('/api/global/brands/:id/manuscripts/:manuscriptId', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const manuscriptId = req.params.manuscriptId;
  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }
  try {
    const manuscript = await getQuery('SELECT is_active FROM brand_manuscripts WHERE id = $1 AND brand_id = $2', [manuscriptId, brandId]);
    if (!manuscript) return res.status(404).json({ error: 'Manuscript not found.' });

    if (manuscript.is_active) {
      return res.status(400).json({ error: 'Cannot delete the active manuscript. Please activate another version first.' });
    }

    await runQuery('DELETE FROM brand_manuscripts WHERE id = $1 AND brand_id = $2', [manuscriptId, brandId]);
    res.json({ success: true, message: 'Manuscript version successfully deleted.' });
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
    let compUrls = [];
    const activeCompetitors = (competitors !== undefined) ? competitors : brand.competitors;
    if (activeCompetitors) {
      compUrls = Array.isArray(activeCompetitors)
        ? activeCompetitors
        : String(activeCompetitors).split(',').map(s => s.trim()).filter(Boolean);

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

    let prompt = '';
    const isPesado = brand.name.toLowerCase().includes('pesado');
    if (isPesado) {
      prompt = `You are an elite, premium DTC Performance Marketing Director and Brand Strategist specializing in luxury espresso hardware, precision barista equipment, and architectural home assets.
Your task is to analyze the brand data, catalog specifications, and competitive landscape provided below to generate a comprehensive, highly tactical Brand Performance Marketing Protocol and copy suite.
To maintain a luxury and professional standard, avoid typical DTC clichés (e.g., "revolutionize your morning," "game-changing hack," "we founded this to change the world"). Write with quiet, clinical confidence, focusing on physical engineering, material integrity, and aesthetic value.

BRAND DATA & PRODUCT INFRASTRUCTURE
1. Brand Profile & Core Web Data
•	Brand Name: Pesado 58.5
•	Website URL: https://pesado585.com
•	Meta Description: Precision Coffee tools for all barista levels - begin your coffee journey with Pesado premium coffee accessories and coffee tools.
•	Core Shipping & Offers: Free Shipping Australia Wide over $89+ AUD. Free shipping to USA over $100+ USD.
•	Scraped Web Content / Core Claims:
${homepageText}

2. Unique Selling Propositions & Claims
•	Modular Styling System: Ability to mix and match tamper and portafilter handles to coordinate with home interiors. Interchangeable handle selection includes sustainable timber, metallic, or custom resins.
•	Sustainable Material Focus: Handcrafted handles crafted from highly sustainable cross-layered European birch wood. Vacuum-dyed to achieve a rich oak finish and sealed with a heat- and water-resistant wax.
•	Calibrated Tamping Collaboration: A spring-loaded, self-leveling tamper developed with 2022 World Barista Champion Anthony Douglas. Features a concave thumb-matching grip, an integrated leveling guide, and a 3-wing depth adjuster.
•	High Extraction He[%] Filter Baskets: Engineered from rigid 1.1mm marine-grade stainless steel to prevent base-flexing under 9-bar pressure. Edge-to-edge laser perforations maximize the extraction surface to extract more Total Dissolved Solids (TDS) and eliminate peripheral channeling.

3. Core Product Catalog Sizing & Sizing Benchmarks
•	High Extraction He[%] Filter Basket: $71.50 USD (Sizes: Small 15-17g, Medium 17-19g, Large 19-21g, XL 21-22g). 1.1mm thick steel. Fits 54mm and 58mm systems.
•	Spring-Loaded Self-Leveling Tamper x AD Coffee: $132.00 USD. 316-grade stainless base, POM ergonomic handle, 616g weight.
•	Hybrid Portafilter (Spouted & Bottomless): From $150.70 USD. Forged high-grade stainless steel head, versatile removable spout design.
•	High Diffusion Espresso Shower Screen: $55.00 - $60.50 USD. Even water distribution membranes to prevent channel jetting.
•	Stainless Steel Clump Crusher V2.0 (WDT): $37.79 USD. Ultra-fine flexible pins, anodized alloy handle.
•	Impact Gravity Espresso Grounds Distributor: $132.00 USD. Weighted base with automatic gravity depth-leveling.
Active Catalog Data Context:
${catalogContext || 'No catalog items registered.'}

4. Competitor Landscape & Friction Points
•	Normcore Coffee (Accessible Premium): Popular calibrated tampers, but uses mass-produced multi-spring mechanisms that can trap grounds between plates and show minor alignment variances over time.
•	Pullman Espresso (Ultra-Premium Performance): High-precision BigStep bases machined locally in Australia, but maintains a highly industrial, rigid visual design.
•	Saint Anthony Industries (Design-First Minimalist): Beautiful solid wood handles and wedge distributors, but lacks a heavy emphasis on high-extraction fluid dynamics and mathematical precision.
•	The Workflow Gap: Consumers often buy high-extraction baskets without upgrading their tampers, leading to extreme water channeling because finer grinds require perfectly level compaction. Pesado solves this through coordinated "Workflow Ecosystems" (bundling baskets, self-leveling tampers, and WDT clump crushers).

GENERATION INSTRUCTIONS & OUTLINES
Generate a thorough, structured, and complete manuscript in Markdown based on the above data. You must execute every single section below in full detail, without shortcuts or placeholders.
SECTION 1: Strategic Market Position & Product Architecture
	1.	The Technical Narrative: Detail the technical position of Pesado 58.5. Explain why the physical engineering details matter (e.g., how 1.1mm rigid steel prevents base flexing under 9 bars of pressure, or how specific tolerances reduce flow channeling).
	2.	Fluid Dynamics / Physical Modeling: Include mathematical representations of the problems solved by the products. Write Darcy's Law for fluid flow through porous media ($Q = \\frac{-k A \\Delta P}{\\mu L}$) to describe hydraulic flow uniformity, and the Extraction Yield ($EY\\% = \\frac{\\text{Weight of Brewed Espresso} \\times \\text{TDS\\%}}{\\text{Dry Coffee Dose}}$) equation in clean LaTeX format.
	3.	Product Catalog Matrix: Create a clean Markdown table mapping the core products to their exact physical specs, raw materials, and price points.
SECTION 2: Multi-Segment Customer Personas
Build 2 highly distinct consumer profiles based on buying psychological motivations:
	1.	Persona A (The Technical Enthusiast / Extraction Scientist): Typically software developers or engineers. Obsessed with TDS data, micro-tolerances, physical science, and repeat performance. Explain their triggers, frustrations, and preferred specs.
	2.	Persona B (The Design Curator): Typically architects or creative professionals. Focuses on the beauty of their home setup, tactile feedback, materials (natural wood/resins), and workstation aesthetics. Explain their triggers, frustrations, and visual alignment goals.
SECTION 3: Brand Voice Guidelines & Vocabulary Protocol
	1.	Adjectives & Application: Define 4 voice adjectives that represent Pesado's premium, technical tone. Provide an applied copy example for each.
	2.	Controlled Vocabulary Matrix: Provide a clear table of:
•	Approved Terminology (e.g., hydraulic uniformity, edge-to-edge percolation, zero-compromise engineering, structural rigidity under pressure).
•	Banned Terminology (e.g., cheap, budget-friendly, morning routine hack, game-changing, world's best, ultimate trick).
SECTION 4: Performance Ads Copywriting Framework
Develop ad variations based on three psychological angles:
	1.	Emotional (Tactile & Aesthetic Satisfaction): Focuses on custom materials, balanced weight, and the daily visual ritual.
	2.	Logical (Data & Science): Focuses on eliminating channeling, structural base rigidity, and maximizing extraction yields.
	3.	Utility (Workflow & Durability): Focuses on machine compatibility, simple maintenance, and long-term durability.
For each angle, provide:
•	One Cold Prospecting (TOFU) ad copy variation (Primary Text, Headline, Description).
•	One Retargeting (MOFU/BOFU) ad copy variation (Primary Text, Headline, Description).
•	Strict Copy Rule: Write descriptions and primary texts from an objective, premium third-person perspective using strong imperative calls-to-action. Do not use cheesy, spammy emojis.
SECTION 5: Video & Image Creative Briefs (AI Generation Ready)
	1.	Vertical Video Scripts (TikTok/Reels - 9:16): Provide 2 highly detailed, multi-scene video scripts. Each must include time stamps, specific visual directions, text overlays, and audio/ASMR cues (e.g., the physical click of a calibrated tamper or metal locking).
	2.	Text-to-Image Prompts (Midjourney/DALL-E style): Provide 3 highly descriptive, photorealistic text prompts for product photography. Structure them with Scene, Subject, Motion, Camera Angle/Lens, and Atmosphere/Lighting (e.g., "Premium product shot of [Product Name] on a marble countertop, warm side lighting, shallow depth of field, 85mm lens, high-end architectural digest aesthetic").
SECTION 6: High-Converting Email Flows
Provide raw, copy-pasteable email copy for:
	1.	Onboarding / Welcome Sequence (3 Steps): Step 1: The Principle of 58.5mm Precision. Step 2: The physics of 1.1mm stainless steel and preventing puck flex. Step 3: Elite collaboration and World Champion design standards. Include subject lines, preheaders, and button CTA text.
	2.	Cart Abandonment Sequence (3 Steps): Step 1: Eliminating the performance variable. Step 2: Sizing and machine compatibility validation checklist. Step 3: Designing the workstation aesthetic.
SECTION 7: Landing Page Visual Architecture
Provide a step-by-step structural blueprint for a high-converting landing page. Map out the exact visual containers, value statements, functional modules (e.g., an interactive machine compatibility engine to find the right portafilter/tamper sizes), and social proof blocks.
[EXECUTION RULE]
Output the complete Markdown document directly. Write all ad copy and email templates in ready-to-use, professional English. Do not explain your process, provide meta-commentary, or write conversational filler. Start directly with the first section header.`;
    } else {
      prompt = `You are an elite, premium DTC Performance Marketing Director and Brand Strategist specializing in high-end consumer hardware, luxury lifestyle products, and precision-engineered gear.
Your task is to analyze the raw storefront data, catalog samples, and competitor context provided below to generate a comprehensive, highly tactical Brand Performance Marketing Protocol and Strategic Manuscript.
To maintain a luxury and professional standard, avoid typical DTC clichés (e.g., "we founded this brand to change the world," "revolutionary," "game-changer," "ultimate hack"). Write with quiet, clinical confidence, focusing on physical engineering, material integrity, and aesthetic value.

[INPUT DATA]
1. Brand Profile & Core Web Data
•	Brand Name: ${brand.name}
•	Website URL: ${targetUrl || 'Not available'}
•	Primary Value Prop / Meta Description: Precision coffee tools for all barista levels, premium accessories.
•	Scraped Web Content / Core Claims:
${homepageText}

2. Competitor Context & Market Positioning
•	Primary Direct Competitors: ${compUrls.length > 0 ? compUrls.join(', ') : 'Pullman, Normcore, Saint Anthony Industries'}
•	Target Price Segment: Premium, high-end ($50 - $200+ USD accessories)
•	Core Market Pain Points: Uneven extraction, channeling, cheap plastic tools, lack of setup aesthetic cohesion
${competitorTexts.length > 0 ? '\nCompetitor Scraping Context:\n' + competitorTexts.join('\n\n') : ''}

3. Core Product Catalog Samples
${catalogContext || 'No catalog items registered.'}

[GENERATION INSTRUCTIONS & OUTLINES]
Generate a thorough, structured, and complete manuscript in Markdown. You must execute every single section below in full detail, without shortcuts or placeholders.
SECTION 1: Strategic Market Position & Product Architecture
	1.	The Technical Narrative: Detail the technical position of the brand. Explain why the physical engineering details matter (e.g., how 1.1mm rigid steel prevents base flexing under 9 bar pressure, or how specific tolerances reduce flow channeling).
	2.	Fluid Dynamics / Physical Modeling: Include a mathematical representation of the problem the product solves. Use a relevant scientific or physical formula in clean LaTeX format (e.g., Darcy's Law for fluid flow through porous media: $Q = \\frac{-k A \\Delta P}{\\mu L}$ to describe hydraulic flow uniformity, or Extraction Yield % equations).
	3.	Product Catalog Matrix: Create a clean Markdown table mapping the core products to their exact physical specs, raw materials (e.g., 316-grade stainless steel, POM, vacuum-dyed birch), and price points.
SECTION 2: Multi-Segment Customer Personas
Build 2 highly distinct consumer profiles based on buying psychological motivations:
	1.	Persona A (The Technical Enthusiast): Focuses heavily on data, micro-tolerances, physical science, and repeatability. Detail their demographics, psychological triggers, and core friction points.
	2.	Persona B (The Design Curator): Focuses heavily on kitchen aesthetics, tactile materials (wood, resin), and visual alignment with their living space. Detail their demographics, aesthetic triggers, and core friction points.
SECTION 3: Brand Voice Guidelines & Vocabulary Protocol
	1.	Adjectives & Application: Define 4 voice adjectives that represent a premium, expert tone. Provide a copy example for each.
	2.	Controlled Vocabulary Matrix: Provide a clear table of:
•	Approved Terminology (e.g., hydraulic uniformity, zero-compromise engineering, structural rigidity).
•	Banned Terminology (e.g., cheap, budget-friendly, morning routine hack, game-changing, world's best).
SECTION 4: Performance Ads Copywriting Framework
Develop ad variations based on three psychological angles:
	1.	Emotional (Tactile & Aesthetic Satisfaction): Focuses on materials, weight, and visual ritual.
	2.	Logical (Data & Science): Focuses on eliminating channeling, extraction yield, and math.
	3.	Utility (Workflow & Durability): Focuses on compatibility, cleaning, and long-term use.
For each angle, provide:
•	One Cold Prospecting (TOFU) ad copy variation (Primary Text, Headline, Description).
•	One Retargeting (MOFU/BOFU) ad copy variation (Primary Text, Headline, Description).
•	Strict Copy Rule: Write descriptions and primary texts from an objective, premium third-person perspective using strong imperative calls-to-action. Do not use cheesy, spammy emojis.
SECTION 5: Video & Image Creative Briefs (AI Generation Ready)
	1.	Vertical Video Scripts (TikTok/Reels - 9:16): Provide 2 highly detailed, multi-scene video scripts. Each must include time stamps, specific visual directions, text overlays, and audio/ASMR cues (e.g., the physical click of a calibrated tamper or metal locking).
	2.	Text-to-Image Prompts (Midjourney/DALL-E style): Provide 3 highly descriptive, photorealistic text prompts for product photography. Structure them with Scene, Subject, Motion, Camera Angle/Lens, and Atmosphere/Lighting (e.g., \"Premium product shot of [Product Name] on a marble countertop, warm side lighting, shallow depth of field, 85mm lens, high-end architectural digest aesthetic\").
SECTION 6: High-Converting Email Flows
Provide raw, copy-pasteable email copy for:
	1.	Onboarding / Welcome Sequence (3 Steps): Step 1: Brand ethos and precision. Step 2: The physical science behind a key product feature. Step 3: Elite collaboration or design standards. Include subject lines, preheaders, and button CTA text.
	2.	Cart Abandonment Sequence (3 Steps): Step 1: Resolving performance hesitation. Step 2: Technical sizing and machine compatibility checklist. Step 3: Upgrading setup visual styling.
SECTION 7: Landing Page Visual Architecture
Provide a step-by-step structural blueprint for a high-converting landing page. Map out the exact visual containers, value statements, functional modules (e.g., an interactive compatibility sizing engine), and social proof blocks required to maximize conversion rates.
[EXECUTION RULE]
Output the complete Markdown document directly. Write all ad copy and email templates in ready-to-use, professional English. Do not explain your process or write conversational filler. Start directly with the first section header.`;
    }

    res.json({ success: true, prompt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Generate AI look-alike storefront layout styling configurations
// POST AI copywriting rewrite helper
app.post('/api/global/brands/:id/ai-rewrite', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { text, field, tone } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  if (!text) {
    return res.status(400).json({ error: 'Missing required field: text' });
  }

  try {
    await checkAiLimits(brandId);
    const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini General API key not configured.' });
    }

    const brand = await getQuery('SELECT name, ai_tier FROM brands WHERE id = $1', [brandId]);
    const brandName = brand ? brand.name : 'our cafe';

    let targetModel = getTargetModel(brand ? brand.ai_tier : 'professional');

    let instruction = 'Rewrite the following storefront copy string to make it more engaging, premium, and high-converting.';
    if (tone === 'punchy') instruction = 'Rewrite this storefront copy text to be more punchy, modern, vibrant, and engaging. Keep it brief and match its length.';
    else if (tone === 'professional') instruction = 'Rewrite this storefront copy text to sound highly professional, luxury, trustworthy, and high-end. Keep the character length similar.';
    else if (tone === 'hype') instruction = 'Turn this storefront copy text into a high-converting, premium marketing hook or CTA. Make it sound exciting.';
    else if (tone === 'shorten') instruction = 'Shorten this storefront copy to be as concise as possible while retaining its core meaning.';
    else if (tone === 'lengthen') instruction = 'Elaborate slightly on this storefront copy to sound highly premium, detailed, and description-rich.';

    const systemPrompt = `You are an expert luxury brand copywriter. ${instruction}
For brand name context: "${brandName}".
Original text for field "${field || 'copy'}": "${text}"
Return ONLY the rewritten string without quotes, markdown formatting, or explanations.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    if (response.ok) {
      const result = await response.json();
      const rewrittenText = (result.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (result.usageMetadata) {
        await logAiUsage(brandId, 'AI Copy Rewrite', targetModel, result.usageMetadata);
      }
      res.json({ success: true, text: rewrittenText });
    } else {
      const errText = await response.text();
      res.status(500).json({ error: `Gemini API returned error: ${errText}` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST AI generate campaign from a goal prompt
app.post('/api/global/brands/:id/ai-generate-campaign', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { goal } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  if (!goal) {
    return res.status(400).json({ error: 'Missing required field: goal' });
  }

  try {
    await checkAiLimits(brandId);
    const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini General API key not configured.' });
    }

    const brand = await getQuery('SELECT name, ai_tier, marketing_protocol FROM brands WHERE id = $1', [brandId]);
    const brandName = brand ? brand.name : 'our cafe';

    let targetModel = getTargetModel(brand ? brand.ai_tier : 'professional');

    const systemPrompt = `You are an elite omnichannel ad campaign director and luxury brand copywriter.
Generate a structured, cohesive ad campaign and matching landing page content based on the following brand context and campaign goal.

Brand Name: "${brandName}"
Brand Voice & Guidelines:
${brand ? brand.marketing_protocol : 'Default premium coffee brand.'}

Campaign Goal / Topic: "${goal}"

You must return a valid, parseable JSON object matching the exact structure below. Do NOT wrap the JSON in markdown code blocks or add any markdown formatting. Verify that your response can be parsed cleanly.

Expected JSON structure:
{
  "name": "A premium descriptive campaign name",
  "headline": "Variant A Headline (compelling callout, max 50 chars)",
  "ad_copy": "Variant A Description Body (marketing hook, max 150 chars)",
  "headline_b": "Variant B Headline (alternative hook, max 50 chars)",
  "ad_copy_b": "Variant B Description Body (alternative description, max 150 chars)",
  "suggested_platforms": ["meta", "google", "x"],
  "suggested_budget": 150,
  "suggested_roas": 3.0,
  "landing_page_title": "Descriptive title for the landing page",
  "landing_page_headline": "An attention-grabbing hero headline for the landing page matching the campaign goal",
  "landing_page_subheadline": "A supporting subheadline matching the brand voice",
  "landing_page_cta": "Call to action button text",
  "landing_page_coupon_code": "Coupon code matching this campaign, e.g. FRESH15",
  "landing_page_features": "A newline-separated list of 3 premium product features/USPs formatted exactly with bullet emoji hooks, e.g. ⚡ Rich Aroma\\n☕ Perfect Crema\\n🌱 Responsibly Sourced"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (response.ok) {
      const result = await response.json();
      const text = (result.candidates?.[0]?.content?.parts?.[0]?.text || '{}').trim();
      const generatedCampaign = JSON.parse(text);
      if (result.usageMetadata) {
        await logAiUsage(brandId, 'AI Campaign Generation', targetModel, result.usageMetadata);
      }
      res.json({ success: true, campaign: generatedCampaign });
    } else {
      const errText = await response.text();
      res.status(500).json({ error: `Gemini API returned error: ${errText}` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST AI copywriting translate single field helper
app.post('/api/global/brands/:id/ai-translate', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { text, targetLang, field } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields: text, targetLang' });
  }

  try {
    await checkAiLimits(brandId);
    const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini General API key not configured.' });
    }

    const brand = await getQuery('SELECT ai_tier FROM brands WHERE id = $1', [brandId]);
    let targetModel = getTargetModel(brand ? brand.ai_tier : 'professional');

    const systemPrompt = `You are an expert translator. Translate the following storefront copy string into the language code "${targetLang}". Keep it natural, idiomatic, and premium in style. Preserve placeholders like {brandName} or [brandName] exactly.
Original text for field "${field || 'copy'}": "${text}"
Return ONLY the translated string without quotes or markdown.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    if (response.ok) {
      const result = await response.json();
      const translatedText = (result.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (result.usageMetadata) {
        await logAiUsage(brandId, 'AI Copy Translation', targetModel, result.usageMetadata);
      }
      res.json({ success: true, text: translatedText });
    } else {
      const errText = await response.text();
      res.status(500).json({ error: `Gemini API returned error: ${errText}` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST AI bulk translate-all storefront pages copy helper
app.post('/api/global/brands/:id/ai-translate-all', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { targetLang } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    await checkAiLimits(brandId);
    const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini General API key not configured.' });
    }

    const brand = await getQuery('SELECT theme_settings, languages FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    const availableLangs = (brand.languages || 'en').split(',').map(l => l.trim().toLowerCase());
    const langsToTranslate = targetLang 
      ? [targetLang.toLowerCase()] 
      : availableLangs.filter(l => l !== 'en');

    if (langsToTranslate.length === 0) {
      return res.json({ success: true, message: 'No translation target languages found.' });
    }

    let theme = {};
    if (brand.theme_settings) {
      try {
        theme = JSON.parse(brand.theme_settings);
      } catch (e) {}
    }

    // Assemble English source strings
    const englishStrings = {
      text_hero_headline: theme.text_hero_headline || '',
      text_hero_subheadline: theme.text_hero_subheadline || '',
      text_hero_cta: theme.text_hero_cta || '',
      announcement_text: theme.announcement_text || '',
      text_404_headline: theme.text_404_headline || '',
      text_404_subheadline: theme.text_404_subheadline || '',
      text_404_cta: theme.text_404_cta || '',
      text_track_headline: theme.text_track_headline || '',
      text_track_subheadline: theme.text_track_subheadline || '',
      text_track_placeholder: theme.text_track_placeholder || '',
      text_track_cta: theme.text_track_cta || '',
      landing_pages: {}
    };

    if (theme.landing_pages && Array.isArray(theme.landing_pages)) {
      theme.landing_pages.forEach(p => {
        englishStrings.landing_pages[p.id] = {
          headline: p.headline || '',
          subheadline: p.subheadline || '',
          cta: p.cta || '',
          features: p.features || ''
        };
      });
    }

    if (!theme.content_translations) {
      theme.content_translations = {};
    }

    const targetModel = getTargetModel(brand.ai_tier);
    for (const lang of langsToTranslate) {
      console.log(`[AI Bulk Translate] Translating all pages to "${lang}" for brand: ${brandId} using model: ${targetModel}`);
      const systemPrompt = `You are an expert translator. Translate the following storefront copywriting strings from English into the target language: "${lang}".
Preserve all keys exactly. Preserve placeholders like {brandName} or [brandName] exactly. Keep it natural, idiomatic, and premium in style.

Return ONLY a valid JSON object matching the exact structure of the input strings:
${JSON.stringify(englishStrings, null, 2)}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        let translatedData = {};
        try {
          // Remove potential markdown code wraps from response
          const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
          translatedData = JSON.parse(cleanText);
        } catch (jsonErr) {
          console.error('[AI Bulk Translate] JSON parse error for translation response:', text);
          continue;
        }

        if (result.usageMetadata) {
          await logAiUsage(brandId, `AI Copy Bulk Translation (${lang})`, targetModel, result.usageMetadata);
        }

        // Merge back into theme content_translations
        theme.content_translations[lang] = {
          text_hero_headline: translatedData.text_hero_headline || '',
          text_hero_subheadline: translatedData.text_hero_subheadline || '',
          text_hero_cta: translatedData.text_hero_cta || '',
          announcement_text: translatedData.announcement_text || '',
          text_404_headline: translatedData.text_404_headline || '',
          text_404_subheadline: translatedData.text_404_subheadline || '',
          text_404_cta: translatedData.text_404_cta || '',
          text_track_headline: translatedData.text_track_headline || '',
          text_track_subheadline: translatedData.text_track_subheadline || '',
          text_track_placeholder: translatedData.text_track_placeholder || '',
          text_track_cta: translatedData.text_track_cta || ''
        };

        // Merge custom page translations back
        if (theme.landing_pages && Array.isArray(theme.landing_pages)) {
          theme.landing_pages.forEach(p => {
            const pageTrans = translatedData.landing_pages?.[p.id];
            if (pageTrans) {
              if (!p.translations) {
                p.translations = {};
              }
              p.translations[lang] = {
                headline: pageTrans.headline || '',
                subheadline: pageTrans.subheadline || '',
                cta: pageTrans.cta || '',
                features: pageTrans.features || ''
              };
            }
          });
        }
      } else {
        const errText = await response.text();
        console.error(`[AI Bulk Translate] Gemini translation error: ${errText}`);
      }
    }

    const updatedSettings = JSON.stringify(theme);
    await runQuery('UPDATE brands SET theme_settings = $1 WHERE id = $2', [updatedSettings, brandId]);

    res.json({ success: true, theme_settings: theme });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/global/brands/:id/generate-ai-layout', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  try {
    await checkAiLimits(brandId);
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    if (!brand.marketing_protocol) {
      return res.status(400).json({ error: 'No brand manuscript generated yet. Please generate a Brand Strategy Playbook first.' });
    }

    const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini General API key not configured.' });
    }

    const { prompt: userPrompt } = req.body;

    let promptInstructions = `You are a premium digital Brand Designer and Frontend Art Director.
Analyze the following Brand Strategy Playbook:

[BRAND PLAYBOOK]
${brand.marketing_protocol}
`;

    if (userPrompt) {
      promptInstructions += `\n[USER DESIGN PROMPT/REQUEST]\nThe user wants the storefront layout to match this creative direction / prompt request:\n"${userPrompt}"\n`;
    }

    promptInstructions += `\nDetermine a highly professional, visually stunning, cohesive color scheme, button border radius, font family, and hero copywriting blocks that perfectly matches the brand's voice, customer personas, and the user's custom design request.

Return ONLY a JSON object matching this structure:
{
  "primary_color": "Hex color code e.g. #c5a059",
  "secondary_color": "Hex color code e.g. #767676",
  "bg_color": "Hex color code e.g. #ffffff",
  "text_color": "Hex color code e.g. #111111",
  "header_bg_color": "Hex color code e.g. #ffffff",
  "button_text_color": "Hex color code e.g. #ffffff",
  "button_radius": "One of: 0px, 4px, 8px, 12px, 9999px",
  "font_family": "One of: Outfit, Space Grotesk, Inter, Roboto, Open Sans",
  "text_hero_headline": "An punchy, attention-grabbing homepage banner headline based on their USPs",
  "text_hero_subheadline": "A supporting, high-converting subheadline explaining the value proposition",
  "text_hero_cta": "Action-oriented CTA text e.g. Explore Precision Gear"
}`;

    const targetModel = getTargetModel(brand.ai_tier);
    console.log(`[AI Layout Generator] Analyzing brand strategy & user prompt for: ${brandId} using model: ${targetModel}`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptInstructions }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (response.ok) {
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const layoutSettings = JSON.parse(text);

      if (result.usageMetadata) {
        await logAiUsage(brandId, 'Brand Style Layout Generation', targetModel, result.usageMetadata);
      }

      res.json({ success: true, layout: layoutSettings });
    } else {
      const errText = await response.text();
      res.status(500).json({ error: `Gemini API returned status ${response.status}: ${errText}` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Generate structural landing page with copy via AI
app.post('/api/global/brands/:id/generate-ai-page', verifyAdminToken, async (req, res) => {
  const brandId = req.params.id;
  const { prompt: userTopic, productId } = req.body;

  if (req.user.role !== 'superadmin' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
  }

  if (!userTopic) {
    return res.status(400).json({ error: 'Missing required parameter: prompt' });
  }

  try {
    await checkAiLimits(brandId);
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    // Load product context if associated
    let productContext = 'No specific product linked.';
    let finalProductId = productId || '';
    if (finalProductId) {
      const product = await getQuery('SELECT title, description, price FROM products WHERE id = $1 AND brand_id = $2', [finalProductId, brandId]);
      if (product) {
        productContext = `Product: ${product.title} (€${parseFloat(product.price).toFixed(2)})\nDescription: ${product.description || ''}`;
      } else {
        finalProductId = ''; // clear if invalid
      }
    }

    const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini General API key not configured.' });
    }

    const prompt = `You are an elite Performance Copywriter and UX Architect.
Generate a structured, high-converting Landing Page campaign.

Brand Manuscript & Voice guidelines:
${brand.marketing_protocol || 'Default premium coffee brand.'}

Product Context:
${productContext}

Campaign Theme/Topic:
${userTopic}

Return ONLY a JSON object representing the page structure and copy content:
{
  "title": "A short internal name for this landing page e.g. Black Friday Promo",
  "headline": "A punchy, attention-grabbing hero headline",
  "subheadline": "An explanatory subheadline matching the brand voice",
  "cta": "Action button text e.g. Order Now with 20% Off",
  "coupon_code": "Promo coupon code e.g. SAVE20",
  "features": "A newline-separated list of 3 premium product features/USPs formatted exactly with bullet emoji hooks, e.g. ⚡ Precision Shower Screen\n☕ Zero Channeling Guarantee\n📦 Worldwide Express Shipping"
}`;

    const targetModel = getTargetModel(brand.ai_tier);
    console.log(`[AI Page Generator] Drafting campaign landing page structure for brand: ${brandId} using model: ${targetModel}`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (response.ok) {
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const pageDraft = JSON.parse(text);

      if (result.usageMetadata) {
        await logAiUsage(brandId, 'Campaign Page Structure Generation', targetModel, result.usageMetadata);
      }

      // Automatically persist/save to the brand's landing_pages array inside theme_settings!
      let theme = {};
      if (brand.theme_settings) {
        try {
          theme = JSON.parse(brand.theme_settings);
        } catch (e) {}
      }

      const existingPages = theme.landing_pages || [];
      const newPageId = 'lp_' + Math.random().toString(36).substring(2, 9);
      const newPageObj = {
        id: newPageId,
        title: pageDraft.title || userTopic,
        type: 'standard',
        product_id: finalProductId,
        inherit: true, // inherits brand colors
        headline: pageDraft.headline || '',
        subheadline: pageDraft.subheadline || '',
        cta: pageDraft.cta || '',
        coupon_code: pageDraft.coupon_code || '',
        features: pageDraft.features || '',
        hero_img: '',
        created_at: new Date().toISOString()
      };

      existingPages.push(newPageObj);
      theme.landing_pages = existingPages;

      // Set fallback parameters if this is the first page
      if (existingPages.length === 1) {
        theme.landing_inherit = true;
        theme.landing_type = 'standard';
        theme.landing_product_id = finalProductId;
        theme.landing_headline = pageDraft.headline;
        theme.landing_subheadline = pageDraft.subheadline;
        theme.landing_cta = pageDraft.cta;
        theme.landing_features = pageDraft.features;
        theme.landing_coupon_code = pageDraft.coupon_code;
      }

      await runQuery('UPDATE brands SET theme_settings = $1 WHERE id = $2', [JSON.stringify(theme), brandId]);

      res.json({ success: true, page: newPageObj });
    } else {
      const errText = await response.text();
      res.status(500).json({ error: `Gemini API returned status ${response.status}: ${errText}` });
    }
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

// GET Global AI Usage overview for all brands (superadmin only)
app.get('/api/global/superadmin/ai-usage', verifyAdminToken, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Superadmin access required.' });
  }

  try {
    const summaryRows = await allQuery(`
      SELECT 
        b.id as brand_id,
        b.name as brand_name,
        b.ai_tier,
        b.ai_free_tier,
        COUNT(l.id) as total_calls,
        COALESCE(SUM(l.total_tokens), 0) as total_tokens,
        COALESCE(SUM(l.estimated_cost_usd), 0.0) as total_cost_usd
      FROM brands b
      LEFT JOIN ai_usage_logs l ON b.id = l.brand_id
      GROUP BY b.id, b.name, b.ai_tier, b.ai_free_tier
      ORDER BY total_cost_usd DESC
    `);
    
    res.json({
      success: true,
      summary: summaryRows.map(row => ({
        brand_id: row.brand_id,
        brand_name: row.brand_name,
        ai_tier: row.ai_tier,
        ai_free_tier: !!row.ai_free_tier,
        total_calls: parseInt(row.total_calls, 10),
        total_tokens: parseInt(row.total_tokens, 10),
        total_cost_usd: parseFloat(parseFloat(row.total_cost_usd).toFixed(6))
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Realtime AI Studio rate limit usage (superadmin only)
app.get('/api/global/superadmin/realtime-limits', verifyAdminToken, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Superadmin access required.' });
  }

  const { brandId } = req.query;
  const brandFilter = brandId ? 'AND brand_id = $1' : '';
  const params = brandId ? [brandId] : [];

  try {
    const lastMinuteUsage = await allQuery(`
      SELECT 
        model, 
        COUNT(id) as rpm, 
        COALESCE(SUM(total_tokens), 0) as tpm
      FROM ai_usage_logs
      WHERE created_at >= NOW() - INTERVAL '1 minute' ${brandFilter}
      GROUP BY model
    `, params);

    const lastDayUsage = await allQuery(`
      SELECT 
        model, 
        COUNT(id) as rpd
      FROM ai_usage_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours' ${brandFilter}
      GROUP BY model
    `, params);

    const limits = {
      'gemini-2.5-flash': { rpm: 1000, tpm: 1000000, rpd: 10000 },
      'gemini-1.5-flash': { rpm: 15, tpm: 1000000, rpd: 1500 },
      'gemini-3.1-pro': { rpm: 25, tpm: 2000000, rpd: 32000 },
      'gemini-1.5-pro': { rpm: 360, tpm: 2000000, rpd: 32000 },
      'deep-research-pro-preview': { rpm: 1, tpm: 500000, rpd: 100 }
    };

    const modelsData = Object.keys(limits).map(model => {
      const minData = lastMinuteUsage.find(u => u.model === model) || { rpm: 0, tpm: 0 };
      const dayData = lastDayUsage.find(u => u.model === model) || { rpd: 0 };
      const modelLimits = limits[model];

      return {
        model,
        rpm: parseInt(minData.rpm, 10),
        tpm: parseInt(minData.tpm, 10),
        rpd: parseInt(dayData.rpd, 10),
        limit_rpm: modelLimits.rpm,
        limit_tpm: modelLimits.tpm,
        limit_rpd: modelLimits.rpd
      };
    });

    res.json({ success: true, usage: modelsData });
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
      rows = await allQuery('SELECT id, email, role, brand_id, first_name, last_name, created_at FROM users WHERE brand_id = $1 ORDER BY email ASC', [req.user.brand_id]);
    } else {
      rows = await allQuery('SELECT id, email, role, brand_id, first_name, last_name, created_at FROM users ORDER BY email ASC');
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

// Bulk delete portal users handled above

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
  const { brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, translations, meta_details, price_source, details_source, original_price } = req.body;

  if (!brand_id || !title || !price) {
    return res.status(400).json({ error: 'Missing required fields: brand_id, title, price' });
  }

  // Scope validation for merchants
  if (req.user.role === 'merchant' && req.user.brand_id !== brand_id) {
    return res.status(403).json({ error: 'Permission denied. Cannot add product to other brands.' });
  }

  try {
    const brand = await getQuery('SELECT id, price_markup FROM brands WHERE id = $1', [brand_id]);
    if (!brand) {
      return res.status(400).json({ error: `Brand ${brand_id} does not exist.` });
    }

    const markup = brand ? parseFloat(brand.price_markup) : 0;
    const finalPriceSource = price_source || (external_id ? 'external' : 'manual');
    const finalOriginalPrice = original_price !== undefined ? parseFloat(original_price) : parseFloat(price);
    const finalPrice = markup > 0 && finalPriceSource === 'external' ? finalOriginalPrice * (1 + markup / 100) : parseFloat(price);

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : features || '[]';
    const compatibilityJson = Array.isArray(compatibility) ? JSON.stringify(compatibility) : compatibility || '[]';
    const translationsJson = translations ? (typeof translations === 'string' ? translations : JSON.stringify(translations)) : null;
    const metaDetailsJson = meta_details ? (typeof meta_details === 'string' ? meta_details : JSON.stringify(meta_details)) : null;

    await runQuery(`
      INSERT INTO products (brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, translations, meta_details, price_source, details_source, original_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
      brand_id,
      title,
      parseFloat(finalPrice.toFixed(2)),
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
      metaDetailsJson,
      finalPriceSource,
      details_source || (external_id ? 'external' : 'manual'),
      finalOriginalPrice
    ]);

    addAuditLog("Catalog Product Create", "success", `Product "${title}" (SKU: ${sku || 'N/A'}) manually added to brand ${brand_id}.`);
    res.json({ success: true });
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
  if (brandId) {
    try {
      await checkAiLimits(brandId);
    } catch (err) {
      return res.status(429).json({ error: err.message });
    }
  }
  let brand = null;
  if (brandId) {
    try {
      brand = await getQuery('SELECT name, marketing_protocol, ai_tier FROM brands WHERE id = $1', [brandId]);
    } catch (e) {
      console.warn('[SEO Generator] Error querying brand info:', e.message);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const targetModel = getTargetModel(brand ? brand.ai_tier : 'professional');
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
      console.log(`[SEO Generator] Querying Gemini for SEO optimization using model: ${targetModel}`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
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
          await logAiUsage(brandId, 'Product SEO Content Generation', targetModel, result.usageMetadata);
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
  const { title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, active, translations, meta_details, price_source, details_source, original_price } = req.body;

  try {
    const product = await getQuery('SELECT brand_id, price, original_price, price_source FROM products WHERE id = $1', [parseInt(id, 10)]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Scope validation for merchants
    if (req.user.role === 'merchant' && req.user.brand_id !== product.brand_id) {
      return res.status(403).json({ error: 'Permission denied. Cannot update product of other brands.' });
    }

    const brand = await getQuery('SELECT price_markup FROM brands WHERE id = $1', [product.brand_id]);
    const markup = brand ? parseFloat(brand.price_markup) : 0;

    let finalPrice = parseFloat(price);
    const finalPriceSource = price_source || product.price_source || 'external';
    const finalOriginalPrice = original_price !== undefined ? parseFloat(original_price) : (product.original_price !== null ? parseFloat(product.original_price) : parseFloat(price));

    if (finalPriceSource === 'external') {
      finalPrice = markup > 0 ? finalOriginalPrice * (1 + markup / 100) : finalOriginalPrice;
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
          price_source = $16,
          details_source = $17,
          original_price = $18,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
    `, [
      title,
      parseFloat(finalPrice.toFixed(2)),
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
      finalPriceSource,
      details_source || 'external',
      finalOriginalPrice,
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

// Bulk products operations handled above

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
    let query = `DELETE FROM marketing_campaigns WHERE id IN (${placeholders})`;
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

    // Split-Payment Split Engine for external merchants
    if (brand.billing_type === 'external_split' || brand.billing_type === 'free') {
      const existingLedger = await getQuery('SELECT id FROM merchant_payout_ledger WHERE order_id = $1', [orderId]);
      if (!existingLedger) {
        const grossAmount = parseFloat(order.total) || 0;
        const takeRate = brand.billing_type === 'free' ? 0.00 : (brand.platform_take_rate !== null && brand.platform_take_rate !== undefined ? parseFloat(brand.platform_take_rate) : 0.15);
        const platformMargin = Math.round(grossAmount * takeRate * 100) / 100;
        const netAmount = grossAmount - platformMargin;

        await runQuery(`
          INSERT INTO merchant_payout_ledger (brand_id, order_id, amount, platform_margin, net_amount, type, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          brand.id,
          orderId,
          grossAmount,
          platformMargin,
          netAmount,
          'sale',
          `Split payment for order ${orderId} (${brand.name}). Platform take-rate: ${(takeRate * 100).toFixed(1)}%`
        ]);
        console.log(`[Split Engine] Logged ledger sale for brand ${brand.id}, order ${orderId}. Gross: €${grossAmount}, Platform margin: €${platformMargin}, Net: €${netAmount}`);
      }
    }

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
  const { brandId, title, price, image, description, sku, external_id, translations, original_link, price_source, details_source, original_price } = req.body;

  if (!brandId || !title || !price) {
    return res.status(400).json({ error: 'Brand ID, Title, and Price are required.' });
  }

  if (req.user.role === 'merchant' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Cannot import for other brands.' });
  }

  try {
    const translationsJson = translations ? (typeof translations === 'string' ? translations : JSON.stringify(translations)) : null;

    const brand = await getQuery('SELECT price_markup FROM brands WHERE id = $1', [brandId]);
    const markup = brand ? parseFloat(brand.price_markup) : 0;
    const basePrice = parseFloat(original_price !== undefined ? original_price : price);
    const finalPriceSource = price_source || 'external';
    const finalPrice = markup > 0 && finalPriceSource === 'external' ? basePrice * (1 + markup / 100) : basePrice;

    // Insert imported item into DB
    await runQuery(`
      INSERT INTO products (brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, translations, price_source, details_source, original_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      brandId,
      title,
      parseFloat(finalPrice.toFixed(2)),
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
      translationsJson,
      finalPriceSource,
      details_source || 'external',
      basePrice
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
    const brand = await getQuery('SELECT price_markup FROM brands WHERE id = $1', [brandId]);
    const markup = brand ? parseFloat(brand.price_markup) : 0;

    for (const p of products) {
      const featuresJson = Array.isArray(p.features) ? JSON.stringify(p.features) : p.features || '[]';
      const compatibilityJson = Array.isArray(p.compatibility) ? JSON.stringify(p.compatibility) : p.compatibility || '[]';
      const translationsJson = p.translations ? (typeof p.translations === 'string' ? p.translations : JSON.stringify(p.translations)) : null;
      const metaDetailsJson = p.meta_details ? (typeof p.meta_details === 'string' ? p.meta_details : JSON.stringify(p.meta_details)) : null;

      const basePrice = parseFloat(p.original_price !== undefined ? p.original_price : p.price || 55.00);
      const finalPriceSource = p.price_source || 'external';
      const finalPrice = markup > 0 && finalPriceSource === 'external' ? basePrice * (1 + markup / 100) : parseFloat(p.price || 55.00);

      await runQuery(`
        INSERT INTO products (brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility, sku, external_id, translations, meta_details, price_source, details_source, original_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        brandId,
        p.title,
        parseFloat(finalPrice.toFixed(2)),
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
        metaDetailsJson,
        finalPriceSource,
        p.details_source || 'external',
        basePrice
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

// SMTP Mailer Transporter Helper (Simulates delivery if SMTP environment is unconfigured)
async function sendMailHelper(to, subject, bodyHtml, bodyText) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'Strictly Coffee Platform <noreply@stricktlycoffee.be>';

  if (host && user && pass) {
    try {
      console.log(`[SMTP Mailer] Initializing SMTP connection to ${host}:${port}...`);
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // True for 465, false for other ports
        auth: { user, pass }
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: bodyText || bodyHtml.replace(/<[^>]*>/g, ''),
        html: bodyHtml
      });

      console.log(`[SMTP Mailer] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[SMTP Mailer] Failed to deliver email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[SMTP Mailer Simulator] SMTP unconfigured. Simulated delivery of email to ${to}:
    Subject: "${subject}"
    Body Preview: "${(bodyText || bodyHtml).substring(0, 100)}..."`);
    return { success: true, simulated: true };
  }
}

// Force send all pending emails now (Simulation Trigger)
app.post('/api/global/coupon-emails/send-pending', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context' });

  try {
    const pending = await allQuery('SELECT * FROM coupon_emails WHERE brand_id = $1 AND sent_at IS NULL AND scheduled_for <= NOW()', [brandId]);
    let count = 0;
    for (const email of pending) {
      const bodyHtml = `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #111111;">
          <h2>${email.email_subject}</h2>
          <div style="white-space: pre-wrap; margin-bottom: 20px;">${email.email_body}</div>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <p style="font-size: 0.8rem; color: #767676;">
            This email was sent on behalf of your coffee provider via the Stricktly Coffee Platform.
          </p>
        </div>
      `;
      await sendMailHelper(email.customer_email, email.email_subject, bodyHtml, email.email_body);
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
      const bodyHtml = `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #111111;">
          <h2>${email.email_subject}</h2>
          <div style="white-space: pre-wrap; margin-bottom: 20px;">${email.email_body}</div>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <p style="font-size: 0.8rem; color: #767676;">
            This email was sent on behalf of your coffee provider via the Stricktly Coffee Platform.
          </p>
        </div>
      `;
      await sendMailHelper(email.customer_email, email.email_subject, bodyHtml, email.email_body);
      await runQuery('UPDATE coupon_emails SET sent_at = CURRENT_TIMESTAMP WHERE id = $1', [email.id]);
      console.log(`[Referral System] Auto-delivered scheduled email ID ${email.id} to ${email.customer_email} with code ${email.coupon_code}`);
    }
  } catch (err) {
    console.error('[Scheduler] Error in background coupon email scheduler:', err);
  }
}, 30000); // Check every 30 seconds

// Subscription/fee billing engine
async function processDueSubscriptions() {
  try {
    // Find all active subscriptions that are due for billing (next_charge_at <= NOW())
    const dueSubscriptions = await allQuery(`
      SELECT s.*, b.name as brand_name, b.subscription_billing_method, b.stripe_customer_id
      FROM merchant_subscriptions s
      JOIN brands b ON s.brand_id = b.id
      WHERE s.status = 'active' AND (s.next_charge_at IS NULL OR s.next_charge_at <= NOW())
    `);

    for (const sub of dueSubscriptions) {
      const amount = parseFloat(sub.amount) || 0;
      let cardChargeSuccess = false;
      let chargeDescription = `Charged active subscription fee for: ${sub.name}`;
      let netBalanceEffect = -amount; // default: reduces ledger balance

      // If they configured Stripe card billing and have a linked customer ID
      if (sub.subscription_billing_method === 'stripe_card' && sub.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
        try {
          console.log(`[Subscription Engine] Attempting off-session credit card payment for brand: ${sub.brand_id} (Customer: ${sub.stripe_customer_id})...`);
          const stripe = new stripeLib(process.env.STRIPE_SECRET_KEY);
          
          // Execute payment intent off-session using customer's default payment method
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'eur',
            customer: sub.stripe_customer_id,
            confirm: true,
            off_session: true,
            payment_method_types: ['card'],
            description: `Auto-renewal: subscription fee for ${sub.name}`
          });

          if (paymentIntent.status === 'succeeded') {
            cardChargeSuccess = true;
            netBalanceEffect = 0.00; // Payout balance remains unaffected since payment was direct
            chargeDescription = `Direct Card Payment Succeeded: subscription fee for ${sub.name}`;
            console.log(`[Subscription Engine] Stripe payment succeeded for brand ${sub.brand_id}. Intent: ${paymentIntent.id}`);
          }
        } catch (err) {
          // If direct card billing fails, log error and fall back to ledger deduction
          console.error(`[Subscription Engine] Card payment failed for brand ${sub.brand_id} (Falling back to ledger deduction):`, err.message);
          chargeDescription = `Card Payment Failed: subscription fee for ${sub.name} (debited from balance)`;
        }
      }
      
      // Create a ledger debit record for the subscription fee
      await runQuery(`
        INSERT INTO merchant_payout_ledger (brand_id, order_id, amount, platform_margin, net_amount, type, description)
        VALUES ($1, NULL, $2, $3, $4, $5, $6)
      `, [
        sub.brand_id,
        amount,
        amount, // Platform margin gets 100% of sub fee
        netBalanceEffect,
        'subscription_fee',
        chargeDescription
      ]);

      // Rollover pending tier/interval if any
      let finalName = sub.name;
      let finalAmount = amount;
      let finalInterval = sub.interval;
      
      if (sub.pending_tier) {
        finalName = `ai_subscription_${sub.pending_tier}`;
        finalInterval = sub.pending_interval || sub.interval;
        
        let subAmount = 49.00;
        if (sub.pending_tier === 'standard') subAmount = 49.00;
        else if (sub.pending_tier === 'professional') subAmount = 99.00;
        else if (sub.pending_tier === 'enterprise') subAmount = 199.00;
        
        if (finalInterval === 'yearly') {
          if (sub.pending_tier === 'standard') subAmount = 468.00;
          else if (sub.pending_tier === 'professional') subAmount = 948.00;
          else if (sub.pending_tier === 'enterprise') subAmount = 1908.00;
        }
        finalAmount = subAmount;
        
        await runQuery('UPDATE brands SET ai_tier = $1 WHERE id = $2', [sub.pending_tier, sub.brand_id]);
        console.log(`[Subscription Engine] Processed pending rollover tier change for brand ${sub.brand_id} to ${sub.pending_tier} (${finalInterval}: €${finalAmount})`);
      }

      // Calculate next charge time
      let nextCharge = new Date();
      if (finalInterval === 'weekly') {
        nextCharge.setDate(nextCharge.getDate() + 7);
      } else if (finalInterval === 'yearly') {
        nextCharge.setFullYear(nextCharge.getFullYear() + 1);
      } else {
        nextCharge.setMonth(nextCharge.getMonth() + 1);
      }

      await runQuery(`
        UPDATE merchant_subscriptions 
        SET name = $1, amount = $2, interval = $3, last_charged_at = CURRENT_TIMESTAMP, next_charge_at = $4, pending_tier = NULL, pending_interval = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [finalName, finalAmount, finalInterval, nextCharge, sub.id]);

      console.log(`[Subscription Engine] Charged brand ${sub.brand_id} subscription fee €${amount} for '${sub.name}'. Method: ${sub.subscription_billing_method || 'ledger'}. Next charge scheduled for ${nextCharge.toISOString()}`);
    }
  } catch (err) {
    console.error('[Subscription Engine] Error processing subscriptions:', err);
  }
}

// Background scheduler checking every 60 seconds
setInterval(processDueSubscriptions, 60000);

// GET Payout Ledger and calculated balance for a brand
app.get('/api/global/billing/ledger/:brandId', verifyAdminToken, async (req, res) => {
  const { brandId } = req.params;
  try {
    const brand = await getQuery('SELECT stripe_connect_account_id, subscription_billing_method, stripe_customer_id FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const ledger = await allQuery('SELECT * FROM merchant_payout_ledger WHERE brand_id = $1 ORDER BY created_at DESC', [brandId]);
    const balanceResult = await getQuery('SELECT SUM(net_amount) as balance FROM merchant_payout_ledger WHERE brand_id = $1', [brandId]);
    const currentBalance = parseFloat(balanceResult?.balance) || 0.00;

    let stripeConnectStatus = 'unlinked';
    if (brand.stripe_connect_account_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new stripeLib(process.env.STRIPE_SECRET_KEY);
        const acc = await stripe.accounts.retrieve(brand.stripe_connect_account_id);
        if (acc.details_submitted) {
          stripeConnectStatus = 'active';
        } else {
          stripeConnectStatus = 'incomplete';
        }
      } catch (err) {
        console.error(`[Stripe Connect Status Check] Brand ${brandId} retrieve error:`, err.message);
        stripeConnectStatus = 'error';
      }
    }

    let hasCardLinked = false;
    if (brand.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new stripeLib(process.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.retrieve(brand.stripe_customer_id);
        if (customer.invoice_settings && customer.invoice_settings.default_payment_method) {
          hasCardLinked = true;
        }
      } catch (err) {
        console.error(`[Stripe Customer Retrieve Error] Brand ${brandId}:`, err.message);
      }
    }
    
    res.json({
      brand_id: brandId,
      balance: currentBalance,
      ledger,
      stripe_connect_status: stripeConnectStatus,
      subscription_billing_method: brand.subscription_billing_method || 'ledger',
      stripe_customer_id: brand.stripe_customer_id || null,
      card_linked: hasCardLinked
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Public Storefront pageview tracking
app.post('/api/analytics/pageview', async (req, res) => {
  const { brandId, page, sessionId } = req.body;
  if (!brandId) return res.status(400).json({ error: 'Missing brandId parameter.' });
  try {
    await runQuery(
      'INSERT INTO storefront_traffic (brand_id, page_path, session_id) VALUES ($1, $2, $3)',
      [brandId, page || '/', sessionId || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(`[Analytics tracking error] Brand ${brandId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET Authenticated admin dashboard traffic stats query
app.get('/api/global/analytics/traffic', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  try {
    let query = `
      SELECT brand_id, COUNT(*) as pageviews, COUNT(DISTINCT session_id) as visitors
      FROM storefront_traffic
    `;
    let params = [];
    if (brandId && brandId !== 'all') {
      query += ` WHERE brand_id = $1`;
      params.push(brandId);
    }
    query += ` GROUP BY brand_id`;
    
    const rows = await allQuery(query, params);
    res.json({ success: true, traffic: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Manual Process of Due Subscriptions
app.post('/api/global/billing/process-subscriptions', verifyAdminToken, async (req, res) => {
  try {
    await processDueSubscriptions();
    res.json({ success: true, message: 'Processed due subscriptions.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Manual Payout logic (logging a payout to the ledger)
app.post('/api/global/billing/payout', verifyAdminToken, async (req, res) => {
  const { brandId, amount, description } = req.body;
  if (!brandId || !amount) {
    return res.status(400).json({ error: 'Missing brandId or amount' });
  }
  try {
    const payoutAmount = parseFloat(amount);
    
    // Check if the merchant has enough balance for payout
    const balanceResult = await getQuery('SELECT SUM(net_amount) as balance FROM merchant_payout_ledger WHERE brand_id = $1', [brandId]);
    const currentBalance = parseFloat(balanceResult?.balance) || 0.00;
    
    await runQuery(`
      INSERT INTO merchant_payout_ledger (brand_id, order_id, amount, platform_margin, net_amount, type, description)
      VALUES ($1, NULL, $2, 0.0, $3, $4, $5)
    `, [
      brandId,
      payoutAmount,
      -payoutAmount, // Reduces the ledger balance
      'payout',
      description || `Disbursement payout of €${payoutAmount.toFixed(2)}`
    ]);
    
    res.json({
      success: true,
      message: `Successfully processed payout of €${payoutAmount.toFixed(2)}. Remaining balance: €${(currentBalance - payoutAmount).toFixed(2)}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Manual Subscription creation or fee charge
app.post('/api/global/billing/subscriptions', verifyAdminToken, async (req, res) => {
  const { brandId, name, amount, interval } = req.body;
  if (!brandId || !name || !amount) {
    return res.status(400).json({ error: 'Missing brandId, name, or amount' });
  }
  try {
    const subAmount = parseFloat(amount);
    
    await runQuery(`
      INSERT INTO merchant_subscriptions (brand_id, name, amount, interval, status, next_charge_at)
      VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP)
    `, [brandId, name, subAmount, interval || 'monthly']);
    
    res.json({ success: true, message: `Subscription '${name}' created successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
      automation_rules: r.automation_rules ? (typeof r.automation_rules === 'string' ? JSON.parse(r.automation_rules) : r.automation_rules) : [],
      autopilot_guardrails: r.autopilot_guardrails ? (typeof r.autopilot_guardrails === 'string' ? JSON.parse(r.autopilot_guardrails) : r.autopilot_guardrails) : { max_budget_change_pct: 20, min_roas_floor: 1.8, max_spend_ceiling: 500 },
      ab_test_headlines: r.ab_test_headlines ? (typeof r.ab_test_headlines === 'string' ? JSON.parse(r.ab_test_headlines) : r.ab_test_headlines) : [],
      ab_test_descriptions: r.ab_test_descriptions ? (typeof r.ab_test_descriptions === 'string' ? JSON.parse(r.ab_test_descriptions) : r.ab_test_descriptions) : [],
      ab_test_links: r.ab_test_links ? (typeof r.ab_test_links === 'string' ? JSON.parse(r.ab_test_links) : r.ab_test_links) : [],
      ab_test_media_urls: r.ab_test_media_urls ? (typeof r.ab_test_media_urls === 'string' ? JSON.parse(r.ab_test_media_urls) : r.ab_test_media_urls) : []
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/global/marketing-campaigns', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  const {
    id, name, platform, budget, segmentation, languages, format, ad_copy, headline, media_url,
    carousel_cards, destination_type, landing_page_id, campaign_type, custom_url, translations,
    start_date, end_date, budget_type, bidding_strategy, target_roas, performance_history, status,
    automation_rules, autopilot_enabled, ai_cost, agent_mode, autopilot_guardrails,
    enable_ab_testing, ab_test_headlines, ab_test_descriptions, ab_test_links, ab_test_media_urls,
    warmup_days, warmup_budget_percent
  } = req.body;

  if (!name || !platform || !budget) {
    return res.status(400).json({ error: 'Missing required campaign fields: name, platform, budget.' });
  }

  const campaignId = id || `MC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const activeLangs = Array.isArray(languages) ? languages.join(',') : String(languages || 'en');
  const resolvedStartDate = start_date || new Date().toISOString().split('T')[0];
  const resolvedEndDate = end_date || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const resolvedBudgetType = budget_type || 'lifetime';
  const resolvedAiCost = parseFloat(ai_cost || 0.0);

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
        automation_rules, autopilot_enabled, ai_cost, agent_mode, autopilot_guardrails,
        enable_ab_testing, ab_test_headlines, ab_test_descriptions, ab_test_links, ab_test_media_urls,
        warmup_days, warmup_budget_percent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
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
        autopilot_enabled = EXCLUDED.autopilot_enabled,
        ai_cost = EXCLUDED.ai_cost,
        agent_mode = EXCLUDED.agent_mode,
        autopilot_guardrails = EXCLUDED.autopilot_guardrails,
        enable_ab_testing = EXCLUDED.enable_ab_testing,
        ab_test_headlines = EXCLUDED.ab_test_headlines,
        ab_test_descriptions = EXCLUDED.ab_test_descriptions,
        ab_test_links = EXCLUDED.ab_test_links,
        ab_test_media_urls = EXCLUDED.ab_test_media_urls,
        warmup_days = EXCLUDED.warmup_days,
        warmup_budget_percent = EXCLUDED.warmup_budget_percent
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
      autopilot_enabled === true || autopilot_enabled === 'true',
      resolvedAiCost,
      agent_mode || 'recommendation',
      autopilot_guardrails ? (typeof autopilot_guardrails === 'string' ? autopilot_guardrails : JSON.stringify(autopilot_guardrails)) : JSON.stringify({ max_budget_change_pct: 20, min_roas_floor: 1.8, max_spend_ceiling: 500 }),
      enable_ab_testing === true || enable_ab_testing === 'true',
      ab_test_headlines ? (typeof ab_test_headlines === 'string' ? ab_test_headlines : JSON.stringify(ab_test_headlines)) : '[]',
      ab_test_descriptions ? (typeof ab_test_descriptions === 'string' ? ab_test_descriptions : JSON.stringify(ab_test_descriptions)) : '[]',
      ab_test_links ? (typeof ab_test_links === 'string' ? ab_test_links : JSON.stringify(ab_test_links)) : '[]',
      ab_test_media_urls ? (typeof ab_test_media_urls === 'string' ? ab_test_media_urls : JSON.stringify(ab_test_media_urls)) : '[]',
      parseInt(warmup_days || 3),
      parseInt(warmup_budget_percent || 15)
    ]);
    res.json({ success: true, campaignId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Campaign Agent Recommendations
app.get('/api/global/marketing-campaigns/:id/agent-recommendations', verifyAdminToken, async (req, res) => {
  const campaignId = req.params.id;
  try {
    const recommendations = await allQuery('SELECT * FROM campaign_agent_recommendations WHERE campaign_id = $1 ORDER BY created_at DESC', [campaignId]);
    res.json({ success: true, recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Apply Campaign Recommendation
app.post('/api/global/marketing-campaigns/:id/recommendations/:recId/apply', verifyAdminToken, async (req, res) => {
  const campaignId = req.params.id;
  const recId = req.params.recId;

  try {
    const rec = await getQuery('SELECT * FROM campaign_agent_recommendations WHERE id = $1 AND campaign_id = $2', [recId, campaignId]);
    if (!rec) {
      return res.status(404).json({ error: 'Recommendation not found.' });
    }
    if (rec.status !== 'pending') {
      return res.status(400).json({ error: `Recommendation is already ${rec.status}.` });
    }

    const campaign = await getQuery('SELECT budget, status FROM marketing_campaigns WHERE id = $1', [campaignId]);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    if (rec.action === 'pause') {
      await runQuery("UPDATE marketing_campaigns SET status = 'paused' WHERE id = $1", [campaignId]);
    } else if (rec.action === 'increase_budget') {
      const changePct = parseFloat(rec.action_value) || 0;
      const newBudget = parseFloat(campaign.budget) * (1 + changePct / 100);
      await runQuery("UPDATE marketing_campaigns SET budget = $1 WHERE id = $2", [parseFloat(newBudget.toFixed(2)), campaignId]);
    } else if (rec.action === 'reduce_budget') {
      const changePct = parseFloat(rec.action_value) || 0;
      const newBudget = parseFloat(campaign.budget) * (1 - changePct / 100);
      await runQuery("UPDATE marketing_campaigns SET budget = $1 WHERE id = $2", [parseFloat(newBudget.toFixed(2)), campaignId]);
    }

    await runQuery("UPDATE campaign_agent_recommendations SET status = 'applied', applied_at = CURRENT_TIMESTAMP WHERE id = $1", [recId]);
    addAuditLog("Campaign Recommendation Applied", "success", `Applied recommendation ID ${recId} to campaign ${campaignId}.`);

    res.json({ success: true, message: 'Recommendation applied successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Dismiss Campaign Recommendation
app.post('/api/global/marketing-campaigns/:id/recommendations/:recId/dismiss', verifyAdminToken, async (req, res) => {
  const campaignId = req.params.id;
  const recId = req.params.recId;

  try {
    await runQuery("UPDATE campaign_agent_recommendations SET status = 'dismissed' WHERE id = $1 AND campaign_id = $2", [recId, campaignId]);
    res.json({ success: true, message: 'Recommendation dismissed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Trigger AI Campaign Agent Run
app.post('/api/global/marketing-campaigns/trigger-agent-run', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  try {
    await runAutopilotAgentAnalysis(brandId);
    res.json({ success: true, message: 'AI Campaign Strategist run completed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function runAutopilotAgentAnalysis(brandId) {
  console.log(`[AI Chief Coordinator] Starting campaign analysis for brand: ${brandId}...`);
  const campaigns = await allQuery("SELECT * FROM marketing_campaigns WHERE brand_id = $1 AND status = 'active'", [brandId]);
  const brand = await getQuery("SELECT contact_email FROM brands WHERE id = $1", [brandId]);
  const emailTo = brand?.contact_email || 'merchant@stricktlycoffee.be';

  for (const c of campaigns) {
    const rules = c.automation_rules ? (typeof c.automation_rules === 'string' ? JSON.parse(c.automation_rules) : c.automation_rules) : [];
    if (!rules || rules.length === 0) continue;

    const history = c.performance_history ? (typeof c.performance_history === 'string' ? JSON.parse(c.performance_history) : c.performance_history) : [];
    if (!history || history.length === 0) continue;

    const latest = history[history.length - 1];
    if (!latest) continue;

    const currentROAS = parseFloat(latest.roas) || 0;
    const currentSpend = parseFloat(latest.spend) || 0;
    const currentConversions = parseInt(latest.conversions) || 0;

    const guardrails = c.autopilot_guardrails ? (typeof c.autopilot_guardrails === 'string' ? JSON.parse(c.autopilot_guardrails) : c.autopilot_guardrails) : { max_budget_change_pct: 20, min_roas_floor: 1.8, max_spend_ceiling: 500 };
    const maxBudgetChangePct = parseFloat(guardrails.max_budget_change_pct) || 20;
    const minRoasFloor = parseFloat(guardrails.min_roas_floor) || 1.8;
    const maxSpendCeiling = parseFloat(guardrails.max_spend_ceiling) || 500;

    const mode = c.agent_mode || 'recommendation';

    // 1. Safety Director Agent Evaluation
    let safetyAlert = false;
    let safetyReason = "";
    if (currentROAS < minRoasFloor) {
      safetyAlert = true;
      safetyReason = `ROAS (${currentROAS}x) fell below absolute safety floor (${minRoasFloor}x)`;
    }

    if (safetyAlert) {
      const triggerMsg = safetyReason;
      if (mode === 'autonomous') {
        await runQuery("UPDATE marketing_campaigns SET status = 'paused' WHERE id = $1", [c.id]);
        await runQuery(`
          INSERT INTO campaign_agent_recommendations (campaign_id, metric, operator, trigger_value, current_value, action, action_value, status, agent_role, performance_impact)
          VALUES ($1, 'roas', 'lt', $2, $3, 'pause', NULL, 'auto_executed', 'safety_director', $4)
        `, [c.id, minRoasFloor, currentROAS, JSON.stringify({ budget_saved: currentSpend, roas_lift: 0.0 })]);
        addAuditLog("Campaign Safety Floor Autopilot Triggered", "success", `Safety Director paused campaign ${c.id}: ${triggerMsg}`);
        
        await sendMailHelper(
          emailTo,
          `⚠️ [AUTOPILOT] Campaign Paused: Safety Floor Breached`,
          `<div style="font-family: sans-serif; padding: 20px;">
             <h2>⚠️ Campaign Autopilot Action</h2>
             <p>Your campaign <strong>${c.name}</strong> was automatically paused because its ROAS (${currentROAS}x) fell below your minimum safety floor of ${minRoasFloor}x.</p>
           </div>`
        );
      } else {
        const existing = await getQuery("SELECT id FROM campaign_agent_recommendations WHERE campaign_id = $1 AND action = 'pause' AND status = 'pending'", [c.id]);
        if (!existing) {
          await runQuery(`
            INSERT INTO campaign_agent_recommendations (campaign_id, metric, operator, trigger_value, current_value, action, action_value, status, agent_role, performance_impact)
            VALUES ($1, 'roas', 'lt', $2, $3, 'pause', NULL, 'pending', 'safety_director', $4)
          `, [c.id, minRoasFloor, currentROAS, JSON.stringify({ budget_saved: currentSpend, roas_lift: 0.0 })]);
          
          await sendMailHelper(
            emailTo,
            `💡 [CO-PILOT] Recommendation: Pause Campaign`,
            `<div style="font-family: sans-serif; padding: 20px;">
               <h2>💡 Campaign Strategy Recommendation</h2>
               <p>We recommend pausing campaign <strong>${c.name}</strong> because its ROAS (${currentROAS}x) fell below your safety floor of ${minRoasFloor}x. Tap in your dashboard to apply this.</p>
             </div>`
          );
        }
      }
      continue;
    }

    // 2. Specialized Agent Suggestion Loop
    const suggestions = [];

    for (const rule of rules) {
      let isTriggered = false;
      let curVal = 0;

      if (rule.metric === 'roas') {
        curVal = currentROAS;
        isTriggered = rule.operator === 'lt' ? (currentROAS < rule.value) : (currentROAS > rule.value);
      } else if (rule.metric === 'spend') {
        curVal = currentSpend;
        isTriggered = rule.operator === 'lt' ? (currentSpend < rule.value) : (currentSpend > rule.value);
      } else if (rule.metric === 'conversions') {
        curVal = currentConversions;
        isTriggered = rule.operator === 'lt' ? (currentConversions < rule.value) : (currentConversions > rule.value);
      }

      if (isTriggered) {
        let agentRole = 'budget_allocator';
        if (rule.metric === 'conversions') {
          agentRole = 'creative_critic';
        }

        suggestions.push({ rule, curVal, agentRole });
      }
    }

    // 3. Chief Coordinator Consensus & Conflict Resolution Loop
    for (const sugg of suggestions) {
      const { rule, curVal, agentRole } = sugg;
      let actionVal = parseFloat(rule.action_value) || 0;
      let isBlocked = false;
      let resolutionReason = "";

      if (rule.action === 'increase_budget' && currentROAS < (minRoasFloor * 1.25)) {
        isBlocked = true;
        resolutionReason = `Budget Allocator suggested scaling spend, but Safety Director blocked it because current ROAS (${currentROAS}x) is close to safety floor (${minRoasFloor}x)`;
      }

      if (isBlocked) {
        console.log(`[AI Chief Coordinator] Conflict Resolved: Blocked scaling because ROAS is near floor.`);
        await runQuery(`
          INSERT INTO agent_conflict_logs (campaign_id, conflicting_agents, conflict_description, resolution)
          VALUES ($1, 'budget_allocator & safety_director', $2, 'blocked_budget_increase')
        `, [c.id, resolutionReason]);
        continue;
      }

      if (rule.action !== 'pause' && actionVal > maxBudgetChangePct) {
        actionVal = maxBudgetChangePct;
      }

      const mockImpact = {
        roas_lift: rule.action === 'increase_budget' ? 0.35 : 0.15,
        budget_saved: rule.action === 'reduce_budget' ? currentSpend * (actionVal / 100) : 0.0
      };

      if (mode === 'autonomous') {
        let updatedBudget = parseFloat(c.budget);
        if (rule.action === 'pause') {
          await runQuery("UPDATE marketing_campaigns SET status = 'paused' WHERE id = $1", [c.id]);
        } else if (rule.action === 'increase_budget') {
          updatedBudget = Math.min(updatedBudget * (1 + actionVal / 100), maxSpendCeiling);
          await runQuery("UPDATE marketing_campaigns SET budget = $1 WHERE id = $2", [parseFloat(updatedBudget.toFixed(2)), c.id]);
        } else if (rule.action === 'reduce_budget') {
          updatedBudget = updatedBudget * (1 - actionVal / 100);
          await runQuery("UPDATE marketing_campaigns SET budget = $1 WHERE id = $2", [parseFloat(updatedBudget.toFixed(2)), c.id]);
        }

        await runQuery(`
          INSERT INTO campaign_agent_recommendations (campaign_id, metric, operator, trigger_value, current_value, action, action_value, status, agent_role, performance_impact)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'auto_executed', $8, $9)
        `, [c.id, rule.metric, rule.operator, rule.value, curVal, rule.action, actionVal, agentRole, JSON.stringify(mockImpact)]);

        addAuditLog("Campaign Autopilot Rule Executed", "success", `Autopilot executed ${rule.action} (${actionVal}%) on campaign ${c.id}`);

        await sendMailHelper(
          emailTo,
          `⚡ [AUTOPILOT] Campaign Updated: Rule Triggered`,
          `<div style="font-family: sans-serif; padding: 20px;">
             <h2>⚡ Campaign Autopilot Action Executed</h2>
             <p>Your campaign <strong>${c.name}</strong> was automatically optimized.</p>
             <ul>
               <li><strong>Trigger:</strong> ${rule.metric.toUpperCase()} is ${rule.operator === 'lt' ? 'less than' : 'greater than'} ${rule.value} (Current: ${curVal})</li>
               <li><strong>Action:</strong> ${rule.action === 'pause' ? 'Paused Campaign' : 'Updated Budget to €' + updatedBudget.toFixed(2)}</li>
             </ul>
           </div>`
        );
      } else {
        const existing = await getQuery(`
          SELECT id FROM campaign_agent_recommendations 
          WHERE campaign_id = $1 AND metric = $2 AND action = $3 AND status = 'pending'
        `, [c.id, rule.metric, rule.action]);

        if (!existing) {
          await runQuery(`
            INSERT INTO campaign_agent_recommendations (campaign_id, metric, operator, trigger_value, current_value, action, action_value, status, agent_role, performance_impact)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)
          `, [c.id, rule.metric, rule.operator, rule.value, curVal, rule.action, actionVal, agentRole, JSON.stringify(mockImpact)]);

          await sendMailHelper(
            emailTo,
            `💡 [CO-PILOT] New Performance Suggestion`,
            `<div style="font-family: sans-serif; padding: 20px;">
               <h2>💡 Campaign Strategy Recommendation</h2>
               <p>An optimization suggestion is ready for campaign <strong>${c.name}</strong>:</p>
               <ul>
                 <li><strong>Condition:</strong> ${rule.metric.toUpperCase()} is ${rule.operator === 'lt' ? 'less than' : 'greater than'} ${rule.value} (Current: ${curVal})</li>
                 <li><strong>Recommended Action:</strong> ${rule.action === 'pause' ? 'Pause Campaign' : 'Adjust budget by ' + actionVal + '%'}</li>
               </ul>
               <p>Tap in your dashboard to approve and apply this suggestion.</p>
             </div>`
          );
        }
      }
    }
  }
}

// GET Campaign Agent Performance Insights
app.get('/api/global/marketing-campaigns/agent-performance-insights', verifyAdminToken, async (req, res) => {
  const brandId = resolveBrandId(req);
  if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });

  try {
    const recs = await allQuery(`
      SELECT r.* FROM campaign_agent_recommendations r
      JOIN marketing_campaigns c ON r.campaign_id = c.id
      WHERE c.brand_id = $1
    `, [brandId]);

    const totalDecisions = recs.length;
    const approvedDecisions = recs.filter(r => r.status === 'applied').length;
    const autoExecuted = recs.filter(r => r.status === 'auto_executed').length;
    const dismissedDecisions = recs.filter(r => r.status === 'dismissed').length;

    const alignmentRate = totalDecisions > 0 
      ? Math.round(((approvedDecisions + autoExecuted) / (totalDecisions - dismissedDecisions || 1)) * 100) 
      : 100;

    let totalBudgetSaved = 0;
    let totalRoasLift = 0;
    let liftCount = 0;

    recs.forEach(r => {
      if (r.status === 'applied' || r.status === 'auto_executed') {
        try {
          const impact = r.performance_impact ? JSON.parse(r.performance_impact) : null;
          if (impact) {
            totalBudgetSaved += parseFloat(impact.budget_saved) || 0;
            if (impact.roas_lift) {
              totalRoasLift += parseFloat(impact.roas_lift);
              liftCount++;
            }
          }
        } catch(e) {
          // Ignore parse errors
        }
      }
    });

    const averageRoasLift = liftCount > 0 ? parseFloat((totalRoasLift / liftCount).toFixed(2)) : 0.0;

    res.json({
      success: true,
      totalDecisions,
      approvedDecisions,
      autoExecuted,
      dismissedDecisions,
      alignmentRate: Math.min(alignmentRate, 100),
      totalBudgetSaved: parseFloat(totalBudgetSaved.toFixed(2)),
      averageRoasLift
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Campaign Agent Conflict Logs
app.get('/api/global/marketing-campaigns/:id/agent-conflict-logs', verifyAdminToken, async (req, res) => {
  const campaignId = req.params.id;
  try {
    const logs = await allQuery('SELECT * FROM agent_conflict_logs WHERE campaign_id = $1 ORDER BY created_at DESC', [campaignId]);
    res.json({ success: true, logs });
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

// GET AI Tier features list
app.get('/api/global/ai-tier-features', verifyAdminToken, async (req, res) => {
  try {
    const rows = await allQuery('SELECT * FROM ai_tier_features ORDER BY tier ASC');
    res.json({ success: true, features: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST AI Tier features configuration overrides (Superadmin only)
app.post('/api/global/ai-tier-features', verifyAdminToken, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Superadmin permission required.' });
  }
  const { config } = req.body;
  if (!Array.isArray(config)) {
    return res.status(400).json({ error: 'Invalid payload: config array required.' });
  }
  try {
    for (const item of config) {
      await runQuery(`
        UPDATE ai_tier_features 
        SET allow_manuscript = $1, 
            allow_copywriter = $2, 
            allow_translator = $3, 
            allow_seo = $4, 
            allow_designer = $5, 
            allow_page_builder = $6, 
            allow_dynamic_optimization = $7 
        WHERE tier = $8
      `, [
        item.allow_manuscript,
        item.allow_copywriter,
        item.allow_translator,
        item.allow_seo,
        item.allow_designer,
        item.allow_page_builder,
        item.allow_dynamic_optimization,
        item.tier
      ]);
    }
    res.json({ success: true, message: 'Tier features configuration updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Toggle dynamic optimization for a campaign
app.post('/api/global/marketing-campaigns/:id/toggle-dynamic-optimization', verifyAdminToken, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { enabled } = req.body;
    
    let query = `UPDATE marketing_campaigns SET dynamic_optimization_enabled = $1 WHERE id = $2`;
    let params = [enabled === true, campaignId];
    
    if (req.user.role === 'merchant') {
      const campaign = await getQuery('SELECT brand_id FROM marketing_campaigns WHERE id = $1', [campaignId]);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      if (campaign.brand_id !== req.user.brand_id) {
        return res.status(403).json({ error: 'Permission denied. Unauthorized brand operator.' });
      }
    }
    
    await runQuery(query, params);
    res.json({ success: true, campaignId, enabled: enabled === true });
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
    const { productId, segmentation, tone, creativeDirection, campaignType } = req.body;
    const brandId = resolveBrandId(req);
    if (!brandId) return res.status(400).json({ error: 'No brand context resolved.' });
    
    await checkAiLimits(brandId);
    
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
        const brand = await getQuery('SELECT name, marketing_protocol, ai_tier FROM brands WHERE id = $1', [brandId]);
        if (brand && brand.marketing_protocol) {
          let targetModel = getTargetModel(brand ? brand.ai_tier : 'professional');

          const prompt = `You are a premium e-commerce copywriter. Refer to this Brand Performance Marketing Protocol / Playbook:
${brand.marketing_protocol}

Write a high-converting performance marketing ad copy (headline, primary ad body copy, and 3 key benefits) for the product "${prodName}" (Price: ${prodPrice}).
Target Segmentation: ${segmentation}
Tone: ${tone}
Creative Direction / Copywriting Angle: Focus heavily on the "${creativeDirection || 'General'}" copywriting direction/angle from Section 4 of the playbook (e.g. Emotional / Aesthetic vs Logical / Data & Science vs Utility / Workflow & Durability).
Campaign Type: ${campaignType || 'conversion'}

Return ONLY a JSON object in this format:
{
  "headline": "A short, catchy, action-oriented headline.",
  "ad_copy": "A high-converting ad body text containing the value proposition, targeted hooks, and CTA.",
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"]
}`;

          console.log(`[AI Copywriter Studio] Generating custom ad copy for brand: ${brandId} using model: ${targetModel}`);
          const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
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
            
            let costUsd = 0.0;
            if (result.usageMetadata && brandId) {
              const promptTokens = result.usageMetadata.promptTokenCount || 0;
              const completionTokens = result.usageMetadata.candidatesTokenCount || 0;
              costUsd = estimateGeminiCost(targetModel, promptTokens, completionTokens);
              await logAiUsage(brandId, 'Campaign Ad Copy Generation', targetModel, result.usageMetadata);
            }

            if (parsed.headline && parsed.ad_copy) {
              return res.json({
                headline: parsed.headline,
                ad_copy: parsed.ad_copy,
                benefits: parsed.benefits || [],
                estimated_cost: costUsd
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
