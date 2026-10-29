# DUKAANSAATHI AI — Rebuild Roadmap

Rebuild from scratch on TanStack Start + Lovable Cloud. Backend exposes the same API contracts
(`GET /health`, `GET /products`, `POST /products`, `PATCH /products/{id}/stock`, `GET /sales`,
`POST /sales`) as TanStack server routes; frontend talks to them through a reusable API service layer.

## Tasks

- [x] Enable Lovable Cloud
- [x] Database migration: `products`, `sales`, transactional `record_sale` function, seed demo inventory + sales
- [ ] Design system: deep-green primary, warm off-white bg, charcoal text, state colors, fonts in styles.css + root head
- [ ] API service layer + shared types + formatting utils (`src/lib/api.ts`, `src/lib/types.ts`, `src/lib/format.ts`)
- [ ] App shell: sidebar (desktop) + mobile drawer, page header, backend status, refresh, footer, 7 nav sections
- [ ] Dashboard page (real metrics, quick actions, recent sales, low-stock list)
- [ ] Products & Stock page (search, add form, stock update, status badges, responsive table/cards)
- [ ] Sales page (product selector, qty, bill total, confirm, POST /sales, history, today's revenue)
- [ ] Udhaar page (honest placeholder: no fake data, no claimed persistence)
- [ ] AI Voice Assistant page (honest placeholder: mic UI, no simulated processing)
- [ ] Reports page (daily/monthly summaries, product performance from real sales, low-stock insights)
- [ ] Settings page (connection info, endpoint list, version)
- [ ] Head metadata on every route; Toaster mounted; tests for routing + stock-state/INR rules
- [ ] Verify: build clean, tests pass, Playwright walk-through of demo flow
- [ ] Final report: working / incomplete / files changed / env config
