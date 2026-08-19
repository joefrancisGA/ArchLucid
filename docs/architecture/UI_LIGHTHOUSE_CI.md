# UI Lighthouse CI (lab synthetic checks)

**TB-693** closes the naming gap left by **TB-573**: bundle-size regression gates ship, but lab Lighthouse traces did not. This job complements **TB-692** field Core Web Vitals with reproducible, throttled desktop audits on key operator routes.

## Routes

Canonical list: `archlucid-ui/performance/lighthouse-ci-routes.v1.json` (drift-guarded by `scripts/lighthouse-ci-routes.test.ts`).

| Route | Rationale |
| --- | --- |
| `/welcome` | Public marketing entry — cold landing LCP/CLS |
| `/reviews` | Authenticated list hub (mock-backed demo shell) |
| `/reviews/claims-intake-modernization` | Representative run detail (`SHOWCASE_STATIC_DEMO_RUN_ID`) |
| `/governance/findings` | Highest-weighted governance queue surface |

## How it runs

1. `npm run build` in `archlucid-ui` (production standalone).
2. `e2e/start-e2e-with-mock.ts` — loopback mock API + standalone Next server (same spine as Playwright mock E2E).
3. `@lhci/cli` `autorun` with `lighthouserc.cjs` — one desktop run per route.
4. JSON/HTML reports under `archlucid-ui/.lighthouseci/` (CI artifact `ui-lighthouse-ci-reports`).

Local:

```bash
cd archlucid-ui
npm run build
MOCK_E2E_SKIP_NEXT_BUILD=1 npm run lighthouse:ci
```

## Budgets (warn-only, 2026-07-10)

Assertions use **`warn`**, not **`error`**, for the first promotion window per **TB-693** — regressions surface in logs/artifacts without blocking merge.

| Assertion | Threshold | Rationale |
| --- | --- | --- |
| `categories:performance` | min **0.35** | Lab mock stack is heavier than CDN-hosted marketing; directional guard only until field baselines land |
| `categories:accessibility` | min **0.85** | Aligns with axe Playwright gate intent |
| `categories:best-practices` | min **0.75** | Catches mixed-content / console regressions on architect workspace shells |
| `categories:seo` | min **0.80** | Marketing `/welcome` only meaningful SEO surface in set |
| `first-contentful-paint` | max **4000 ms** | Generous lab ceiling for CI agent CPU |
| `largest-contentful-paint` | max **6000 ms** | Same — tighten after **TB-692** field p75 available |
| `cumulative-layout-shift` | max **0.15** | Lab CLS often higher than field; warn band |
| `total-blocking-time` | max **600 ms** | Main-thread guard for dense operator tables |

Tighten to merge-blocking **`error`** assertions only after two weeks of green warn-only runs and **TB-692** field-data review.

## CI

Workflow job **`ui-lighthouse-ci`** in `.github/workflows/ci.yml` — **warn-only** (`continue-on-error: true`), runs on `master` pushes after `gitleaks`, uploads `.lighthouseci` artifacts for trend review.

## Remote / chosen-site acceptance (GTM M-99)

Lab CI above stays mock-backed and merge-adjacent. For founder acceptance against an owner-chosen origin:

```bash
cd archlucid-ui
ACCEPTANCE_BASE_URL=https://your-host.example npm run lighthouse:acceptance
```

| Piece | Path |
| --- | --- |
| Routes | `performance/lighthouse-acceptance-routes.v1.json` |
| LHCI config | `lighthouserc.acceptance.cjs` |
| Runner | `scripts/run-lighthouse-acceptance.mjs` |
| Auth cookies | `ACCEPTANCE_STORAGE_STATE` → `scripts/lighthouse-acceptance-puppeteer.cjs` |
| Reports | `.lighthouseci-acceptance/` |

Category assertions remain **warn-only** (same numeric floors as lab). Hard fails are limited to material defects (severe CLS, huge `total-byte-weight`, HTTPS on remote hosts). Axe founder suite (**M-105**) owns the AA bar. Guidance: [`FOUNDER_UI_ACCEPTANCE_ROUTINE.md`](FOUNDER_UI_ACCEPTANCE_ROUTINE.md).

## Related

- **TB-573** / **TB-691** — First Load JS bundle regression (`check:first-load-js`)
- **TB-692** — field `WebVitalsMetric` App Insights events
- **TB-2031** — field CWV triage before the next bundle cut: [`FIELD_WEB_VITALS_TRIAGE.md`](../runbooks/FIELD_WEB_VITALS_TRIAGE.md) (pairs GTM **G-QA-06** / **G-QA-07**)
- **TB-2032** — marketing `next/image` **waived** (no image-bound LCP): [`tb2032_marketing_lcp_image_waiver.md`](tb2032_marketing_lcp_image_waiver.md)
- `archlucid-ui/playwright.mock.config.ts` — mock server contract
- **GTM M-99** — remote acceptance LHCI (`lighthouse:acceptance`)
