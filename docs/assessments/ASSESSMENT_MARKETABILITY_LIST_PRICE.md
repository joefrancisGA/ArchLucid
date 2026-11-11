# Assessment — marketability and published list prices

**Owner decision (settled):** ArchLucid monthly tiers and SecureNow §9 amounts are **published list prices**, sold **quote-only**. Evidence: `docs/go-to-market/PRICING_PHILOSOPHY.md`, CHANGELOG entries **2026-04-17** (ArchLucid freeze) and **2026-11-09** (SecureNow public list price), UI copy in `securenow-published-list-price-copy.ts`, `archlucid-commercial-order-acceptance-copy.ts`, quote packet and `/pricing` surfaces.

## `(A)` scoring rule (from 2026-11-11)

1. **Do not cap Marketability** solely because fees were “not on public pages.” That condition is **obsolete** once list prices ship on allowed surfaces.
2. **Do not list as a human action** “decide the public posture” or “publish list prices.” That decision is **closed**.
3. **NO_GO** remains **honest copy** on beta and sponsor surfaces. It is **not** equivalent to hiding price. Marketability may sit in the **low–mid 80s** when samples, tier grid, quote path, and list-price tables align with `PRICING_PHILOSOPHY`.
4. **Live Stripe checkout**, **Marketplace offer live**, and **removing NO_GO** are separate owner decisions. They affect **Commercial packaging readiness** and **`(B)` procurement realism**, not a hidden-price Marketability cap.
5. **M-316** (quote packet on welcome/footer) is **distribution**, not list-price publication. Track under GTM if still open.

## Default Marketability scores after this rule (full rescore baseline)

Re-read product evidence on each pass; these are the **starting scores** when trunk matches current quote-only list-price UI:

| Product | Marketability | Rationale |
|---------|--------------:|-----------|
| **SecureNow** | **82** | Fixture sample on marketing chrome, SKU card + quote packet with §9 list prices, explicit NO_GO and quote-only. |
| **ArchLucid** | **81** | `/pricing` tier grid + quote request, order-acceptance copy, samples; sales-led motion without live checkout. |

## Human actions — do not include

- ~~Decide whether to publish list prices~~

## Human actions — still valid when relevant

- Turn on **authorized** Stripe Prices / checkout when engineering and finance agree.
- Change **NO_GO** only with an explicit GTM release decision.
- **Real capture** (SecureNow Reader) and **sealed tenant review** (ArchLucid) for Time-to-Value, not Marketability list-price posture.
