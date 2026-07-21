# Founder UI acceptance routine

**Status:** Adopted guidance (2026-07-18; rewritten for target-site harness + backlog)  
**Audience:** Founder / release owner who wants higher product quality, tools aimed at a **chosen website**, and less manual regression over time  
**Backlog:** [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) **M-96–M-106** (and **G-QA-01–G-QA-03**)  
**Not:** A new paid UI-test SaaS product, or merge-blocking “Lighthouse ≥ 95 everywhere” gates

## Intent

ArchLucid already runs a large Playwright estate in GitHub plus warn-only lab Lighthouse CI. That answers:

> Did an established behavior break?

What is still missing is a **founder-owned acceptance lane** that:

1. Runs a **small, tagged** Playwright suite against a **URL you choose** (local, staging, production-like).
2. Runs **Lighthouse (and related checks)** against that same site — including authenticated pages.
3. Keeps a short **unscripted** buyer-like session for what scripts cannot see.
4. **Converts** repeated manual checks into tagged automated tests so manual regression shrinks over time.

Do **not** routinely run the full Playwright matrix on a workstation. Leave exhaustive regression in GitHub.

## North-star outcome

| Today | Target |
|-------|--------|
| Full suite lives in CI; founder re-clicks the same paths by hand | `@founder` suite + Lighthouse + console/network scan run against `ACCEPTANCE_BASE_URL` |
| Lighthouse CI only hits mock-backed localhost routes | Same budgets runnable against the chosen public + authenticated site |
| Exploratory findings stay in someone’s head | Defect log → new `@founder` / `@critical` tests until the click-path is automated |
| Pre-beta checklist is tribal knowledge | Written checklist in this doc + GTM rows; minutes of manual work trend down each release |

## Three testing lanes

| Lane | Where | Answers | Cadence |
|------|--------|---------|---------|
| **1. Exhaustive regression** | GitHub Actions | Did established behavior break? | Every push / PR / release gate |
| **2. Target-site acceptance** | Local (or scheduled) Playwright + Lighthouse against **chosen URL** | Do buyer-critical workflows still work on *this* deployment? | After meaningful UI change; before controlled beta |
| **3. Unscripted use** | Browser, no script | Is the product confusing, fragmented, or embarrassing? | After lane 2 passes; before controlled beta — shrink as lane 2 absorbs checks |

Lane 3 never goes to zero for UX judgment, but **click-path and “is this page broken?”** work should move into lane 2.

## Chosen website (target harness)

Owner picks the site per run. Examples:

| Target | Typical use |
|--------|-------------|
| `https://signup.staging.archlucid.net` (or current staging host) | Pre-beta acceptance (**preferred**) |
| Production / production-like host | Post-deploy smoke (careful with data) |
| `http://127.0.0.1:3000` + local API | Diagnosis while iterating |

**Env contract (to implement under M-96):**

| Variable | Role |
|----------|------|
| `ACCEPTANCE_BASE_URL` | UI origin under test (canonical for this routine) |
| `STAGING_BASE_URL` | Existing trial-funnel override — keep compatible or alias |
| Auth secrets / storage state | How Playwright signs in on the chosen site (API key, JWT, or saved `storageState`) — **never commit** |

All founder npm scripts should require or default `ACCEPTANCE_BASE_URL` so “run against my chosen website” is one command, not a config hunt.

## Lane 1 — leave exhaustive coverage in GitHub

Canonical tiers: [`docs/library/TEST_EXECUTION_MODEL.md`](../library/TEST_EXECUTION_MODEL.md).

| Job / surface | Config / notes |
|---------------|----------------|
| Mock Playwright | `playwright.mock.config.ts` — `npm run test:e2e` |
| Operator-shell mock | `playwright.operator-mock.config.ts` |
| Live API journeys | `playwright.config.ts` / `playwright.live.config.ts` — `live-api-*.spec.ts` |
| Accessibility | `chromium-accessibility` / `npm run test:a11y` |
| Visual / UX audit screenshots | `chromium-visual`, `ux-audit:screenshots:*` |
| Lighthouse CI (lab) | [`UI_LIGHTHOUSE_CI.md`](UI_LIGHTHOUSE_CI.md) — warn-only, mock-backed |

