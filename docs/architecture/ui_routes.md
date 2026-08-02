> **Scope:** Canonical catalog of every Next.js App Router page in `archlucid-ui`, with practical steps to reach a populated (or reasonably evaluable) screen.

# ArchLucid UI routes

**App root:** `archlucid-ui/src/app/`  
**Route count:** 142 `page.tsx` files (verified by `scripts/ci/assert_archlucid_ui_app_router_unique_paths.py`).

**Route groups** — folders named `(marketing)`, `(operator)`, or `(executive)` — **do not** appear in the URL. Two pages under different groups that resolve to the same path will fail `next build`.

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
| Review package | `/reviews/claims-intake-modernization` |
| Friendly manifest URL | `/reviews/claims-intake-modernization/manifest` |
| Manifest (UUID) | `/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890` |
| Finding | `/reviews/claims-intake-modernization/findings/phi-minimization-risk` |
| Finding inspect | `/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect` |
| Provenance | `/reviews/claims-intake-modernization/provenance` |
| Compare | `/compare?priorRunId=claims-intake-run-v1&laterRunId=claims-intake-run-v2` |
| Graph | `/graph?runId=claims-intake-modernization` (then click **Load graph**) |
| Ask | `/ask` or `/ask?runId=claims-intake-modernization` |
| Executive review | `/reviews/claims-intake-modernization` |
| Policy pack detail | `/governance/policy-packs/healthcare-claims-v3-pack` |
| Approval lineage | `/governance/approval-requests/claims-intake-approval-001/lineage` |
| Planning plan | `/planning/plans/claims-intake-modernization-plan` |
| Public showcase | `/showcase/claims-intake-modernization` |

**Frictionless trial:** `/try` enables a browser-only session and lands on `/reviews/claims-intake-modernization`.

Constants live in `archlucid-ui/src/lib/showcase-static-demo.ts` and `archlucid-ui/e2e/fixtures/ids.ts`.

### Tier 2 — SQL seed identifiers

