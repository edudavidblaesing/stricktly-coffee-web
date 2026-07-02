import { getQuery, runQuery } from './db.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../.env' });

async function callAiModelWithUsage(model, prompt, isJson = false) {
  const apiKey = process.env.GEMINI_API_KEY_GENERAL || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
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
  return { text };
}

function parseRobustJson(text) {
  if (!text) return null;
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.substring(7);
  }
  if (clean.endsWith('```')) {
    clean = clean.substring(0, clean.length - 3);
  }
  clean = clean.trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error('Failed to parse robust JSON directly:', e.message);
    return null;
  }
}

async function run() {
  const brandId = 'pesado585';
  try {
    console.log(`[Recovery] Loading marketing protocol for brand ${brandId}...`);
    const brand = await getQuery('SELECT marketing_protocol, brand_canvas FROM brands WHERE id = $1', [brandId]);
    if (!brand || !brand.marketing_protocol) {
      console.error('Brand or marketing protocol not found.');
      process.exit(1);
    }

    let existingCanvas = {};
    if (brand.brand_canvas) {
      try {
        existingCanvas = JSON.parse(brand.brand_canvas);
      } catch (e) {}
    }

    const prompt = `You are a professional brand strategy orchestrator. Review this Brand Strategy Manuscript:
${brand.marketing_protocol}

Distill and map the playbook into a structured JSON object representing the brand's creative guidelines.

IMPORTANT FORMATTING RULES:
- Do NOT output any LaTeX math notation (e.g. formulas with backslashes like \\frac or \\Delta). Write equations in plain text (e.g. Q = -k * A * deltaP / (u * L)).
- Avoid using backslashes (\\) anywhere in your string values.
- If you use quotes inside a JSON string value, you MUST use single quotes instead of unescaped double quotes to prevent parsing errors.
- The output must be valid, well-formed JSON. Return ONLY the raw JSON object.

Return ONLY a JSON object in this format:
{
  "brand_voice": "Brief summary of tone & voice rules (1-2 paragraphs)",
  "product_architecture": "Brief summary of technical positioning and physical engineering narrative (1-2 paragraphs)",
  "controlled_vocabulary": {
    "approved": ["Precision extraction", "uniform saturation"],
    "banned": ["game-changer", "revolutionary"]
  },
  "personas": [
    {
      "name": "Persona Name",
      "demographics": "Demographics description",
      "description": "Core psychological values and motivations",
      "hooks": ["Targeted campaign hook/copy brief"],
      "age": "e.g. 25-35",
      "role": "A role/hobby",
      "expression": "e.g. welcoming smile, focused",
      "apparel": "e.g. casual linen shirt, tailored workwear"
    }
  ],
  "sceneries": [
    {
      "name": "Scenery Setting Name",
      "description": "Photographic scene backdrop description matching this brand's world",
      "lighting": "e.g. natural soft side light",
      "environment_style": "e.g. modern concrete countertop",
      "photography_style": "e.g. 35mm film style"
    }
  ],
  "scenes": [],
  "objects": [],
  "visual_direction": "Brief summary of Midjourney photography cues and styling rules (1-2 paragraphs)"
}`;

    console.log('[Recovery] Querying Gemini model gemini-3.1-pro...');
    const result = await callAiModelWithUsage('gemini-3.1-pro', prompt, true);
    const canvasData = parseRobustJson(result.text);

    if (!canvasData) {
      console.error('[Recovery] Gemini returned invalid JSON.');
      process.exit(1);
    }

    console.log('[Recovery] Successfully distilled canvas. Merging with existing canvas (to preserve generated images/personas)...');
    
    // Preserve custom variants, images, and seeds from the existing canvas
    const mergedCanvas = {
      ...existingCanvas,
      ...canvasData,
      controlled_vocabulary: {
        approved: canvasData.controlled_vocabulary?.approved || [],
        banned: canvasData.controlled_vocabulary?.banned || []
      }
    };

    if (existingCanvas.personas && existingCanvas.personas.length > 0) {
      // Map back generated images/seeds to matching persona names
      mergedCanvas.personas = canvasData.personas.map(p => {
        const match = existingCanvas.personas.find(ep => ep.name === p.name || ep.role === p.role);
        if (match) {
          return { ...p, image: match.image, seed: match.seed, variants: match.variants };
        }
        return p;
      });
    }

    if (existingCanvas.sceneries && existingCanvas.sceneries.length > 0) {
      // Map back generated images/seeds to matching sceneries
      mergedCanvas.sceneries = canvasData.sceneries.map(s => {
        const match = existingCanvas.sceneries.find(es => es.name === s.name);
        if (match) {
          return { ...s, image: match.image, seed: match.seed, variants: match.variants };
        }
        return s;
      });
    }

    console.log('[Recovery] Writing canvas back to DB...');
    await runQuery('UPDATE brands SET brand_canvas = $1 WHERE id = $2', [JSON.stringify(mergedCanvas), brandId]);
    console.log('[Recovery] Canvas recovery complete!');
    process.exit(0);
  } catch (err) {
    console.error('[Recovery Failed]', err);
    process.exit(1);
  }
}

run();
