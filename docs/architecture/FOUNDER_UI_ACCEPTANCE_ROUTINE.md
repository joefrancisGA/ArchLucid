> **Reviewed:** 2026-07-28

> **Scope:** Founder UI acceptance routine (lanes 1–3, harness, Lighthouse) plus gradual absorption (**M-100**) and unscripted exploratory cadence (**M-102**) formerly in `docs/go-to-market/FOUNDER_UI_ABSORPTION_AND_EXPLORATORY.md` (that filename remains a path-stable alias for GTM **M-100** / **M-102** / **G-QA-03** callers).

# Founder UI acceptance routine

**Status:** Adopted guidance (2026-07-18; rewritten for target-site harness + backlog; absorption/exploratory folded 2026-07-28)  
**Audience:** Founder / release owner who wants higher product quality, tools aimed at a **chosen website**, and less manual regression over time  
**Backlog:** [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) **M-96–M-106** (and **G-QA-01–G-QA-03**)  
**Not:** A new paid UI-test SaaS product, or merge-blocking “Lighthouse ≥ 95 everywhere” gates

**Ops note (not UI lane):** Solo-operator **P0 page-path** enablement (AMW scrape + critical action-group Test) lives in [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) (**TB-957**). Founder drill cadence / pass-fail log: GTM **M-120**.

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

**Env contract (M-96 — shipped):**

| Variable | Role |
|----------|------|
| `ACCEPTANCE_BASE_URL` | UI origin under test (canonical). Resolved in `archlucid-ui/e2e/helpers/acceptance-base-url.ts` |
| `STAGING_BASE_URL` | Alias when `ACCEPTANCE_BASE_URL` is unset (trial-funnel / hosted probes) |
| `ACCEPTANCE_STORAGE_STATE` | Optional path to Playwright `storageState` JSON for authenticated routes — **never commit** |
| `LIVE_API_URL` / `LIVE_API_KEY` / JWT env | Same as live E2E for API-backed `@founder` specs |
| `ACCEPTANCE_SKIP_LIVE_INFRA=1` | Skip SQL/API readiness probe (public / marketing-only runs against a remote UI) |
| `ACCEPTANCE_NO_WEBSERVER=1` | On loopback, do not start Next — reuse an already-running UI |

Default when neither acceptance nor staging URL is set: `http://127.0.0.1:3000` (same as live Playwright). Config: `archlucid-ui/playwright.founder.config.ts`. Owner picks the standing default under **G-QA-01**.

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

### Tags (M-97 — shipped)

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

### Commands (M-98 — shipped)

```bash
cd archlucid-ui
# Acceptance against chosen site (headless; greps @founder)
ACCEPTANCE_BASE_URL=https://your-host.example npm run test:e2e:founder

# Visible diagnosis
ACCEPTANCE_BASE_URL=https://your-host.example npm run test:e2e:founder:headed

# Step-through UI Mode
ACCEPTANCE_BASE_URL=https://your-host.example npm run test:e2e:founder:ui

# Must-pass subset before controlled beta
ACCEPTANCE_BASE_URL=https://your-host.example npm run test:e2e:founder:critical

# Post-deploy smoke only
ACCEPTANCE_BASE_URL=https://your-host.example ACCEPTANCE_SKIP_LIVE_INFRA=1 npm run test:e2e:founder:release-smoke

# Single failure
npx playwright test -c playwright.founder.config.ts path/to/test.spec.ts:42 --debug
```

PowerShell: `$env:ACCEPTANCE_BASE_URL="https://your-host.example"; npm run test:e2e:founder`

**Tags (M-97):** existing live/demo/marketing/journey specs carry Playwright `{ tag: [...] }`. Prefer growing via **M-100**. Help/billing/privacy dedicated specs are still thin; absorb from exploratory (**G-QA-03**).

**Showcase availability (`TB-889`, GTM **G-QA-04**):**

```bash
cd archlucid-ui
# Mock-backed regression (merge-blocking `ui-playwright-mock-smoke`)
npm run test:e2e:mock:functional -- --grep @release-smoke

# Post-deploy against staging/production UI (requires reachable site)
ACCEPTANCE_BASE_URL=https://staging.archlucid.net ACCEPTANCE_SKIP_LIVE_INFRA=1 npm run test:e2e:founder:release-smoke
```