| Story | Run ID | Example URL |
|-------|--------|---------------|
| Contoso baseline | `6e8c4a102b1f4c9a9d3e10b2a4f0c501` | `/reviews/6e8c4a102b1f4c9a9d3e10b2a4f0c501` |
| Contoso hardened | `6e8c4a102b1f4c9a9d3e10b2a4f0c502` | `/reviews/6e8c4a102b1f4c9a9d3e10b2a4f0c502` |
| Compare pair | both above | `/compare?leftRunId=6e8c4a102b1f4c9a9d3e10b2a4f0c501&rightRunId=6e8c4a102b1f4c9a9d3e10b2a4f0c502` |
| Workspace A (product tour) | `b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` | `/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| Workspace B (regulated) | `61c60d76-2b80-93f9-46bb-2f66fd608b9b` | `/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` |

**Reviews list:** `/reviews?projectId=default` after seed completes.

**New review with live pipeline:** `/reviews/new` → leave defaults → **Submit** (simulator agents). See [FIRST_30_MINUTES.md](../engineering/FIRST_30_MINUTES.md).

---

## Legacy URL redirects

Configured in `archlucid-ui/next.config.ts`:

| Source | Destination |
|--------|-------------|
| `/runs`, `/runs/*` | `/reviews`, `/reviews/*` (301) |
| `/alert-rules` | `/alerts?tab=rules` |
| `/alert-routing` | `/alerts?tab=routing` |
| `/composite-alert-rules` | `/alerts?tab=composite` |
| `/alert-simulation`, `/alert-tuning` | `/alerts?tab=simulation` |
| `/login` | `/auth/signin` or `/auth/session-expired` when `reason=idle-timeout` (App Router shim; query preserved) |
| `/onboard`, `/getting-started` | `/onboarding` (page redirect) |
| `/quick-start`, `/quick-start/*` | `/get-started` (301; App Router shim preserves query) |
| `/portfolio` | `/architecture/executive-dashboard` (301) |
| `/dashboard` | `/architecture/executive-dashboard` (301) |
| `/executive/dashboard` | `/architecture/executive-dashboard` (301) |
| `/executive/reviews`, `/executive/reviews/*` | `/reviews`, `/reviews/*` (301) |

**Note:** README and older docs may reference `/manifests/[manifestId]/artifacts/[artifactId]`; that route no longer has a `page.tsx`. Artifact review is reached from review or manifest detail.

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
| `/security-trust` | Public Security & trust (metadata only) | Open directly |
| `/see-it` | “See it in 30 seconds” pitch | Open directly |
| `/showcase/[runId]` | Public completed review showcase | T1: `/showcase/claims-intake-modernization`. QuickNav deep-links into `/reviews/*` only when demo static fallback is active; otherwise sign-in CTA (`showcase-quick-nav-contract.ts`). |
| `/signup` | Self-service trial signup | Open directly; submit needs backend |
| `/signup/verify` | Email verification | Layout only unless signup completed |
| `/trust` | Trust Center | Open directly |
| `/try` | Frictionless trial launcher | Opens `/reviews/claims-intake-modernization` |
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
| `/architecture/executive-dashboard` | Portfolio overview / executive ROI dashboard (**ARE**) | T1 static tiles; T2 after seed; PageContextualHelp → executive-summary |
| `/dashboard` | Retired — redirects to `/architecture/executive-dashboard` | Legacy bookmark (**DSH**) |
| `/reviews` | List architecture packages | T2: `/reviews?projectId=default`; T1: static paged list |
| `/reviews/new` | New architecture review wizard | T2: submit default run; T1: wizard UI (submit needs API) |
| `/reviews/[runId]` | Architecture package detail | T1: `claims-intake-modernization`; T2: seed GUIDs above |
| `/reviews/[runId]/provenance` | Evidence provenance diagram | Append to populated review URL |
| `/reviews/[runId]/findings/[findingId]` | Finding detail | T1: `…/findings/phi-minimization-risk` |
| `/reviews/[runId]/findings/[findingId]/inspect` | Finding evidence trace inspect | Same finding + `/inspect` |
| `/manifests/[manifestId]` | Manifest summary, artifacts, bundle | T1: `a1c2e3f4-a5b6-7890-abcd-ef1234567890` |
| `/graph` | Evidence / architecture graph | T1: `/graph?runId=claims-intake-modernization` → **Load graph** |
| `/onboarding` | In-product onboarding | T1/T2; T2 may show `trialSampleRunId` from API |
| `/onboarding/start` | Deprecated alias | App Router shim permanently redirects to `/onboarding` (query preserved; canonical UX on **ONB**) |
| `/onboard` | Deprecated alias | App Router shim permanently redirects to `/onboarding` (query preserved; canonical UX on **ONB**) |
| `/getting-started` | Deprecated alias | App Router shim permanently redirects to `/onboarding` (query preserved) |
| `/help` | In-app help index | Open directly |
| `/help/[topic]` | Rendered help topic | e.g. `/help/getting-started`, `/help/first-architecture-review` (specialty `HelpCorePilotGuideView`, **HCO**; legacy `/help/core-pilot` → **ECO**), `/help/billing-and-plans` (specialty `HelpBillingAndPlansGuideView`, **HBX**), `/help/executive-summary` (specialty `HelpExecutiveSummaryGuideView`, **EXE**), `/help/findings` (specialty `HelpFindingsGuideView`, **HFX**), `/help/path-chooser` (buyer markdown chooser, **HPX**), `/help/developer-troubleshooting` (Admin-gated internal-runbook, **HDX**), `/help/governance-api-contracts` (Admin-gated API contracts reference, **HG**), `/help/alerts` (slugs in `product-documentation-registry.ts`) |
| `/demo` | CTO demo tour entry | CTO demo pack env; else redirects `/` |
| `/demo/explain` | Internal demo explanation | T2: `GET /v1/demo/explain`; T3 mock; blocked in strict T1 |
| `/snapshot/[runId]` | Deprecated leave-behind | App Router shim redirects to `/reviews/{runId}?readOnly=1` (query preserved). Showcase run uses Claims Intake spine. CTO recap still emits `/snapshot/...` links. T1: `/snapshot/claims-intake-modernization?v=demo` |
| `/403` | Unauthorized (no recognized app role) | Hard to hit under dev-bypass |
| `/why-archlucid` | Internal proof (live instrumentation) | T2 Docker seed; hidden in buyer-polished demo |

### Operate · analysis

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/compare` | Compare two finalized reviews | T1 compare URL; T2 Contoso pair |
| `/ask` | Ask questions about a review | T1: `/ask`; T2: `/ask?runId=<seeded-run>` |
| `/search` | Search review evidence | T1/T3: `/search` + run `claims-intake-modernization` |

Query keys for compare: `priorRunId`/`laterRunId` (buyer) or `leftRunId`/`rightRunId` (technical) — see `compare-url-query-params.ts`.

### Operate · governance

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/governance/advisory-scans` | Advisory scans hub (Scans + Schedules tabs) | T3 mock or T2 API; blocked in strict T1 nav; legacy `/advisory` + `/advisory-scheduling` → next.config redirects here |
| `/governance/findings` | Architecture risk register | T1 static; T2: `?runId=<seeded-run>` for review context |
| `/governance/risk-exceptions` | Risk exceptions / waivers | T3 mock or T2 seed |
| `/policy-packs` | Policy pack inventory | T1 static list |
| `/governance/policy-packs` | Governance-scoped pack registry | Same as hub in demo |
| `/governance/policy-packs/[id]` | Policy pack detail | T1: `healthcare-claims-v3-pack` |
| `/governance-resolution` | Effective policy stack (read-only) | T1/T3 |
| `/governance` | Governance workflow (submit → promote) | T1 static; T2 with governance seed |
| `/governance/approval-requests/[id]/lineage` | Approval request lineage | T1: `claims-intake-approval-001` |
| `/audit` | Tenant audit trail | T1 static events; T2 seeded audit |
| `/governance/decision-register` | Decision register | T1/T3 |
| `/alerts` | Alerts hub (inbox + tabs) | T1 inbox; tabs: `?tab=rules`, `routing`, `composite`, `simulation` |
| `/alert-routing` | Alert routing (standalone) | Same as `/alerts?tab=routing` |
| `/governance/dashboard` | Executive Workspace Health | T1/T3 tiles |
| `/governance/setup` | Governance setup guide (legacy `/governance/first-30-days` redirects) | T1 deep links (read-only) |
| `/governance/recurrence-schedules` | Recurrence schedules | T3 mock or T2 |
| `/value-report` | Sponsor value DOCX export | T2 finalized reviews + Execute role |
| `/workspace/security-trust` | Operator Security & trust | T1/T2; distinct from public `/security-trust` |

Layer guidance copy for many governance/analysis routes: `archlucid-ui/src/lib/layer-guidance.ts`. Sidebar source of truth: `archlucid-ui/src/lib/nav-config.ts` and `archlucid-ui/docs/NAV_CONFIG_CONTRACT.md`.

### Operate · operations and value

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/scorecard` | Review scorecard | T1 showcase context; T3 mock |
| `/recommendation-learning` | Recommendation tuning | T3 mock; blocked in strict demo |
| `/product-learning` | Pilot feedback capture | T3 mock |
| `/administration/connection-status` | Connection status (connector readiness hub) | Administration nav; `ConnectorOperationsDashboard` + contextual help. T3 mock or T2 |
| `/integrations/teams` | Microsoft Teams wiring | T3 mock |
| `/administration/system-health` | System health dashboard | Live/ready checks, build identity, buyer-polished demo variant; contextual help → troubleshooting (**ADY**) |
| `/replay` | Replay authority chain | `/replay?runId=claims-intake-modernization`; T2 for real replay |
| `/planning` | Planning hub | T1/T3 |
| `/planning/plans/[planId]` | Plan detail | T1: `claims-intake-modernization-plan` |
| `/evolution-review` | Evolution candidates | T3 mock |
| `/value-report/pilot` | Sponsor proof snapshot (no DOCX) | T1/T2 after finalized architecture package |
| `/value-report/roi` | ROI / hours summary | T1 illustrative; T2 with seed |
| `/digests` | Digests | T3 mock |
| `/digest-subscriptions` | Digest subscriptions | T3 mock |
| `/patterns` | Architecture pattern library | T3 mock or API if seeded |
| `/portfolio` | Retired — redirects to `/architecture/executive-dashboard` | Legacy bookmark only |
| `/operate/architecture-graph` | Legacy Operate shim | App Router redirect to `/graph` (query preserved; canonical UX on **GRA**) |
| `/architecture-intelligence` | Closed-loop architecture reasoning lab | Execute role; deep-link with `?runId=` from reviews/findings. Golden fixture + publish round trip. |
| `/operate/integration-events/dlq` | Integration event DLQ | Full architect workspace + Admin + T2 API |

### Executive route group

Lighter chrome than the full architect workspace; `(executive)` route group does not appear in the URL.

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/executive/dashboard` | Retired — redirects to `/architecture/executive-dashboard` | Legacy bookmark (**EXD**) |
| `/executive/reviews`, `/executive/reviews/*` | Retired — redirect to `/reviews` | Legacy bookmark only |
| `/executive/scorecard` | Executive scorecard | T1/T3 with showcase run |

### Settings

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/settings` | General settings (appearance, support bundle) | Layout OK T1; blocked in strict demo — T3 bypass or full architect workspace |
| `/settings/billing` | Billing and plans | Admin + full architect workspace + API |
| `/settings/identity-providers` | Identity provider config | Admin + API |
| `/settings/identity/sso-wizard` | SSO setup wizard | Admin + API |
| `/settings/api-keys` | API key management | Admin + API |
| `/settings/scim-provisioning` | SCIM provisioning | Admin + API |
| `/settings/cloud-connections` | Cloud connections | Admin + API |
| `/settings/tenant` | Tenant settings | Admin + API |
| `/settings/tenant/recycle-bin` | Tenant recycle bin | Admin + API |
| `/settings/cost-reporting` | Cost reporting | Admin + API |
| `/settings/webhooks` | Webhooks | Admin + API |
| `/settings/roles` | Role assignment | Admin + API |
| `/settings/baseline` | ROI baseline config | T3 mock |
| `/settings/extract-upload` | Extract/upload config | Allowed in CTO demo (`DEMO_ALLOWED_SETTINGS_PATHS`) |
### Admin

Requires **Admin authority**, full architect workspace, no demo nav blockers, and Tier 2 API (or Tier 3 mock with E2E bypass).

| URL | Purpose | How to view |
|-----|---------|-------------|
| `/admin/health` | Admin health / diagnostics | T2 + Admin; T3 screenshot harness |
| `/admin/configuration` | Effective configuration snapshot | Same |
| `/admin/pricing-quote-aging` | Pricing quote SLA dashboard | Same |
| `/admin/trial-funnel` | Trial funnel operations | Same |
| `/admin/fleet-llm-cogs` | Fleet LLM COGS visibility | Same |
| `/admin/tenant-health` | Per-tenant health admin | Same |
| `/admin/rag-health` | RAG / retrieval health | Same |
| `/admin/support` | Admin support tools | Same |
| `/admin/evidence-proposals` | Evidence proposal admin | Same |
| `/admin/users` | User administration | Same |

---

## Quick evaluation cheat sheet

| Goal | Fastest path |
|------|----------------|
| Architecture package with findings, manifest, artifacts | T1 → `/reviews/claims-intake-modernization` |
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
