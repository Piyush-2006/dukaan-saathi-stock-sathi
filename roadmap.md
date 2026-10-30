# DUKAANSAATHI AI — Upgrade Roadmap (incremental, no rebuild)

Upgrade brief: user-uploaded `Upgrade_my_existing_project_DukaanSaathi_AI_into_pasted.md`.
Existing stack (TanStack Start + Lovable Cloud, products/sales + record_sale) stays as-is.

## Tasks
- [x] (previously) Full rebuild on Lovable Cloud — 7 sections, real backend, seed demo data
- [ ] 1. Design polish: saffron accent tokens, refined surfaces, personalized shop-name welcome (Settings-stored shop name)
- [ ] 2. Shared insights module `src/lib/insights.ts` (best sellers, slow movers, reorder suggestions, trends, briefing rules) + unit tests
- [ ] 3. Dashboard: "Today's Shop Briefing" card (3 traceable rule-based recommendations, prev-day comparison)
- [ ] 4. Shop Intelligence Center `/intelligence` (period selector, real calculations, explanations, labeled estimates)
- [ ] 5. AI Business Copilot `/copilot` — streaming chat grounded in shop data via Lovable AI Gateway server route; loading/empty/error/retry; suggested follow-ups; chat history persisted
- [ ] 6. Close Shop `/close-shop` — end-of-day summary + printable daily report
- [ ] 7. Hindi/English language selector (nav + key labels), html lang sync
- [ ] 8. Sidebar/nav reorg for new pages; voice page stays honest placeholder
- [ ] 9. Verify: tests, Playwright walk-through (product add, sale record, stock deduction, intelligence, briefing, close-shop), build clean
- [ ] 10. Final report: files changed, features completed, config still required