Lane 1 remains the merge/release regression authority. Lane 2 does **not** replace it.

## Lane 2 — target-site Playwright + Lighthouse

### Tags (M-97)

Organize a **small** set (~20–40 tests, grow as manual checks are absorbed):

```text
@founder          # default acceptance subset
@critical         # must-pass before controlled beta
@buyer-journey    # first-time / demo path
@release-smoke    # post-deploy against chosen URL
```

Prefer **tagging existing** live/journey specs over a parallel suite.

Suggested coverage (tag or add until covered):

- Sign-up or authentication
- Initial workspace experience
- Creating an architecture
- Creating and running a review
- Adding evidence
- Examining findings and citations
- Exporting or finalizing
- Invitations and roles
- Provider or model settings
- Integrations
- Help, feedback, billing, privacy, and support
- One complete first-time-user journey

### Commands (M-98 — target shape)

```bash
cd archlucid-ui
# Acceptance against chosen site (headless CI-friendly)
ACCEPTANCE_BASE_URL=https://your-host.example npm run test:e2e:founder

# Visible diagnosis
ACCEPTANCE_BASE_URL=https://your-host.example npm run test:e2e:founder:headed

# Step-through UI Mode
ACCEPTANCE_BASE_URL=https://your-host.example npm run test:e2e:founder:ui

# Single failure
npx playwright test path/to/test.spec.ts:42 --debug
```

Until scripts exist, use:

```bash
npx playwright test --grep @founder --project=chromium --headed
```

against a config whose `baseURL` is the chosen site.

**Showcase availability (`TB-889`, GTM **G-QA-04**):**

```bash
cd archlucid-ui
# Mock-backed regression (merge-blocking `ui-playwright-mock-smoke`)
npm run test:e2e:mock:functional -- --grep @release-smoke

# Post-deploy against staging/production UI (requires reachable site)
ACCEPTANCE_BASE_URL=https://staging.archlucid.net npx playwright test e2e/showcase-production-availability.spec.ts --grep @release-smoke
```

Scheduled hosted probe: [`.github/workflows/hosted-saas-probe.yml`](../../.github/workflows/hosted-saas-probe.yml) records `showcase_ok` for `GET /showcase/claims-intake-modernization` (HTTP 200, `demo-preview-marketing-body`, no `demo-preview-not-available` shell).

### Lighthouse against the chosen site (M-99)

Keep lab CI as-is ([`UI_LIGHTHOUSE_CI.md`](UI_LIGHTHOUSE_CI.md)). Additionally:

1. Run LHCI (or a thin wrapper) against `ACCEPTANCE_BASE_URL` + the representative route list.
2. Support **authenticated** routes via Playwright `storageState` (or equivalent), not only public marketing pages.
3. Prefer **median of 3–5 runs** for pages that matter; single-run scores are directional only.
4. Keep assertions **warn-only** for category scores; use hard fails only for **material** defects (severe a11y, broken nav, huge payload regression, unusable mobile layout, insecure/deprecated patterns, severe CLS).

Representative route set (adjust to real IA):

1. Public home  
2. Sign-up / entry  
3. Authenticated home / dashboard  
4. Reviews list  
5. Review detail / findings  
6. Architecture detail  
7. Evidence or graph  
8. Settings / integrations  
9. Help / docs  
10. One especially complex page  

### Automating what you used to do by hand (M-100, M-104, M-105)

| Manual habit | Automate into |
|--------------|---------------|
| Re-clicking the same buyer path every release | `@founder` / `@critical` Playwright |
| Opening DevTools for console / failed network | Playwright listeners + fail-on-unexpected (M-104) |
| Spot-checking a11y on key pages | axe on founder routes against chosen URL (M-105) |
| “Does Lighthouse look bad on staging?” | Remote LHCI against `ACCEPTANCE_BASE_URL` (M-99) |
| Finding UX confusion | Stay in lane 3; if the fix is a **deterministic** check, promote to M-100 |

