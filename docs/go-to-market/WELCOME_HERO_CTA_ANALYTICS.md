> **Scope:** `/welcome` hero — three CTAs, Microsoft Clarity custom events, environment variables, copy/legal posture, and links to demo workspaces (#31) and product FAQ.

# Welcome hero — CTAs, analytics, and compliance

**Code:** [`archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx`](../../archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx) (layout + copy), primary [`WalkthroughRequestCta.tsx`](../../archlucid-ui/src/components/marketing/WalkthroughRequestCta.tsx), secondary [`SelfDemoRequestCta.tsx`](../../archlucid-ui/src/components/marketing/SelfDemoRequestCta.tsx), tertiary [`HeroEarlyAccessCta.tsx`](../../archlucid-ui/src/components/marketing/HeroEarlyAccessCta.tsx). Analytics helpers: [`marketing-clarity-custom-event.ts`](../../archlucid-ui/src/lib/marketing/marketing-clarity-custom-event.ts).

**Demo workspaces (canonical URLs, env):** [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md).

**Public FAQ (bulk upload ≤30 files, demo workspaces):** in-app route **`/faq`** (`archlucid-ui/src/app/(marketing)/faq/page.tsx`).

---

## Microsoft Clarity — custom events (staging / production)

Events fire only when:

1. The visitor has **accepted** marketing analytics on the consent banner (`localStorage` key `archlucid.marketingAnalyticsConsent.v1` = `granted`), and  
2. Clarity is loaded (`NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID` set — see [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md)).

| Event | When it fires | UTM on the event |
|--------|----------------|------------------|
| **`cta_walkthrough_click`** | **Click** on primary **Request walkthrough** (before navigation) | `cta_utm_source`, `cta_utm_medium`, `cta_utm_campaign` set from current page query when non-empty; `cta_source` = `hero` |
| **`cta_self_demo_click`** | **Click** on secondary **Try the self-demo** | Same UTM dimensions |
| **`cta_early_access_submit`** | **After** successful **`POST /v1/marketing/early-access`** (HTTP success) — **not** when opening the inline form or on click | Same UTMs plus optional `cta_email_domain` (domain only, lowercase) |

**Manual verification (staging):** land with `?utm_source=test&utm_medium=email&utm_campaign=hero`; accept cookies/consent; use browser devtools / Clarity dashboard to confirm dimensions and event names. **`NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID`** must be configured for the environment under test.

**Automated verification (CI):** Vitest mocks `window.clarity` + consent — [`marketing-clarity-custom-event.test.ts`](../../archlucid-ui/src/lib/marketing/marketing-clarity-custom-event.test.ts), [`marketing-hero-cta-clarity.wiring.test.tsx`](../../archlucid-ui/src/components/marketing/marketing-hero-cta-clarity.wiring.test.tsx), [`HeroEarlyAccessCta.test.tsx`](../../archlucid-ui/src/components/marketing/HeroEarlyAccessCta.test.tsx).

---

## Configuration (deployment)

Document per-environment values in your runbook; canonical variable list lives in **[`archlucid-ui/.env.example`](../../archlucid-ui/.env.example)**.

| Variable | Purpose |
|----------|---------|
| **`NEXT_PUBLIC_WALKTHROUGH_BOOKING_URL`** | Primary CTA target (booking URL); UTMs appended. If unset, CTA uses **mailto** (optional **`NEXT_PUBLIC_WALKTHROUGH_MAILTO_FALLBACK`**). |
| **`NEXT_PUBLIC_SELF_DEMO_URL`** | Secondary CTA target — prefer **Workspace A** path (see [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md)); UTMs appended. |
| **`NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID`** | Optional; enables Clarity after explicit consent. |

**CD / pipeline context:** [`../library/DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md) — UI ships with the same Next bundle; marketing env vars are **build-time** `NEXT_PUBLIC_*` for the web app image.

---

## Copy / legal checklist (hero)

| Check | Status (intent) |
|-------|------------------|
| **Early access** | Form disclosure states conversation / follow-up — **not** instant product access, **not** checkout, **not** walkthrough-led pilot parity ([`HeroEarlyAccessCta.tsx`](../../archlucid-ui/src/components/marketing/HeroEarlyAccessCta.tsx)). |
| **No hero dollar pricing / 90-day pilot band** | Hero does not quote purchasable pilot **$** amounts or promotional 90-day pricing; packaging remains **sales-qualification** paths and links to **`/pricing`** / trial elsewhere. |
| **Self-demo** | Tooltip + microcopy: **synthetic / fabricated data** only ([`SELF_DEMO_HERO_DISCLOSURE_COPY`](../../archlucid-ui/src/components/marketing/SelfDemoRequestCta.tsx)). |
| **FAQ cross-links** | **`/faq#bulk-upload-30-files`**, **`/faq#demo-workspaces`** under tertiary CTA. |
| **Footer / attribution** | No third-party **marketing** footer requirement beyond site chrome; **Clarity** disclosure: [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md). |

---

## Explicitly out of scope on `/welcome`

- **No** public **paid-pilot price band** on the hero.
- **No** “Buy now” or **self-serve checkout** CTA on the landing hero.
- **No** Stripe Checkout path from the welcome hero (deferred per procurement backlog **#7** / **P4**); see [`STRIPE_CHECKOUT.md`](STRIPE_CHECKOUT.md) for product stance.

---

## Playwright (optional smoke)

**Mock E2E** (`playwright.mock.config.ts`): [`marketing-public-pages-smoke.spec.ts`](../../archlucid-ui/e2e/marketing-public-pages-smoke.spec.ts) — welcome hero CTAs, self-demo navigation, early access thanks with proxied **`POST`** stub.

Run: `npx playwright test e2e/marketing-public-pages-smoke.spec.ts -c playwright.mock.config.ts` (after mock webServer per [`archlucid-ui/README.md`](../../archlucid-ui/README.md)).
