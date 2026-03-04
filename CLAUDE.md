# CLAUDE.md

## Project Overview

Custom headless storefront for Unique Creations by Lisa C. (uniquecreationsbylisac.com).
Replaces the default Square Online template with a bespoke artisan aesthetic.
Lisa handcrafts chainmail and artisan jewelry. Products are custom-made to order by size and color.

---

## Architecture

### Frontend

- Single file: `index.html` (Tailwind CDN, Playfair Display + Lato fonts, Lucide icons, vanilla JS)
- No build step. No framework. Deployed as a static file on Netlify.
- Product data is fetched at runtime from the Netlify function `/api/square-inventory`.

### Backend

- Netlify Functions in `netlify/functions/`
- All functions use ES module syntax (`export default async (req, context) => {}`)
- Netlify CLI warns about "legacy CommonJS" - rename files to `.mjs` to resolve
- `/api/*` redirects to `/.netlify/functions/:splat` via `netlify.toml`

### Key functions

| File | Route | Purpose |
|------|-------|---------|
| `square-inventory.js` | `/api/square-inventory` | Fetches full paginated catalog |
| `debug-catalog.js` | `/api/debug-catalog` | Diagnostic breakdown of catalog objects |
| `get-square-config.js` | `/api/get-square-config` | Returns public Square app config |
| `payment_methods.js` | `/api/payment_methods` | Payment method handling |

---

## Square Integration

### Environment

- Sandbox credentials live in `.env` (gitignored, never committed)
- Production secrets are stored in Netlify cloud dashboard, injected at deploy time per branch
- `.env` is NOT pulled automatically unless logged in via `npx netlify-cli login` + `npx netlify-cli link`
- Netlify env var changes do NOT hot-reload. A redeploy is required to pick them up. Use Deploys -> Trigger deploy -> Deploy site (clear cache) after any env var update.

### .env format

```
SQUARE_ACCESS_TOKEN=EAAAlylG...
SQUARE_ENVIRONMENT=sandbox
SQUARE_APPLICATION_ID=sandbox-sq0idb-...
```

### Square MCP

A local Square MCP server is connected. Use it for all catalog operations directly from Claude.
Do not use the Square dashboard manually when the MCP is available.

Key MCP methods used:

- `catalog.list` - fetch all catalog objects
- `catalog.createImage` - upload image with `image_file` path (supports `object_id` to attach)
- `catalog.batchUpsertobjects` - create/update modifier lists, items, variations
- `catalog.updateItemModifierLists` - link or unlink modifier lists from items
- `catalog.getObject` - fetch a single object with full detail
- `inventory.getCount` - check stock count for a variation

### Sandbox catalog state

- Location ID: `L4KK3G9JY6RDY`
- 51 items, all type `ITEM` with `ITEM_VARIATION` children
- ITEM_OPTION `TD4NU4DHGO2YU7TXBAVH7FNA` = "Size" (used for both inch-based sizes and named color combos)
- MODIFIER_LIST `NCWYIJKYTBOQNFL6FUHTMIZM` = "Select your custom colors" (max 2 selections)
- Modifier list linked to: Byzantine Chainmail Bracelet, Half Persian 4-1 Bracelet, Full Persian Bracelet

### Ring color swatches (uploaded to sandbox)

| Color | Image ID |
|-------|----------|
| Blue | `3MRO2FVHR5MWFLEMOP2VK5N3` |
| Black | `2HWI3QGVV6RAYFMYHJ7YO6UB` |
| Gold | `3JDPJCV4F7I5FAZQZ7W3RZ3M` |
| Red | `L6N57IZYEJMJGY6M5A5ZU734` |
| Purple | `QFKPQH2S37BJSEXMR7QQCFFB` |

Source files saved at: `~/Downloads/ring_swatches/`

### Known sandbox data gaps

- 23 of 51 items have no description
- No categories created
- Inventory tracking not enabled on any variation (all `track_inventory: null`)
- Most products have no images yet
- Only 5 ring color swatches uploaded so far - more colors to come

