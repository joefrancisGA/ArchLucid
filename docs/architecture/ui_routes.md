> **Scope:** Canonical catalog of every Next.js App Router page in `archlucid-ui`, with practical steps to reach a populated (or reasonably evaluable) screen.

# ArchLucid UI routes

**App root:** `archlucid-ui/src/app/`  
**Route count:** 142 `page.tsx` files (verified by `scripts/ci/assert_archlucid_ui_app_router_unique_paths.py`).

**Route groups** — folders named `(marketing)`, `(operator)`, or `(sponsor)` — **do not** appear in the URL. Two pages under different groups that resolve to the same path will fail `next build`.

Dynamic segments are written as `[param]` below.

---

## Setup tiers

Pick one tier before walking routes. Tiers are ordered from fastest (UI-only) to fullest (SQL + admin).

### Tier 1 — UI-only static demo (no SQL)

Best for review workflow, graph, compare, governance mock tiles, and buyer-polished architect workspace.

```powershell
cd archlucid-ui
npm run demo
```

Opens **http://localhost:3001** with:

- `NEXT_PUBLIC_DEMO_MODE=1`
- `NEXT_PUBLIC_DEMO_STATIC_OPERATOR=1`
- `NEXT_PUBLIC_DEMO_ALLOW_COMPARE_ROUTE=1`
- `NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED=1`

When the API is absent or errors, the UI serves the **Claims Intake** static payload (`archlucid-ui/src/lib/showcase-static-demo.ts`, `operator-static-demo.ts`).

### Tier 2 — Full SQL-backed demo (real API data)

Best for live pipeline, Contoso compare pair, governance rows, audit, and admin surfaces.

From the repository root:

```powershell
.\scripts\demo-start.ps1
```

- **UI:** http://localhost:3000  
- **API:** http://localhost:5000  
- Contoso + demo workspace seed on startup (`docker-compose.demo.yml`)

See also [DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md) and [DEMO_WORKSPACES.md](../go-to-market/DEMO_WORKSPACES.md).

### Tier 3 — Mock API harness (widest route coverage)

Best when you need **every operator route** populated without hand-seeding each surface.

```powershell
cd archlucid-ui
npm run build
npm run screenshots:all:prebuilt
```

Playwright starts the UI plus a loopback mock API (`playwright.mock.config.ts`, port **18765**). PNGs land under `archlucid-ui/public/screenshots/all-routes/` (generated locally, not committed).

