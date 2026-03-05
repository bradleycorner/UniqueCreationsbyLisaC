# Roadmap

Strategic planning document for Unique Creations by Lisa C.
Last updated: 2026-03-04

---

## Current State

- Custom headless storefront live on Netlify (`willowy-jelly-c76339.netlify.app`)
- DNS not yet cut over - old Square Online still at `www.uniquecreationsbylisac.com`
- Square is the current source of truth for the product catalog
- Etsy store exists as a separate, unconnected sales channel
- No admin interface - catalog changes require Square dashboard or Square MCP
- Payment processing via Square (tied to catalog)

---

## Goals

1. This Netlify site becomes the primary customer-facing storefront
2. Single place to manage products (one source of truth)
3. Etsy kept in sync automatically
4. Credit card processing flexibility - not locked to Square
5. Admin interface so Lisa can manage products without developer involvement

---

## Option A: Square stays as source of truth, add Etsy sync

### How it works

- Square catalog remains master
- A Netlify scheduled function or webhook pushes product changes to Etsy
- Storefront continues to read from Square API

### Pros

- Minimal change to existing architecture
- Square is already populated and working
- Can be done incrementally

### Cons

- Tightly coupled to Square - if Square goes away, everything breaks
- Etsy sync is one-directional (Square -> Etsy); Etsy-only orders won't sync back
- Admin experience unchanged (Square dashboard)
- Does not move toward the long-term goal of processor independence

### Effort

Low. A Netlify scheduled function that reads the Square catalog and pushes
updates to Etsy via the Etsy Open API v3.

---

## Option B: Custom datastore as center of truth (recommended long-term)

### How it works

- Products stored in a datastore owned by this project (not Square)
- Admin UI built into the Netlify site (password-protected pages)
- Sync adapters push product data to Square, Etsy, and future processors
- Square becomes just a payment endpoint, not the catalog owner
- Swapping Square for a new payment processor = swap one adapter, nothing else changes

### Architecture

```
Admin UI (Netlify)
       |
  Datastore (source of truth)
       |
  _____|_____________________
  |         |               |
Square    Etsy       [new processor]
(payments) (marketplace)  (payments)
```

### Datastore candidates

| Option | Cost | Complexity | Notes |
|--------|------|------------|-------|
| Netlify Blobs | Free | Low | Key-value, already on Netlify, good for simple catalogs |
| Git (JSON in repo) | Free | Low | Version controlled, needs redeploy on save |
| Supabase | Free tier | Medium | Full PostgreSQL, real-time, separate service |
| PlanetScale | Free tier | Medium | MySQL-compatible, scalable |

Recommendation: start with Netlify Blobs. It is already available on the Netlify
free tier, requires no separate account, and is simple enough for a catalog of
50-200 products. Migrate to Supabase if query complexity demands it.

### Admin UI scope

- Product list with search and filter
- Create / edit / delete products
- Image upload
- Variation management (sizes, named colorways)
- Modifier list management (ring color swatches)
- Sync status per channel (Square, Etsy)
- Manual sync trigger per product or bulk

### Sync adapters needed

- Square adapter: create/update/delete catalog objects via Square API
- Etsy adapter: create/update/delete listings via Etsy Open API v3
- Future processor adapter: TBD based on processor choice

### Etsy API notes

- Etsy Open API v3 supports listing create/update/delete, inventory, images
- Etsy has its own taxonomy for categories and attributes (different from Square)
- Variations in Etsy map to "property" values (size, color, material)
- Custom orders and made-to-order flags are supported
- Rate limits: 10 req/sec, requires OAuth for write access

### Payment processor candidates

| Processor | Notes |
|-----------|-------|
| Stripe | Developer-friendly, excellent docs, widely supported |
| PayPal / Braintree | High consumer recognition, more complex integration |
| Square | Current - works, but ties catalog to payments |

If moving to Stripe: checkout flow changes to Stripe Checkout or Stripe Elements.
The catalog, cart, and admin UI are processor-agnostic if built correctly.

### Pros

- True independence from any single platform
- Processor swap = one adapter change, nothing else
- Admin UI designed for Lisa's actual workflow
- Single place to manage everything
- Etsy sync is bidirectional if needed (Etsy order -> local datastore)

### Cons

- Significant build effort upfront
- Need to migrate existing Square catalog data on cutover
- Admin UI needs authentication (Netlify Identity or simple shared secret)

### Effort

High. Best approached in phases (see below).

---

## Recommended Phases

### Phase 1 - Complete (done)

- Headless storefront live on Netlify
- Square catalog integration working
- Color modifier picker with texture swatches
- GitFlow branching and deployment pipeline

### Phase 2 - Short term

- Cut DNS over to Netlify (retire Square Online)
- Add Etsy sync via Option A (Square -> Etsy scheduled function)
- Upload remaining product images
- Add missing product descriptions (23 of 51 items)
- Create product categories in Square

### Phase 3 - Medium term

- Build admin UI on Netlify (product management)
- Migrate datastore to Netlify Blobs
- Replace Square catalog reads with local datastore reads
- Square becomes payments-only

### Phase 4 - Long term

- Evaluate payment processor (Stripe vs Square vs other)
- Build or swap payment adapter
- Add Etsy adapter to admin sync
- Bidirectional order sync (optional)

---

## Open Questions

- Which credit card processor will replace Square? (affects Phase 4 scope)
- Does Etsy require a separate inventory count or does custom/made-to-order work?
- Should the admin UI be built for Lisa to use independently or developer-managed?
- Timeline pressure on DNS cutover - when does Square Online need to go away?
- Are there other sales channels beyond Square and Etsy?

---

## Related Files

- `CLAUDE.md` - developer context and Square integration details
- `netlify/functions/square-inventory.js` - current catalog source
- `index.html` - storefront frontend
