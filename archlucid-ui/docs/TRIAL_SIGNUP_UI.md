# Trial signup UI (public marketing + onboarding)

**Audience:** Engineers extending the buyer-facing self-service path in `archlucid-ui/`.

---

## Objective

Deliver a **public, unauthenticated** marketing and signup surface that calls **`POST /v1/register`** through the same-origin **`/api/proxy/v1/register`** route, then hands off to email verification copy and the **operator onboarding** entry at **`/onboarding/start`**, which reads **`GET /v1/tenant/trial-status`** and deep-links into the **new-run wizard** with the seeded **`trialSampleRunId`** highlighted.

---

## Routes

| Path | Layout | Purpose |
|------|--------|---------|
| `/` | `(operator)` | Operator home; **JWT mode** redirects anonymous users to `/welcome` via `OperatorHomeGate`. |
| `/welcome` | `(marketing)` | Hero + pillars + pricing cards (JSON from `/pricing.json`). |
| `/signup` | `(marketing)` | Zod + RHF signup form. |
| `/signup/verify` | `(marketing)` | Email / Entra verification handoff + CTA to onboarding. |
| `/onboarding/start` | `(operator)` | Trial status card + links to `/runs/new?sampleRunId=…` and `/runs/{id}`. |

---

## Pricing JSON (no literals in TS)

- Source of truth: fenced **`locked-prices`** block in `docs/go-to-market/PRICING_PHILOSOPHY.md`.
- Generator: `scripts/ci/generate_pricing_json.py` (fails the build when the fence or JSON is invalid).
- Output: `archlucid-ui/public/pricing.json`.
- `npm run build` runs **`npm run generate:pricing`** first.

---

## Registration scope headers (pre-OIDC)

After signup, `sessionStorage` key **`archlucid_last_registration`** stores `{ tenantId, defaultWorkspaceId, defaultProjectId, … }`.

Until OIDC completes, `mergeRegistrationScopeForProxy` adds **`x-tenant-id` / `x-workspace-id` / `x-project-id`** to selected client fetches so **`/api/proxy`** forwards the correct SQL scope (matches `HttpScopeContextProvider` header fallback when JWT claims omit tenant).

`CallbackClient` clears the registration payload after token exchange so JWT scope cannot be accidentally mixed with stale session data.

---

## Trial shell surfaces

- **`TrialBanner`** — `GET /v1/tenant/trial-status`; visible for **Active**, **Expired**, **ReadOnly**; **Convert to paid** → `POST /v1/tenant/billing/checkout`; dismiss snoozes **24h** via `archlucid_trial_banner_snooze_until_ms` in `localStorage`.
- **`WelcomeBanner`** — trial-aware copy when status is **Active**, using the same trial-status fetch pattern.

---

## Tests

- **Vitest:** `WelcomeMarketingPage`, `SignupForm`, `TrialBanner`, `NewRunWizardClient` sample query, `generate_pricing_json.py` round-trip, **`src/accessibility/trial-marketing-axe.test.tsx`** (jest-axe).
- **Playwright (`live-api-trial-signup.spec.ts`):** UI matrix row `ui: signup → …` (DevelopmentBypass).
- **Playwright (`live-api-accessibility.spec.ts`):** `/welcome`, `/signup`, `/onboarding/start`.

---

## Security, scalability, reliability, cost

- **Security:** Registration remains server rate-limited (**`registration`** policy). Scope headers are only merged when **no OIDC access token** is present, avoiding header overrides for signed-in JWT users.
- **Scalability:** Static marketing pages are edge-cache friendly; pricing JSON is small and cacheable.
- **Reliability:** Pricing generation fails closed in CI when the doc fence drifts.
- **Cost:** No additional services; same proxy and API paths as the operator shell.