To browse interactively, run `e2e/start-e2e-with-mock.ts` (see `playwright.mock.config.ts`) and open the printed base URL (default **http://127.0.0.1:3000**).

**Unlock routes blocked in strict buyer demo** (admin, settings, compare): Tier 3 sets `NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES=1`. For manual Tier 1 browsing, unset demo flags or set that variable.

**Full dense operator nav + admin:** run the API with **DevelopmentBypass Admin**, set `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`, and **unset** `NEXT_PUBLIC_DEMO_MODE` / `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`.

---

## Canonical deep links

### Tier 1 — Claims Intake static spine

| What | URL |
|------|-----|
| Review package | `/architecture/reviews/claims-intake-modernization` |
| Signed review record | `/governance/signed-records/a1c2e3f4-a5b6-7890-abcd-ef1234567890` |
| Finding | `/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk` |
| Finding inspect | `/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect` |
| Provenance | `/architecture/reviews/claims-intake-modernization/provenance` |
| Compare | `/compare?priorRunId=claims-intake-run-v1&laterRunId=claims-intake-run-v2` |
| Graph | `/graph?runId=claims-intake-modernization` (then click **Load graph**) |
| Ask | `/ask` or `/ask?runId=claims-intake-modernization` |
| Sponsor review | `/architecture/reviews/claims-intake-modernization` |
| Policy pack detail | `/governance/policy-packs/healthcare-claims-v3-pack` |
| Approval lineage | `/governance/approval-requests/claims-intake-approval-001/lineage` |
| Planning plan | `/planning/plans/claims-intake-modernization-plan` |
| Public showcase | `/showcase/claims-intake-modernization` |

**Frictionless trial:** `/try` enables a browser-only session and lands on `/architecture/reviews/claims-intake-modernization`.

Constants live in `archlucid-ui/src/lib/showcase-static-demo.ts` and `archlucid-ui/e2e/fixtures/ids.ts`.

### Tier 2 — SQL seed identifiers

| Story | Run ID | Example URL |
|-------|--------|---------------|
| Contoso baseline | `6e8c4a102b1f4c9a9d3e10b2a4f0c501` | `/architecture/reviews/6e8c4a102b1f4c9a9d3e10b2a4f0c501` |
| Contoso hardened | `6e8c4a102b1f4c9a9d3e10b2a4f0c502` | `/architecture/reviews/6e8c4a102b1f4c9a9d3e10b2a4f0c502` |
| Compare pair | both above | `/compare?leftRunId=6e8c4a102b1f4c9a9d3e10b2a4f0c501&rightRunId=6e8c4a102b1f4c9a9d3e10b2a4f0c502` |
| Workspace A (product tour) | `b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` | `/architecture/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| Workspace B (regulated) | `61c60d76-2b80-93f9-46bb-2f66fd608b9b` | `/architecture/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` |

**Reviews list:** `/architecture/reviews?projectId=default` after seed completes.

**New review with live pipeline:** `/architecture/reviews/new` → leave defaults → **Submit** (simulator agents). See [FIRST_30_MINUTES.md](../engineering/FIRST_30_MINUTES.md).

---

## Legacy URL handling (IA batch 4–8)

`archlucid-ui/next.config.ts` ships **no permanent bookmark redirects** (IA batch 4). Orientation helpers (`canonicalizeLegacyOperatorRoutePath`) and help link rewriting map retired prefixes for in-app navigation; bookmarks that are not updated **404**.

**Retired bookmarks** (404 unless noted — use canonical paths):

| Path | Canonical |
|------|-----------|
| `/architecture/reviews/*/signed-record` | `/architecture/reviews/*` or `/governance/signed-records/{manifestId}` when manifest id is known |
| `/digests`, `/digest-subscriptions` | `/architecture/digests` (+ `?tab=subscriptions`) |
| `/governance/risk-exceptions`, `/governance/risk-exceptions/*` | `/governance/exceptions` |
| `/settings/roles` | `/administration/users?tab=roles` |
| `/reviews`, `/reviews/*`, `/runs`, `/runs/*` | `/architecture/reviews/*` (help/orientation only — direct navigation 404) |
| `/demo` | `/architecture/reviews/claims-intake-modernization?ctoDemoTour=1` (help/orientation only) |
| `/architectures`, `/architectures/*` | `/architecture/architectures/*` (help/orientation only) |
| `/dashboard`, `/sponsor/dashboard`, `/portfolio` | `/architecture/sponsor-dashboard` |
| `/audit`, `/policy-packs/*`, `/alerts`, `/alert-rules/*` | `/governance/*` |
| `/signed-records`, `/signed-records/*` | `/governance/signed-records/*` |
| `/manifests`, `/manifests/*` | `/governance/signed-records/*` |
| `/value-report`, `/value-report/pilot`, `/value-report/roi` | `/sponsor-report/*` |
| `/administration/settings`, `/admin/users`, `/workspace/security-trust`, `/admin/support` | `/administration/*` |
| `/settings/cloud-connections` | `/integrations/cloud-connections` |

**Note:** Run-scoped `/architecture/reviews/[runId]/artifacts/[artifactId]` (**RER**) is **retired** — no App Router page (old bookmarks 404). Artifact Preview hrefs emit **GAR** only (`/governance/signed-records/[manifestId]/artifacts/[artifactId]`).

---

## Route catalog

Columns:

- **Purpose** — what the screen is for  
- **How to view** — fastest path to a reasonable populated screen (`T1` = Tier 1, `T2` = Tier 2, `T3` = Tier 3 mock harness)

### Marketing and public

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/accessibility` | WCAG 2.1 AA self-attestation, tooling, reporting | Open directly |
| `/compliance-journey` | Honest security/compliance journey | Open directly |
| `/demo/preview` | Live finalized-manifest preview from demo seed | Open directly; optional API |
| `/example-roi-bulletin` | Synthetic aggregate ROI bulletin example | Open directly |
| `/faq` | Product FAQ | Open directly |
| `/get-started` | First-30-minutes guided path | Open directly |
| `/live-demo` | Read-only sample bundle walkthrough | Open directly |
| `/pricing` | Packaging and pricing overview | Open directly |
| `/privacy` | Privacy policy | Open directly |
| `/quick-scan` | Quick scan marketing entry | Open directly |
| `/quick-start` | Deprecated alias | App Router shim permanently redirects to `/get-started` (query preserved; canonical UX on **GXX**) |
| `/security-trust` | Public Security & Trust (metadata only) | Open directly |
| `/see-it` | “See it in 30 seconds” pitch | Open directly |
| `/showcase/[runId]` | Public completed review showcase | T1: `/showcase/claims-intake-modernization`. QuickNav deep-links into `/architecture/reviews/*` when demo static fallback is active; otherwise sign-in CTA (`showcase-quick-nav-contract.ts`). |
| `/signup` | Self-service trial signup | Open directly; submit needs backend |
| `/signup/verify` | Email verification | Layout only unless signup completed |
| `/trust` | Trust Center | Open directly |
| `/try` | Frictionless trial launcher | Opens `/architecture/reviews/claims-intake-modernization` |
| `/welcome` | Welcome / product overview | Open directly |
| `/why` | Why ArchLucid buyer narrative | Open directly |

### Authentication

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/auth/signin` | Start OIDC/JWT sign-in | Set `NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt` + IdP; dev-bypass shows notice on home otherwise |
| `/auth/callback` | OAuth redirect handler | Only during real OIDC flow |
| `/login` | Legacy shim | Redirects to `/auth/signin`; `reason=idle-timeout` → `/auth/session-expired` (canonical sign-in UX on **ASI**) |

### Architect home and core workflow

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/` | Architect home — checklist and quick links | T1 or T2 |
| `/architecture/sponsor-dashboard` | Portfolio overview / sponsor ROI dashboard (**ARE**) | T1 static tiles; T2 after seed; PageContextualHelp → sponsor-summary |
| `/dashboard` | Retired bookmark | 404 — use `/architecture/sponsor-dashboard` |
| `/architecture/reviews` | List architecture packages | T2: `?projectId=default`; T1: static paged list |
| `/architecture/reviews/new` | New architecture review wizard | T2: submit default run; T1: wizard UI (submit needs API) |
| `/architecture/reviews/[runId]` | Architecture package detail | T1: `claims-intake-modernization`; T2: seed GUIDs above |
| `/architecture/reviews/[runId]/provenance` | Evidence provenance diagram | Append to populated review URL |
| `/architecture/reviews/[runId]/findings/[findingId]` | Finding detail | T1: `…/findings/phi-minimization-risk` |
| `/architecture/reviews/[runId]/findings/[findingId]/inspect` | Finding evidence trace inspect | Same finding + `/inspect` |
| `/governance/signed-records/[manifestId]` | Signed review record summary, artifacts, bundle | T1: `a1c2e3f4-a5b6-7890-abcd-ef1234567890` |
| `/graph` | Deprecated alias | Retired pre-release bookmark — no App Router page or redirect; canonical UX on **INE** (`/insights/evidence-graph`) |
| `/insights/evidence-graph` | Evidence graph (trace table + interactive graph) | T1: `?runId=claims-intake-modernization` → **Load graph**; deep links via `runId` + `graphNodeId` (**INE**) |
| `/onboarding` | In-product onboarding | T1/T2; T2 may show `trialSampleRunId` from API |
| `/architecture/first-review-guide` | First review guide (onboarding checklist) | Trial card when `?source=registration`; core walkthrough wizard (**ARF**); legacy `/onboarding` retired (no redirect) |
| `/onboarding/start` | Deprecated alias | Legacy bookmark — canonical UX on **ARF** (`/architecture/first-review-guide`; query preserved when redirect shim exists) |
| `/onboard` | Deprecated alias | Legacy bookmark — canonical UX on **ARF** (`/architecture/first-review-guide`; query preserved when redirect shim exists) |
| `/getting-started` | Deprecated alias | App Router shim permanently redirects to `/onboarding` (query preserved) |
| `/help` | In-app help index | Open directly |
| `/help/first-architecture-review` | Your first architecture review (specialty guide) | `HelpCorePilotGuideView` with stepper + gated finalize CTAs (**COR**) |
| `/help/[topic]` | Rendered help topic | e.g. `/help/getting-started`, `/help/billing-and-plans` (specialty `HelpBillingAndPlansGuideView`, **HBX**), `/help/sponsor-summary` (specialty `HelpExecutiveSummaryGuideView`, **EXE**), `/help/findings` (specialty `HelpFindingsGuideView`, **HFX**), `/help/governance-approval` (specialty `HelpGovernanceApprovalGuideView`, **GO**), `/help/path-chooser` (buyer markdown chooser, **HPX**), `/help/engineering-troubleshooting` (Admin-gated internal-runbook, **HDX**), `/help/api-contracts` (Admin-gated API contracts reference, **HG**), `/help/alerts`, `/help/digests` (specialty `HelpDigestsGuideView`, **HDG**; slugs in `product-documentation-registry.ts`) |
| `/demo` | CTO demo tour entry | CTO demo pack env; else redirects `/` |
| `/demo/explain` | Internal demo explanation | T2: `GET /v1/demo/explain`; T3 mock; blocked in strict T1 |
| `/snapshot/[runId]` | Hard-retired | Former App Router redirect to `/architecture/reviews/{runId}?readOnly=1` — no page or redirect (use canonical review workspace leave-behind) |
| `/403` | Unauthorized (no recognized app role) | Hard to hit under dev-bypass |
| `/why-archlucid` | Internal proof (live instrumentation) | T2 Docker seed; hidden in buyer-polished demo |

### Operate · analysis

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/compare` | Compare two finalized reviews | T1 compare URL; T2 Contoso pair |
| `/insights/evidence-graph` | Evidence graph — provenance trail for one review | T1: `?runId=claims-intake-modernization`; table + graph tabs (**INE**) |
| `/ask` | Ask questions about a review | T1: `/ask`; T2: `/ask?runId=<seeded-run>` |
| `/search` | Search review evidence | T1/T3: `/search` + run `claims-intake-modernization` |

Query keys for compare: `priorRunId`/`laterRunId` (buyer) or `leftRunId`/`rightRunId` (technical) — see `compare-url-query-params.ts`.

### Operate · governance

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/governance/advisory-scans` | Advisory scans hub (Scans + Schedules tabs) | T3 mock or T2 API; blocked in strict T1 nav; **AD** = `?tab=schedules`, **ADS** = default Scans tab |
| `/governance/findings` | Architecture risk register | T1 static; T2: `?runId=<seeded-run>` for review context |
| `/governance/exceptions` | Risk exceptions / waivers | T3 mock or T2 seed |
| `/governance/policy-packs` | Policy pack inventory and detail | T1: `healthcare-claims-v3-pack` |
| `/governance/standards-and-rules` | Effective policy stack (read-only) | T1/T3 |
| `/governance/approval-queue` | Approval queue / governance workflow (submit → promote) | T1 static; T2 with governance seed; bare `/governance` is not a page |
| `/governance/approval-requests/[id]/lineage` | Approval request lineage | T1: `claims-intake-approval-001` |
| `/governance/audit` | Tenant audit trail | T1 static events; T2 seeded audit |
| `/governance/alerts` | Alerts hub (inbox + tabs) | T1 inbox; tabs: `?tab=rules`, `routing`, `composite`, `simulation` |
| `/governance/alert-rules` | Alert rules configuration | Same as `/governance/alerts?tab=rules` |
| `/governance/decision-register` | Decision register | T1/T3 |
| `/governance/dashboard` | Sponsor Workspace Health | T1/T3 tiles |
| `/governance/setup` | Governance setup guide | T1 deep links (read-only) |
| `/governance/recurrence-schedules` | Recurrence schedules | T3 mock or T2 |
| `/insights/sponsor-summary` | Sponsor value DOCX export | T2 finalized reviews + Execute role |
| `/administration/security-trust` | Operator Security & Trust | T1/T2; distinct from public `/security-trust` |

Layer guidance copy for many governance/analysis routes: `archlucid-ui/src/lib/layer-guidance.ts`. Sidebar source of truth: `archlucid-ui/src/lib/nav-config.ts` and `archlucid-ui/docs/NAV_CONFIG_CONTRACT.md`.

### Operate · operations and value

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/insights/architecture-scorecard` | Review scorecard | T1 showcase context; T3 mock |
| `/recommendation-learning` | Recommendation tuning | T3 mock; blocked in strict demo |
| `/internal/product-learning` | Pilot feedback capture | T3 mock |
| `/administration/connection-status` | Connection status (connector readiness hub) | Administration nav; `ConnectorOperationsDashboard` + contextual help. T3 mock or T2 |
| `/integrations/teams` | Microsoft Teams wiring | T3 mock |
| `/administration/system-health` | System health dashboard | Live/ready checks, build identity, buyer-polished demo variant; contextual help → troubleshooting (**ADY**) |
| `/internal/validate-route` | Replay authority chain | `/internal/validate-route?runId=claims-intake-modernization`; T2 for real replay |
| `/planning` | Planning hub | T1/T3 |
| `/planning/plans/[planId]` | Plan detail | T1: `claims-intake-modernization-plan` |
| `/insights/impact-preview` | Impact preview | T3 mock |
| `/insights/pilot-outcomes` | Sponsor proof snapshot (no DOCX) | T1/T2 after finalized architecture package |
| `/insights/roi-summary` | ROI / hours summary | T1 illustrative; T2 with seed |
| `/architecture/digests` | Digests hub (Browse + Subscriptions + Schedule) | T3 mock; Schedule tab (**DIS**) hosts ExecDigestScheduleContent |
| `/architecture/digests?tab=schedule` | Sponsor digest schedule | ExecDigestScheduleContent; preferences via `/v1/tenant/exec-digest-preferences` (**DIS**) |
| `/digests` | Legacy rewrite alias | Internal rewrite to `/architecture/digests` |
| `/settings/exec-digest` | Retired pre-release bookmark | No redirect or App Router page; canonical schedule on **DIS** (`/architecture/digests?tab=schedule`, TB-1901–TB-1905); former traffic row **EEX** removed |
| `/digest-subscriptions` | Legacy rewrite alias | Internal rewrite to `/architecture/digests?tab=subscriptions` |
| `/patterns` | Architecture pattern library | T3 mock or API if seeded |
| `/portfolio` | Retired — redirects to `/architecture/sponsor-dashboard` | Legacy bookmark only |
| `/operate/architecture-graph` | Legacy Operate shim | App Router redirect to `/insights/evidence-graph` (query preserved; canonical UX on **INE**) |
| `/architecture/architecture-intelligence` | Closed-loop architecture reasoning lab | Execute role; deep-link with `?runId=` from reviews/findings. Golden fixture + publish round trip. |
| `/internal/failed-integration-messages` | Integration event DLQ | Full architect workspace + Admin + T2 API |

### Sponsor route group

Lighter chrome than the full architect workspace; `(sponsor)` route group does not appear in the URL.

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/sponsor/dashboard` | Retired bookmark | 404 — use `/architecture/sponsor-dashboard` |
| `/sponsor/reviews`, `/sponsor/reviews/*` | Retired bookmark | 404 — use `/architecture/reviews/*` |
| `/sponsor/scorecard` | Sponsor scorecard | T1/T3 with showcase run |

### Settings

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/administration` | Settings hub — searchable tenant-administration index; sidebar "Settings" target (IA-016 hub-first). Personal settings are **not** here; they ship in the top-bar account menu | Layout OK T1; blocked in strict demo — T3 bypass or full architect workspace |
| `/administration/settings` | Retired bookmark | 404 — use `/administration` |
| `/administration/billing` | Billing and plans | Admin + full architect workspace + API |
| `/administration/identity-providers` | Identity provider config | Admin + API |
| `/administration/identity/sso-wizard` | SSO setup wizard | Admin + API |
| `/administration/api-keys` | API key management | Admin + API |
| `/administration/scim-provisioning` | SCIM provisioning | Admin + API |
| `/settings/cloud-connections` | Cloud connections | Admin + API |
| `/administration/tenant` | Workspace settings — trial, cost settings, request scope. `AdminAuthority`; non-admin callers get `TenantSettingsRestrictedState` | Admin + API |
| `/administration/tenant/recycle-bin` | Tenant recycle bin | Admin + API |
| `/administration/preferences` | Personal appearance and preferences. Ungated (writes only the caller's own record); reached from the top-bar account menu | Any signed-in user |
| `/administration/account-security` | Personal sign-in methods, linking, removal. Ungated; reached from the top-bar account menu | Any signed-in user |
| `/settings/cost-reporting` | Cost reporting | Admin + API |
| `/settings/webhooks` | Webhooks | Admin + API |
| `/settings/roles` | Role assignment | Admin + API |
| `/administration/baseline` | ROI baseline config | T3 mock |
| `/administration/extract-upload` | Extract/upload config | Allowed in CTO demo (`DEMO_ALLOWED_SETTINGS_PATHS`) |
### Admin

Requires **Admin authority**, full architect workspace, no demo nav blockers, and Tier 2 API (or Tier 3 mock with E2E bypass).

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/internal/health` | Admin health / diagnostics | T2 + Admin; T3 screenshot harness |
| `/internal/configuration` | Effective configuration snapshot | Same |
| `/internal/pricing-quote-aging` | Pricing quote SLA dashboard | Same |
| `/internal/trial-funnel` | Trial funnel operations | Same |
| `/internal/fleet-llm-cogs` | Fleet LLM COGS visibility | AdminAuthority + System Admin nav; per-tenant UTC-month COGS pressure table (**AFX**) |
| `/internal/tenant-health` | Per-tenant health admin | Same |
| `/internal/tenants` | Provision / shut off tenants | Same |
| `/internal/rag-health` | RAG / retrieval health | Same |
| `/admin/support` | Admin support tools | Same |
| `/internal/evidence-proposals` | Evidence proposal admin | Same |
| `/admin/users` | User administration | Same |

---

## Quick evaluation cheat sheet

| Goal | Fastest path |
|------|----------------|
| Architecture package with findings, manifest, artifacts | T1 → `/architecture/reviews/claims-intake-modernization` |
| Side-by-side compare | T1 → `/compare?priorRunId=claims-intake-run-v1&laterRunId=claims-intake-run-v2` |
| Evidence graph | T1 → `/graph?runId=claims-intake-modernization` + **Load graph** |
| Governance, audit, alerts | T1 static or T3 mock harness |
| Real pipeline + SQL truth | T2 `.\scripts\demo-start.ps1` |
| Every route for design review | T3 `npm run screenshots:all:prebuilt` |
| Admin / settings dense UI | Full architect workspace + Admin + T2 API |
| Marketing surfaces only | Open URLs directly (no setup) |

---

## Maintenance

When adding or moving a route:

1. Add `page.tsx` under a **unique** URL path (run `python scripts/ci/assert_archlucid_ui_app_router_unique_paths.py` from repo root).
2. If the route appears in the architect workspace, update `nav-config.ts` and follow the drift guard in `docs/library/PRODUCT_PACKAGING.md` §3.
3. Update this document and, if applicable, `archlucid-ui/e2e/capture-all-screenshots.spec.ts` `HREFS`.

**Related docs:**

- [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) — five-category content taxonomy for `/help`, contextual help, marketing, and trust surfaces
- [archlucid-ui/README.md](../../archlucid-ui/README.md) — run commands and legacy route table  
- [NAV_CONFIG_CONTRACT.md](../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md) — sidebar and authority contract  
- [DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md) — Docker demo stack  
- [DEMO_WORKSPACES.md](../go-to-market/DEMO_WORKSPACES.md) — Workspace A/B stable GUIDs  
- [DEMO_QUICKSTART.md#screenshot-capture-brief](../go-to-market/DEMO_QUICKSTART.md#screenshot-capture-brief) — capture brief for marketing PNGs  
