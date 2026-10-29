# Dukaan Saathi Stock Sathi

Attached is my master build prompt for DUKAANSAATHI AI — a polished, professional, demo-ready digital shop management platform for small Indian kirana stores. Follow it as the full specification.

Build approach decision (this supersedes Section 2 of the prompt): rebuild from scratch as a new Lovable project on Lovable Cloud. There is no existing codebase to preserve, so instead of the local FastAPI backend at 127.0.0.1:8002, implement an equivalent backend on Lovable Cloud (Supabase) exposing the same API contracts — GET /health, GET /products, POST /products, PATCH /products/{product_id}/stock, GET /sales, POST /sales — with the sales endpoint recording the sale and deducting stock transactionally in the database. Keep Supabase keys out of frontend code; use a reusable TypeScript API service layer over the Cloud backend.

Everything else in the attached prompt applies as written: product vision, visual identity (deep green primary, warm off-white backgrounds, charcoal typography, emerald/amber/red state colors, no generic AI-dashboard aesthetics), application shell with sidebar and mobile drawer and 7 navigation sections (Dashboard, Products & Stock, Sales, Customer Udhaar, AI Voice Assistant, Reports, Settings), polished dashboard with real metrics only, complete Products & Stock workflow, Sales as the most polished workflow with POST /sales payload { "product_id": number, "quantity": number } and frontend never deducting stock itself, honest placeholder-grade Udhaar / AI Voice Assistant / Reports modules that never fake data, responsive and accessible UX with INR formatting, and hackathon demo readiness.

Deliverable: when done, report exactly which features work, which are incomplete, which files changed, and any environment configuration still required.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dukaan-saathi-stock-sathi.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/97d455e9-9ae0-446b-a2af-65910fff64f8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
