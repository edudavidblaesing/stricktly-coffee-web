import { getQuery, allQuery } from './db.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../.env' });

async function callAiModelWithUsage(model, prompt, isJson = false) {
  const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
  let geminiModel = model;
  if (geminiModel === 'gemini-3.1-pro') {
    geminiModel = 'gemini-3.1-pro-preview';
  } else if (geminiModel === 'deep-research-pro-preview') {
    geminiModel = 'deep-research-pro-preview-12-2025';
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: isJson ? { response_mime_type: 'application/json' } : undefined
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${errText}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    text: text,
    usage: {
      promptTokenCount: data.usageMetadata?.promptTokenCount || 0,
      candidatesTokenCount: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokenCount: data.usageMetadata?.totalTokenCount || 0
    }
  };
}

// Replicate extractCleanText from index.js
function extractCleanText(html) {
  if (!html) return '';
  let text = html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

async function main() {
  try {
    const brandId = 'pesado585';
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    const products = await allQuery('SELECT title, description, price FROM products WHERE brand_id = $1 LIMIT 20', [brandId]);
    const catalogContext = products.map(p => `- ${p.title} (€${parseFloat(p.price).toFixed(2)}): ${p.description || ''}`).join('\n');
    
    // Simulate home page scraping or retrieve it
    let targetUrl = brand.shopify_shop_name || brand.woocommerce_shop_url || brand.subdomain;
    if (targetUrl && !targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }
    
    let homepageText = 'No website crawled.';
    if (targetUrl) {
      try {
        console.log(`Scraping brand site: ${targetUrl}`);
        const pageRes = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (pageRes.ok) {
          const html = await pageRes.text();
          homepageText = extractCleanText(html);
        }
      } catch (err) {
        console.warn(`Failed to crawl primary URL: ${targetUrl}`, err.message);
      }
    }

    const prompt = `You are an elite, premium DTC Performance Marketing Director and Brand Strategist specializing in luxury espresso hardware, precision barista equipment, and architectural home assets.
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
		- 5 Approved terms and why to use them
		- 5 Banned terms and why to avoid them
SECTION 4: Performance Ads Copywriting Framework
Provide 3 completely written, high-converting ad copy sets. Each copy set must include:
	1.	Headline (1 line)
	2.	Primary Text (ad copy body)
	3.	Hook style (e.g., Logical/Engineering vs. Aesthetic/Interiors)
SECTION 5: Video & Image Creative Briefs (AI Generation Ready)
Provide:
	1.	Vertical Video Scripts (TikTok/Reels - 9:16): Provide 2 highly detailed, multi-scene video scripts. Each must include time stamps, specific visual directions, text overlays, and audio/ASMR cues (e.g., the physical click of a calibrated tamper or metal locking).
	2.	Text-to-Image Prompts (Midjourney/DALL-E style): Provide 3 highly descriptive, photorealistic text prompts for product photography. Structure them with Scene, Subject, Motion, Camera Angle/Lens, and Atmosphere/Lighting (e.g., "Premium product shot of [Product Name] on a marble countertop, warm side lighting, shallow depth of field, 85mm lens, high-end architectural digest aesthetic").
SECTION 6: High-Converting Email Flows
Provide raw, copy-pasteable email copy for:
	1.	Onboarding / Welcome Sequence (3 Steps): Step 1: Brand ethos and precision. Step 2: The physical science behind a key product feature. Step 3: Elite collaboration or design standards. Include subject lines, preheaders, and button CTA text.
	2.	Cart Abandonment Sequence (3 Steps): Step 1: Resolving performance hesitation. Step 2: Technical sizing and machine compatibility checklist. Step 3: Upgrading setup visual styling.
SECTION 7: Landing Page Visual Architecture
Provide a step-by-step structural blueprint for a high-converting landing page. Map out the exact visual containers, value statements, functional modules (e.g., an interactive compatibility sizing engine), and social proof blocks required to maximize conversion rates.
[EXECUTION RULE]
Output the complete Markdown document directly. Write all ad copy and email templates in ready-to-use, professional English. Do not explain your process or write conversational filler. Start directly with the first section header.`;

    const model = 'gemini-3.1-pro';
    console.log('Sending full prompt to Gemini...');
    const result = await callAiModelWithUsage(model, prompt);
    console.log('Result usage:', JSON.stringify(result.usage, null, 2));
    console.log('Result text length:', result.text.length);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