---

## Color Selection Logic

Chainmail products are custom-made. Customers pick a size AND up to 2 ring colors.

- Variations containing `"inches"` = custom size order - show color modifier picker (required)
- Named variations (e.g. "Mardi Gras Love", "Green/Gold", "Feeling Peachy Blue") = pre-made stock - no color picker
- Modifier list drives the color UI via existing modifier rendering code in `index.html`
- Fallback hex color grid appears only if a product has no Square modifier list attached

The `isSizeVar` helper in `index.html`:

```javascript
const isSizeVar = v => /\d+\.?\d*\s*inch/i.test(v.item_variation_data.name);
const needsColorPicker = p => p.variations.some(isSizeVar);
```

---

## Dev Environment

### Local server

- Command: `npx netlify-cli dev`
- Port: `8888`
- Config: `.claude/launch.json` (both project root and worktree)
- Start via Claude preview: `preview_start("Netlify Dev")`

First run installs `netlify-cli` via npx (takes ~30 seconds). Subsequent runs are fast.

### Runtime

- Node.js v25.6.1
- npx v11.9.0
- netlify and deno are NOT globally installed - use npx for netlify

### Worktrees

Active development happens in worktrees under `.claude/worktrees/`.
The current active worktree is `festive-pasteur`.
Each worktree needs its own `.env` file since it is a separate directory.

---

## Branching Strategy

This project uses GitFlow.

### Branch model

| Branch | Purpose | Merges into |
|--------|---------|-------------|
| `main` | Production. Live site at uniquecreationsbylisac.com. | - |
| `develop` | Integration branch. All work lands here first. | `main` |
| `feature/*` | New features. | `develop` via PR |
| `bug/*` | Bug fixes. | `develop` via PR |
| `issue/*` | Issue-specific work (linked to GitHub issues). | `develop` via PR |

### Rules

- Never commit directly to `main`.
- Never commit directly to `develop` except for documentation and config changes.
- Branch from `develop`. Merge back to `develop` via pull request.
- `main` only receives merges from `develop` via PR (release promotion).
- Branch naming examples: `feature/color-picker`, `bug/cart-total-rounding`, `issue/42-missing-descriptions`.

### Workflow

```
1. git checkout develop && git pull origin develop
2. git checkout -b feature/my-feature
3. ... work ...
4. git push origin feature/my-feature
5. Open PR: feature/my-feature -> develop
6. Merge PR, delete branch
7. When ready to release: PR develop -> main
```

### Branch protection

- `main`: PR required, 1 review required, no direct pushes, no force push
- `develop`: PR required from `feature/*`, `bug/*`, or `issue/*` branches

---

## Deployment

- Hosted on Netlify (free tier)
- Auto-deploys from GitHub
- Publish directory: `/` (root)
- `main` branch = production
- `development` branch = staging
- Environment variables set per-branch in Netlify dashboard

---

## Project Preferences

- Diagnose before acting. Check the actual Square data before writing frontend code.
- Run operations in parallel where possible.
- Use the Square MCP for all catalog reads and writes.
- Keep `index.html` as a single file - no build tooling unless explicitly requested.
- The modifier list approach (Square data-driven) takes priority over hardcoded UI fallbacks.
- When uploading product images, confirm which item and variation they belong to first.

---

## Markdown Formatting Rules

### Headings

Use standard Markdown heading hierarchy. One `#` per file. Do not skip levels.

### Lists

Use `-` for unordered lists. Use `1.` for sequences or steps. Keep items short and parallel.

### Code blocks

Always use fenced code blocks with a language identifier (`bash`, `javascript`, `json`, `yaml`).

### Inline code

Use backticks for file names, commands, config keys, and environment variables.

### Typography

Avoid em dashes, smart quotes, and typographic punctuation. Use plain ASCII only.

### Tables

Keep tables narrow. Prefer lists when the data is simple.

### Constraints

- No emojis in documentation
- No decorative formatting
- No excessive bold text
- No inline HTML unless necessary
- No proprietary font recommendations