Scheduled hosted probe: [`.github/workflows/hosted-saas-probe.yml`](../../.github/workflows/hosted-saas-probe.yml) records `showcase_ok` for `GET /showcase/claims-intake-modernization` (HTTP 200, `demo-preview-marketing-body`, no `demo-preview-not-available` shell).

### Console + network guards (M-104 — shipped)

```bash
cd archlucid-ui
ACCEPTANCE_BASE_URL=https://your-host.example ACCEPTANCE_SKIP_LIVE_INFRA=1 FOUNDER_PUBLIC_ONLY=1 \
  npm run test:e2e:founder:console-network
```

Walks founder routes with `pageerror` / `console.error` / `requestfailed` / HTTP 5xx listeners. Benign noise: `e2e/helpers/founder-page-noise-allowlist.ts`. Soft mode: `FOUNDER_PAGE_GUARDS_WARN_ONLY=1`.

### axe on founder routes (M-105 — shipped)

```bash
cd archlucid-ui
ACCEPTANCE_BASE_URL=https://your-host.example ACCEPTANCE_SKIP_LIVE_INFRA=1 FOUNDER_PUBLIC_ONLY=1 \
  npm run test:e2e:founder:a11y
```

Reuses `e2e/helpers/axe-helper.ts` (WCAG 2.2 AA tags); fails on critical/serious. Does **not** replace mock `test:a11y` or live `live-api-accessibility.spec.ts`.

Shared route list: `e2e/helpers/founder-acceptance-routes.ts` (public by default on remote; authenticated when `ACCEPTANCE_STORAGE_STATE`, `FOUNDER_INCLUDE_AUTH_ROUTES=1`, or loopback).

### Lighthouse against the chosen site (M-99 — shipped)

Keep lab CI as-is ([`UI_LIGHTHOUSE_CI.md`](UI_LIGHTHOUSE_CI.md)). Remote / chosen-site:

```bash
cd archlucid-ui
ACCEPTANCE_BASE_URL=https://your-host.example npm run lighthouse:acceptance
# Optional authenticated routes + cookies from Playwright storageState:
ACCEPTANCE_BASE_URL=https://your-host.example \
  ACCEPTANCE_STORAGE_STATE=./.local/acceptance-storage.json \
  npm run lighthouse:acceptance
```

- Config: `lighthouserc.acceptance.cjs` + `performance/lighthouse-acceptance-routes.v1.json`
- Default **3 runs** (LHCI median); override with `LIGHTHOUSE_ACCEPTANCE_RUNS`
- Category scores **warn-only**; hard-fail on severe CLS (>0.25), huge payload (`total-byte-weight`), and `is-on-https` for `https://` targets
- Reports: `archlucid-ui/.lighthouseci-acceptance/` — do not commit authenticated dumps with PII

### Automating what you used to do by hand (M-100, M-104, M-105)

| Manual habit | Automate into |
|--------------|---------------|
| Re-clicking the same buyer path every release | `@founder` / `@critical` Playwright |
| Opening DevTools for console / failed network | Playwright listeners + fail-on-unexpected (M-104) |
| Spot-checking a11y on key pages | axe on founder routes against chosen URL (M-105) |
| “Does Lighthouse look bad on staging?” | Remote LHCI against `ACCEPTANCE_BASE_URL` (M-99) |
| Finding UX confusion | Stay in lane 3; if the fix is a **deterministic** check, promote to M-100 |

**Rule:** every time you catch a defect twice by hand, file it as a tagged test before the next beta.

## Lane 3 — unscripted customer-like use (M-102 — shipped) {#lane-3--unscripted-customer-like-use-m-102--shipped}