**Rule:** every time you catch a defect twice by hand, file it as a tagged test before the next beta.

## Lane 3 — unscripted customer-like use (M-102)

After lane 2 passes, spend **15–30 minutes** (trend toward the low end as automation grows) without a script:

- Can I tell what to do next?
- Can I find a feature without remembering its route?
- Does the terminology remain consistent?
- Am I being sent between disconnected experiences?
- Do loading states explain what is happening?
- Can I recover from mistakes?
- Does anything look technically or commercially embarrassing?
- Would I feel comfortable demonstrating this screen to a buyer?

Log accepted defects explicitly (M-101). Promote repeatable checks into M-100.

## Recommended routines

### After a meaningful UI change

```text
1. Run the affected Playwright file (local or against ACCEPTANCE_BASE_URL).
2. Run @founder / @critical against ACCEPTANCE_BASE_URL.
3. Inspect failures in UI Mode / headed.
4. Personally walk the changed workflow (short).
5. Lighthouse on affected routes if layout, payload, a11y, or loading changed.
6. Push; full GitHub suite remains the regression authority.
```

### Before a controlled-beta release (M-101 / M-106)

```text
1. Full CI suite passes.
2. Founder Playwright suite passes against the chosen deployed URL.
3. Lighthouse (median) on representative public + authenticated routes.
4. Console / network automation clean on founder routes (when M-104 ships).
5. One personal end-to-end review + one first-time-user journey (lane 3).
6. Accepted defects documented; no silent “we’ll live with it.”
```

## Lighthouse caution (unchanged)

Do **not** invent gates like “every page ≥ 95 in every category.” Scores vary by machine, extensions, network, and browser state. Use scores as diagnostics; gate on material failures only. Lab CI already uses warn-only budgets — keep that posture for remote runs unless a specific metric is intentionally promoted.

## Security / reliability / cost

| Concern | Posture |
|---------|---------|
| **Security** | Auth against real sites uses secrets / storage state outside git; do not commit authenticated LH reports that embed tokens or PII. |
| **Scalability** | Lane 2 stays tens of tests, not thousands; CI owns the large estate. |
| **Reliability** | Chosen-site runs are environment-sensitive; flake → fix or quarantine with an explicit note, do not ignore. |
| **Cost** | No new SaaS UI-test platform — Playwright + LHCI + founder time. |

## GTM backlog map

| ID | Summary |
|----|---------|
| **M-96** | Target-site harness (`ACCEPTANCE_BASE_URL`, auth, docs) |
| **M-97** | Tag `@founder` / `@critical` / `@buyer-journey` / `@release-smoke` suite |
| **M-98** | npm scripts: founder / headed / ui against chosen URL |
| **M-99** | Remote Lighthouse against chosen URL (auth + median) |
| **M-100** | Gradual absorption: convert manual regression into tagged tests |
| **M-101** | Controlled-beta acceptance checklist + defect log template |
| **M-102** | Unscripted exploratory cadence (owner-executed) |
| **M-103** | Optional scheduled/pre-release CI job for founder suite on staging |
| **M-104** | Console + failed-network automation on founder routes |
| **M-105** | axe a11y on founder routes against chosen URL |
| **M-106** | First full dry-run; baseline manual minutes; prove shrinkage |
| **G-QA-01** | Owner: pick default `ACCEPTANCE_BASE_URL` + auth method |
| **G-QA-02** | Owner: run pre-beta checklist each controlled cut |
| **G-QA-03** | Owner: exploratory session + promote defects into M-100 |

## Related

| Doc | Role |
|-----|------|
| [`TEST_EXECUTION_MODEL.md`](../library/TEST_EXECUTION_MODEL.md) | Automated test tiers / CI jobs |
| [`LIVE_E2E_HAPPY_PATH.md`](../library/LIVE_E2E_HAPPY_PATH.md) | Live Playwright happy-path gate |
| [`UI_LIGHTHOUSE_CI.md`](UI_LIGHTHOUSE_CI.md) | Lab Lighthouse CI (mock-backed) |
| [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) | **M-96–M-106**, **G-QA-*** |
