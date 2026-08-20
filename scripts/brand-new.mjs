#!/usr/bin/env node
/**
 * Scaffold a new client brand-guidelines microsite.
 *
 *   npm run brand:new -- themagpiestale "The Magpie's Tale"
 *
 * Copies the blank template into `src/data/brands/<slug>.ts`, creates the
 * asset folder under `public/brand/<slug>/assets/`, and registers the client in
 * `src/data/brands/index.ts`. It never overwrites an existing client.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [slugArg, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(' ').trim();

if (!slugArg || !name) {
  console.error('Usage: npm run brand:new -- <slug> "<Client Name>"');
  process.exit(1);
}

const slug = slugArg.trim().toLowerCase();
// The slug becomes a subdomain label, so it has to survive DNS: letters,
// digits and hyphens only, and not starting or ending with a hyphen.
if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
  console.error(`Invalid slug "${slug}". Use lowercase letters, digits and hyphens only.`);
  process.exit(1);
}

const dataFile = path.join(root, 'src/data/brands', `${slug}.ts`);
const assetDir = path.join(root, 'public/brand', slug, 'assets');
const indexFile = path.join(root, 'src/data/brands/index.ts');
const templateFile = path.join(root, 'src/data/brands/_template.ts');

if (fs.existsSync(dataFile)) {
  console.error(`${path.relative(root, dataFile)} already exists — nothing changed.`);
  process.exit(1);
}

// Export names have to be valid JS identifiers; hyphens in slugs are not.
const exportName = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const template = fs.readFileSync(templateFile, 'utf8');
const today = new Date().toISOString().slice(0, 10);
const body = template
  .replace(/^import type \{ Brand \} from '\.\/types';/m, "import type { Brand } from './types';")
  .replace(/export const template: Brand = \{/, `export const ${exportName}: Brand = {`)
  .replace(/'CLIENT_SLUG\.oakfox\.co\.uk'/, `'${slug}.oakfox.co.uk'`)
  .replace(/slug: 'CLIENT_SLUG'/, `slug: '${slug}'`)
  .replace(/name: 'CLIENT NAME'/, `name: ${JSON.stringify(name)}`)
  .replace(/updated: 'YYYY-MM-DD'/, `updated: '${today}'`)
  .replace(/CLIENT_SLUG/g, slug)
  // Strip the template's own explanatory header — it describes copying, which
  // has now happened.
  .replace(/\/\*\*\n \* Blank client template[\s\S]*?\*\/\n/, `/**\n * ${name} — brand guidelines.\n */\n`);

fs.writeFileSync(dataFile, body);
fs.mkdirSync(path.join(assetDir, 'downloads'), { recursive: true });

// Register it. Both edits are idempotent-ish: we bail above if the file exists,
// so a double-run can't duplicate the entry.
let index = fs.readFileSync(indexFile, 'utf8');
index = index.replace(
  /(import type \{ Brand \} from '\.\/types';\n)/,
  `$1import { ${exportName} } from './${slug}';\n`
);
index = index.replace(
  /export const brands: Brand\[\] = \[([^\]]*)\];/,
  (_, current) => {
    const entries = current
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    entries.push(exportName);
    return `export const brands: Brand[] = [${entries.join(', ')}];`;
  }
);
fs.writeFileSync(indexFile, index);

console.log(`Created ${path.relative(root, dataFile)}`);
console.log(`Created ${path.relative(root, assetDir)}/`);
console.log(`Registered "${exportName}" in ${path.relative(root, indexFile)}`);
console.log('');
console.log('Next:');
console.log(`  1. Drop the logo files into public/brand/${slug}/assets/`);
console.log(`  2. Fill in src/data/brands/${slug}.ts`);
console.log(`  3. npm run dev  →  http://localhost:4321/brand/${slug}/`);
console.log(`  4. Create the ${slug}.oakfox.co.uk subdomain in cPanel — see docs/brand-guidelines.md`);