Former standalone body (with **M-100**): `docs/go-to-market/FOUNDER_UI_ABSORPTION_AND_EXPLORATORY.md` → this lane + [Absorption process](#absorption-process-m-100--shipped) (filename kept as a path-stable alias).

**Path-stable alias:** [`FOUNDER_UI_ABSORPTION_AND_EXPLORATORY.md`](../go-to-market/FOUNDER_UI_ABSORPTION_AND_EXPLORATORY.md).  
**Owner execution:** **G-QA-03** (run exploratory; promote defects), **G-QA-02** (pre-beta checklist).

### When {#m-102-unscripted-exploratory-cadence}

After **lane 2** tools pass against the chosen site (founder Playwright + console/network + axe; Lighthouse when relevant):

1. Before each **controlled beta** cut (**G-QA-02** / **M-106**).
2. After a **meaningful IA or buyer-path** change (shorter 10–15 min OK).

### Timebox

| Phase | Minutes | Trend |
|-------|---------|--------|
| Default | **15–30** | Shrink toward **15** as **M-100** absorbs click-paths |
| Floor | **10** | Never zero — judgment / embarrassment checks stay human |
| Cap | **45** | Stop; log remaining ideas as defects, do not turn into an all-day QA session |

### Script (questions only — no click checklist)

Use the product as a **first-time buyer / sponsor**, not as the person who built it:

1. Can I tell what to do next?
2. Can I find a feature without remembering its route?
3. Does terminology stay consistent?
4. Am I sent between disconnected experiences?
5. Do loading states explain what is happening?
6. Can I recover from mistakes?
7. Does anything look technically or commercially embarrassing?
8. Would I feel comfortable demonstrating this screen to a buyer?

Optional companions (do not replace this session): `lucid-ui-audit` skill, UX-audit screenshot jobs.

### Exit

- Log accepted defects (template below / **M-101**).
- Any deterministic “page broken / click-path” item caught **twice** → file under **M-100** before the next cut (**G-QA-03**).
- Judgment-only findings may remain accepted with an explicit note — never silent.

Owner cadence: **G-QA-03**.

## Absorption process (M-100 — shipped) {#absorption-process-m-100--shipped}

Institutionalizes gradual manual → automated absorption so manual regression shrinks without losing judgment. Alias: [`FOUNDER_UI_ABSORPTION_AND_EXPLORATORY.md`](../go-to-market/FOUNDER_UI_ABSORPTION_AND_EXPLORATORY.md).

### Rule of two {#m-100-gradual-manual--automated-absorption}

Any **click-path** or **“is this page broken?”** check the founder (or reviewer) performs **twice** across controlled betas becomes a tagged Playwright test before the next controlled cut:

| Catch | Promote to |
|-------|------------|
| Same route fails / blank / wrong heading twice | `@founder` (and `@critical` if it would block a beta demo) |
| Buyer first-session step | `@founder` + `@buyer-journey` |
| Post-deploy marketing / showcase smoke | `@founder` + `@release-smoke` |
| Unexpected console / failed XHR | Prefer extending `e2e/founder-console-network.spec.ts` allowlist **only** for benign noise; otherwise fix product or add an assertion |
| A11y regression on a founder route | Prefer `e2e/founder-a11y.spec.ts` / shared `founder-acceptance-routes.ts` |

Prefer **tagging an existing** live/mock spec over inventing a parallel suite. Shared routes: `archlucid-ui/e2e/helpers/founder-acceptance-routes.ts`.

### How to absorb (engineering checklist)

1. Reproduce once against `ACCEPTANCE_BASE_URL` (or local loopback).
2. Add or tag a test (`{ tag: ["@founder", …] }` on the `test.describe`).
3. Run locally: `npm run test:e2e:founder` (or the file) against the same URL.
4. Retire the matching row from the manual checklist / defect log (mark **Automated** + link the spec path).
5. Optionally bump the suite-growth ledger below.

Do **not** absorb pure UX judgment (“wording feels off”, “would I demo this?”) — that stays in **M-102**.

### Suite growth ledger

Baseline after **M-96–M-98** / **M-104–M-105** (2026-07-28): ~**47** `@founder` tests across ~**27** files (`npx playwright test -c playwright.founder.config.ts --grep @founder --list`).

| Date | `@founder` tests (approx) | Notes |
|------|---------------------------|--------|
| 2026-07-28 | 47 | Initial tagged suite + founder console/a11y specs |
| _next cut_ | | After absorbing defects from **G-QA-03** / **M-106** |

Update one row per controlled beta (or when a batch of promotions lands).

### Defect log → promotion template

Copy into deal notes, a scratch pad, or append under [`PRODUCTION_DEFECT_LOG.md`](../library/PRODUCTION_DEFECT_LOG.md) when production-facing:

```markdown
### Founder UI defect — YYYY-MM-DD

- **Surface / URL:**
- **Symptom:**
- **Seen before?** (first time / second+ → absorb)
- **Severity:** blocks demo / buyer confusion / cosmetic
- **Disposition:** fix now / accept for this cut / automate (**M-100**)
- **Automation:** spec path + tags (when done)
```

### Related commands (absorption / exploratory)

```bash
cd archlucid-ui
ACCEPTANCE_BASE_URL=https://your-host.example ACCEPTANCE_SKIP_LIVE_INFRA=1 FOUNDER_PUBLIC_ONLY=1 \
  npm run test:e2e:founder:release-smoke
ACCEPTANCE_BASE_URL=https://your-host.example npm run lighthouse:acceptance
```

Scheduled warn-only CI: [`.github/workflows/founder-ui-acceptance.yml`](../../.github/workflows/founder-ui-acceptance.yml) (**M-103**).

## Scheduled founder CI (M-103 — shipped)

Warn-only workflow: [`.github/workflows/founder-ui-acceptance.yml`](../../.github/workflows/founder-ui-acceptance.yml).

| Setting | Role |
|---------|------|
| `ARCHLUCID_FOUNDER_ACCEPTANCE_ENABLED=true` | Required for the **schedule** |
| `ARCHLUCID_STAGING_UI_BASE_URL` (or `ARCHLUCID_STAGING_BASE_URL`) | Target UI origin |
| `workflow_dispatch` | Manual run; optional Lighthouse |
| Merge / PR | **Not** blocked — failures annotate + upload artifacts only |

Scheduled job runs **public** `@release-smoke` + founder console/network + axe (`FOUNDER_PUBLIC_ONLY=1`). Full authenticated `@founder` remains local until **G-QA-01** wires secrets.

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
4. Console / network automation clean on founder routes (`npm run test:e2e:founder:console-network`).
5. One personal end-to-end review + one first-time-user journey (lane 3 / **M-102**).
6. Accepted defects documented; no silent “we’ll live with it.” Absorb twice-seen click-paths (**M-100**).
```

Optional: confirm warn-only [`founder-ui-acceptance.yml`](../../.github/workflows/founder-ui-acceptance.yml) is green or reviewed if enabled (**M-103**).

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
| **M-96** | Target-site harness (`ACCEPTANCE_BASE_URL`, auth, docs) — **Done** |
| **M-97** | Tag `@founder` / `@critical` / `@buyer-journey` / `@release-smoke` suite — **Done** |
| **M-98** | npm scripts: founder / headed / ui against chosen URL — **Done** |
| **M-99** | Remote Lighthouse against chosen URL (auth + median) — **Done** |
| **M-100** | Gradual absorption: convert manual regression into tagged tests — **Done** |
| **M-101** | Controlled-beta acceptance checklist + defect log template |
| **M-102** | Unscripted exploratory cadence (owner-executed) — **Done** |
| **M-103** | Optional scheduled/pre-release CI job for founder suite on staging — **Done** |
| **M-104** | Console + failed-network automation on founder routes — **Done** |
| **M-105** | axe a11y on founder routes against chosen URL — **Done** |
| **M-106** | First full dry-run; baseline manual minutes; prove shrinkage |
| **G-QA-01** | Owner: pick default `ACCEPTANCE_BASE_URL` + auth method |
| **G-QA-02** | Owner: run pre-beta checklist each controlled cut |
| **G-QA-03** | Owner: exploratory session + promote defects into M-100 |

## Related

| Doc | Role |
|-----|------|
| [`#absorption-process-m-100--shipped`](#absorption-process-m-100--shipped) · [`#lane-3--unscripted-customer-like-use-m-102--shipped`](#lane-3--unscripted-customer-like-use-m-102--shipped) · [`FOUNDER_UI_ABSORPTION_AND_EXPLORATORY.md`](../go-to-market/FOUNDER_UI_ABSORPTION_AND_EXPLORATORY.md) (alias) | **M-100** / **M-102** process |
| [`TEST_EXECUTION_MODEL.md`](../library/TEST_EXECUTION_MODEL.md) | Automated test tiers / CI jobs |
| [`LIVE_E2E_HAPPY_PATH.md`](../library/LIVE_E2E_HAPPY_PATH.md) | Live Playwright happy-path gate |
| [`UI_LIGHTHOUSE_CI.md`](UI_LIGHTHOUSE_CI.md) | Lab Lighthouse CI (mock-backed) |
| [`FIELD_WEB_VITALS_TRIAGE.md`](../runbooks/FIELD_WEB_VITALS_TRIAGE.md) | **TB-2031** / **M-112** field CWV → backlog mapping (**G-QA-06** / **G-QA-07**) |
| [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) | **M-96–M-106**, **G-QA-*** |
