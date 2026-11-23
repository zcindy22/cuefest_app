#!/usr/bin/env node
/**
 * scripts/granite_tips.mjs
 *
 * Calls an IBM Granite model on watsonx.ai to turn public festival guidance
 * (assets/festival-guidance.txt) into short attendee tips, then writes them to
 * assets/granite-tips.json. The app seeds those tips into its local SQLite
 * database, so the app itself still runs offline with no API keys.
 *
 * Data handling: input is public coverage only. No personal data, no client
 * data, no social media data. Output is validated before it is saved.
 *
 * Usage (keys stay on your machine, in a gitignored .env.local file):
 *   .env.local contains:
 *     WATSONX_APIKEY=...             IBM Cloud API key (never commit it)
 *     WATSONX_PROJECT_ID=...         watsonx.ai project id
 *     WATSONX_URL=https://us-south.ml.cloud.ibm.com   optional, region url
 *     WATSONX_MODEL=ibm/granite-4-h-small             optional
 *   node --env-file=.env.local scripts/granite_tips.mjs
 *
 * Flags:
 *   --dry    print the request that would be sent, make no network call
 *   --mock   skip the network and use a canned reply to test parsing and saving
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = join(root, 'assets', 'festival-guidance.txt');
const OUTPUT = process.env.OUT || join(root, 'assets', 'granite-tips.json');

const URL_BASE = (process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com').replace(/\/$/, '');
const MODEL = process.env.WATSONX_MODEL || 'ibm/granite-4-h-small';
const API_VERSION = '2025-10-25';
const DRY = process.argv.includes('--dry');
const MOCK = process.argv.includes('--mock');

const guidance = readFileSync(INPUT, 'utf8');

const messages = [
  {
    role: 'system',
    content:
      'You write short, friendly tips for first time festival goers. Use only the guidance you are given. ' +
      'Do not invent facts, numbers, names or quotes. Reply with JSON only.',
  },
  {
    role: 'user',
    content:
      'Turn the guidance below into exactly 3 attendee tips. Each tip must be one sentence under 140 characters, ' +
      'practical, and about what to bring, wear or plan. Give each tip 2 hashtags.\n' +
      'Reply with only a JSON array like [{"tip": "...", "tags": "#one #two"}].\n\nGUIDANCE:\n' + guidance,
  },
];

const body = {
  model_id: MODEL,
  project_id: process.env.WATSONX_PROJECT_ID || '<WATSONX_PROJECT_ID>',
  messages,
  max_completion_tokens: 800,
  temperature: 0,
};

function parseTips(content) {
  const cleaned = content.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found in model reply');
  const arr = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(arr)) throw new Error('Model reply is not an array');
  const tips = arr.map((t) => ({
    tip: String(t.tip || '').trim(),
    tags: String(t.tags || '').trim(),
  }));
  // Validation: keep the output safe and consistent before it reaches the app.
  for (const t of tips) {
    if (!t.tip) throw new Error('Empty tip in model reply');
    if (t.tip.length > 160) throw new Error('Tip too long: ' + t.tip);
    const tags = t.tags.split(/\s+/).filter(Boolean);
    if (tags.length < 1 || !tags.every((x) => /^#[A-Za-z0-9]+$/.test(x))) {
      throw new Error('Bad hashtags: ' + t.tags);
    }
  }
  if (tips.length < 3 || tips.length > 8) throw new Error('Unexpected tip count: ' + tips.length);
  return tips;
}

async function getToken() {
  const res = await fetch('https://iam.cloud.ibm.com/oidc/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: process.env.WATSONX_APIKEY,
    }),
  });
  if (!res.ok) throw new Error('IAM token request failed: ' + res.status + ' ' + (await res.text()));
  return (await res.json()).access_token;
}

async function main() {
  if (DRY) {
    console.log('POST', `${URL_BASE}/ml/v1/text/chat?version=${API_VERSION}`);
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  let content;
  if (MOCK) {
    content = '```json\n[{"tip":"Arrive early and use a digital pass if offered.","tags":"#wristband #lines"},' +
      '{"tip":"Pack a rain jacket or poncho and expect weather pauses.","tags":"#rain #weather"},' +
      '{"tip":"Leave extra time to get through a busy main entrance.","tags":"#entrance #lines"},' +
      '{"tip":"Pick a meetup spot with your group before the crowds build.","tags":"#crowds #meetup"},' +
      '{"tip":"No in and out re-entry, so bring what you need before going in.","tags":"#entrance #rules"}]\n```';
  } else {
    for (const k of ['WATSONX_APIKEY', 'WATSONX_PROJECT_ID']) {
      if (!process.env[k]) throw new Error(`Set ${k} first (see the usage notes at the top of this file).`);
    }
    const token = await getToken();
    const res = await fetch(`${URL_BASE}/ml/v1/text/chat?version=${API_VERSION}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('watsonx.ai request failed: ' + res.status + ' ' + (await res.text()));
    const data = await res.json();
    content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in watsonx.ai reply: ' + JSON.stringify(data).slice(0, 400));
    console.log('Model:', data.model_id || MODEL, '| tokens:', JSON.stringify(data.usage || {}));
  }

  const tips = parseTips(content);
  const out = {
    model: MOCK ? 'mock' : MODEL,
    platform: 'IBM watsonx.ai',
    generated_at: new Date().toISOString(),
    input: 'assets/festival-guidance.txt (public coverage only)',
    reviewed_by_human: false,
    tips,
  };
  writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`Saved ${tips.length} tips to ${OUTPUT}`);
  tips.forEach((t, i) => console.log(`${i + 1}. ${t.tip}  ${t.tags}`));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
