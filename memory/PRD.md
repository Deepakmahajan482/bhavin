# Bhavin Creations · Product Requirements Doc

## Original Problem Statement
Build a complete full-stack modern e-commerce website for a resin art brand named **Bhavin Creations**, designed and developed by **RK Technologies**. Premium, elegant, artistic, luxury handcrafted feel; soft pastel + gold/black accents; smooth animations; mobile responsive. Footer must read "Powered by RK Technologies — Crafting Digital Experiences, Just Like Bhavin Creates Art."

## Stack & Decisions
- Frontend: React 19 + Tailwind + Shadcn UI; Playfair Display + Outfit fonts; "Artisan Elegance" palette (Pearl/Obsidian/Gold); light & dark themes.
- Backend: FastAPI + MongoDB (motor); JWT cookie auth (bcrypt + PyJWT); Emergent Universal Key for AI.
- Auth: JWT email/password. Admin seeded on startup.
- Payments: Mock checkout (mock_card / cod) — real gateway deferred.
- AI: Claude Sonnet 4.5 via emergentintegrations for product recommendations (graceful fallback to featured items).

## User Personas
- Patron (customer): browses, filters, adds to wishlist/cart, checks out, tracks orders, requests custom pieces.
- Studio admin: manages products, orders, custom requests; sees revenue/orders/customers analytics.

## Core Requirements (Static)
- Storefront: Hero, curated categories bento, featured products, latest arrivals, about teaser.
- Shop: search, category filter, color filter, price slider, sort.
- Product detail: gallery, reviews, ratings, related products, add to cart/wishlist.
- Cart drawer + dedicated checkout with coupon, shipping math.
- Customer dashboard: orders, profile, return requests.
- Admin Control Room: dashboard with last-7-day revenue chart, product CRUD with featured flag, order status pipeline, custom requests.
- Public custom-order form + contact form + FAQ accordion + about page.
- WhatsApp click-to-chat floating button.
- Light/Dark theme toggle.
- Footer: "Powered by RK Technologies" + tagline.

## What's Implemented (2026-04-30)
- Full backend (16 seed products, admin/test user, 2 seed coupons WELCOME10/RESIN20).
- All UI pages above.
- 38/38 backend tests passing.
- Auto-fixed bug: `/api/admin/analytics` async-iter sum.
- Cookie auth working (samesite=none; secure).
- AI recommendations endpoint (with featured-items fallback).

## Backlog
- P0 (next): Real payment gateway (Stripe / Razorpay) — currently mocked.
- P0: Email notifications (order confirmation, contact reply) — Resend or SendGrid.
- P1: Pagination on /api/admin/orders, /api/orders, /api/products.
- P1: Live chat widget (e.g., Crisp / Intercom embed) — currently WhatsApp only.
- P1: Image upload for admin product CRUD (currently URL-based) — object storage.
- P1: Stock-guard at checkout (reject if requested qty > stock).
- P2: SEO sitemap, OG tags per product, structured data.
- P2: Returns/refunds workflow UI for admin (already has API).
- P2: Honor X-Forwarded-For for brute-force key.
- P2: Coupon expiry date + usage count.
