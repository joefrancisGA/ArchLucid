> **Scope:** Evaluator-facing demo workspaces (Workspace A Product Tour, Workspace B synthetic regulated storyline, stable URLs, scope headers, and export hints).

> **Spine docs:** [`DEMO_QUICKSTART.md`](DEMO_QUICKSTART.md), [`demo-quickstart.md`](../library/demo-quickstart.md).

# Demo workspaces (go-to-market)

## Cross-navigation (marketing + onboarding)

| Surface | Workspace | Repository wiring |
|---------|-----------|-------------------|
| **Landing / welcome — secondary CTA “Try the self-demo”** (improvement **#32**) | **Workspace A** (product tour run) | `archlucid-ui`: [`SelfDemoRequestCta.tsx`](../../archlucid-ui/src/components/marketing/SelfDemoRequestCta.tsx), [`build-self-demo-cta-href.ts`](../../archlucid-ui/src/lib/marketing/build-self-demo-cta-href.ts), env **`NEXT_PUBLIC_SELF_DEMO_URL`** — defaults to legacy `/runs/{ProductTour}` which **301**s to **`/reviews/...`** (see below). Deployments should set **`NEXT_PUBLIC_SELF_DEMO_URL`** explicitly for staging/production hostnames when it must be absolute. |
| **Post-registration onboarding** — “Open example review” | Runs returned as **`trialSampleRunId`** | [`OnboardingStartClient.tsx`](../../archlucid-ui/src/components/OnboardingStartClient.tsx) surfaces **`GET /v1/tenant/trial-status`** (`trialSampleRunId`). Coordinators align trial bootstrap with **`DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId`** when hosted evaluators should hit the canonical Product Tour run. |
| **No dedicated second onboarding deep link today** | **Workspace B** (regulated storyline) | **Sales / CS / marketing** bookmark or email the **Workspace B canonical URL pattern** (`/reviews/{runId}` in this doc). Owners may add explicit copy or CTAs linking Workspace B alongside Workspace A once **#32** copy review extends onboarding. |

**Operational alignment:** when trial tenants use a different seeded sample than the Product Tour, document the tenant’s actual **`trialSampleRunId`** next to **`NEXT_PUBLIC_SELF_DEMO_URL`** in the deployment runbook so Sales and onboarding scripts stay truthful.

---

## Staging / production URLs (patterns and owner-owned hosts)

Repositories **must not bake in** unpublished customer hostnames. Use this pattern everywhere; release managers paste the **`{OPERATOR_ORIGIN}`** your environment actually serves (matching operator UI HTTPS origin).

| Workspace | Canonical path (recommended) |
|-----------|--------------------------------|
| **A — Product Tour** | `{OPERATOR_ORIGIN}/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| **B — Regulated synthesis** | `{OPERATOR_ORIGIN}/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` |

| Environment | **`{OPERATOR_ORIGIN}`** (fill per deployment — examples only) |
|-------------|--------------------------------------------------------------|
| **Local compose / dev** | `http://localhost:3000` (UI) matching [`DEMO_QUICKSTART.md`](DEMO_QUICKSTART.md). |
| **Staging** | **`https://<your-staging-operator-host>`** — record canonical operator origin in **`docs/`** deployment notes when you cut a staging lane (see also [`DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md), post-deploy **`SMOKE_TEST_BASE_URL`** where applicable). |
| **Production** | **`https://<your-production-operator-host>`** — same; GA tagging requires **`ui-e2e-live`** (and **`@release-gate`**) green on candidate builds (**[`docs/engineering/BUILD.md`](../engineering/BUILD.md)**). |

**Legacy shorthand:** **`{OPERATOR_ORIGIN}/runs/<run-guid>` → 301 `/reviews/<run-guid>`** — safe for outbound ads that still omit `/reviews/`.

---

## Tenant bootstrap (Sales + Marketing)

Shared facts for both workspaces — default development scope tenant **`11111111-1111-1111-1111-111111111111`**, workspaces/projects in each section below seed under **`DevelopmentDefaultScopeTenantBootstrap`** + **`DemoSeedService`** when **ArchLucid.Api** runs **`ASPNETCORE_ENVIRONMENT=Development`** (Compose demo profile mirrors this posture per [`DEMO_QUICKSTART.md`](DEMO_QUICKSTART.md)).

| Role | Responsibility |
|------|----------------|
| **Platform / engineer** | Run DbUp migrations, start API against SQL, **`AgentExecution__Mode=Simulator`** for cheap CI/staging rehearsals. Confirm demo seed paths execute (**`DemoSeedService`**, Meridian/Alpine + Product Tour workspaces). Smoke: **`npm exec playwright test --grep "@release-gate"`** in **`archlucid-ui`** with API at **`LIVE_API_URL`** (see **[`docs/engineering/BUILD.md`](../engineering/BUILD.md)**). |
| **Sales** | Use **bookmark deep links** and **confirm scope picker** aligns to the advertised workspace (**Product Tour**, **Alpine governance review**) — wrong workspace/project hides fixtures (scope triplet documented per workspace below). Optionally drive evaluators via landing **Try the self-demo** (Workspace A only). Workspace B stays a **consultant/regulated wedge** narration link until onboarding adds explicit UI. |
| **Marketing** | Set **`NEXT_PUBLIC_SELF_DEMO_URL`** for Workspace A (**relative path preferred**, or absolute **`https`** URL on production). Maintain copy consistency with onboarding **trial sample** wording; cite **synthetic entities only** (**Northwind / Contoso / Meridian / Alpine** — no implied real customers). Link this doc from internal playbooks alongside **[`POSITIONING.md`](POSITIONING.md)**. |

---

## Resetting / re-seeding (staging refreshes)

1. **`docker compose`** local demo stacks: tear down volumes per **[`DEMO_QUICKSTART.md`](DEMO_QUICKSTART.md) — Cleanup**, then rerun **`scripts/demo-start.ps1`** / **`demo-start.sh`** (applies migrations + bootstrap seed paths).
2. **Dedicated staging SQL catalogs:** recreate empty DB (or migrate from known baseline), rerun latest pipeline deploy so **Development** staging paths execute **`DemoSeedService`** for default tenant workspaces; verify `/health/ready` then hit both canonical URLs scoped with headers below.
3. **Operational refresh without repo changes:** restarting API/SQL alone does **not** guarantee fresh findings — deterministic GUIDs intentionally remain stable (`DemoWorkspaceStableIds`). For **content** updates edit **`ArchLucid.Application/Bootstrap`** (`DemoSeedService`, `RegulatedScenarioWorkspaceSeed`, Product Tour payloads) following **living fixture** discipline (next section).

---

## Living fixtures — maintenance and PR discipline

GA evaluators rely on **`archlucid-ui/e2e/demo-workspace-*.smoke.spec.ts`** (tag **`@release-gate`**, merge-blocking via **`.github/workflows/ci.yml`** `ui-e2e-live` and **`docs/engineering/BUILD.md`**).

1. **Living fixtures:** Demo workspaces diverge silently when UX or wire shapes change (**evidence model**, finding cards, buyer shell nav, exports, Markdown/DOCX surfaces, manifest summary fields, timeline/progress instrumentation, policy/rule display). Passing core unit/integration tests is **not** sufficient if smoke drifts.

2. **Co-change rule:** Any PR materially touching **finding display**, **evidence summaries**, **export formats/endpoints consulted by smoke**, **policy-pack evaluation payloads that seed manifests**, **run-detail section IDs / buyer nav anchors**, **or persisted export JSON shape** MUST:
   - Re-run **`cd archlucid-ui`** → **`npm exec playwright test --grep "@release-gate"`** (or full live suite) against seeded SQL Development paths, **or** justify with maintainer escalation if CI flakes are infra-only.

3. **Seed format churn:** Persisted manifests, **`RunExportRecords`**, or **`dbo.Runs`/workspace rows** mutated for demo storytelling require **matching updates** under **`DemoSeedService`**, seeds, **`DemoWorkspaceStableIds` parity tests**, **`DemoTourWorkspaceIdsParityTests` / `DemoRegulatedScenarioWorkspaceIdsParityTests`**, **`DemoWorkspaceFixtureManifestParityTests`**, **`fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json`**, and **`archlucid-ui/e2e/helpers/demo-workspace-live-scope.ts`** (imports the manifest) in the **same PR** whenever anchor IDs/content move.

### Pinned fixture package (SQL + blob narrative seeds)

Evaluator URLs and Playwright/release-smoke anchors are driven from one JSON manifest:

- **`fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json`** — `fixturePackageVersion`, stable GUIDs for Workspace **A** / **B**, **expectedCommittedFindingCount** (matches `ProductTourWorkspaceSeed` / `RegulatedScenarioWorkspaceSeed` builders), and evidence-object counts used for GA drift detection.

**Update procedure when product intentionally changes demo seeds**

1. Edit **`DemoSeedService`** / **`ProductTourWorkspaceSeed`** / **`RegulatedScenarioWorkspaceSeed`** (and **`DemoWorkspaceStableIds`** only when anchors truly move — rare).
2. Bump **`fixturePackageVersion`** and adjust **`expectedCommittedFindingCount`** / evidence counts in the manifest so **`DemoWorkspaceFixtureManifestParityTests`** stays green.
3. Align **`docs/go-to-market/DEMO_WORKSPACES.md`** tables and scope triplets with the manifest (CI runs **`scripts/demo-workspaces/Validate-DemoWorkspacesDoc.ps1`** and **`demo-workspaces-fixture-parity`**).
4. Re-run **`@release-gate`** Playwright smoke (**`demo-workspace-*.smoke.spec.ts`**) and **`scripts/release-smoke.ps1 -LivePlaywright`** (or **`-Profile LiveUiSql`**) against Development SQL.

See also **[`docs/library/RELEASE_SMOKE.md`](../library/RELEASE_SMOKE.md)** and **`scripts/release-smoke.ps1 -LivePlaywright`**.

---

## Synthetic naming and PII hygiene

All strings are **fabricated** (Northwind, Contoso Cloud Platform, Meridian Advisory Group, Alpine Health Innovations cohort language). Classification tags (**HIPAA-aligned-synthetic**, **PHI-prohibited-evaluator**) are **narrative only** — there is **no real PHI / regulated payload** carried in seeded demo rows intended for evaluator tenants.

Periodic contributor spot-check:

```powershell
# From repo root — extend patterns thoughtfully for your org's PII fingerprints.
rg -n "\\b@gmail\\.com\\b|\\b(contoso\\.com|fabrikam\\.com)\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b" docs/go-to-market ArchLucid.Application/Bootstrap
```

If you add realism, prefer clearly fake domains (**`*.example`** / **`northwind-demo`**) documented here.

---

## Acceptance criteria checklist (demo workspace readiness)

Use this checklist before tagging **GA / external pilot freeze** aligned with the sequenced prompts in **`[CURSOR_PROMPTS_GA_TASKS_27_32.md](../../archive/agent-prompts/CURSOR_PROMPTS_GA_TASKS_27_32.md)`** (and related **`CURSOR_PROMPTS_GA_TASK_*.md`** under **`docs/archive/agent-prompts/`** — historical task lists, not product documentation).

- [ ] **Golden demo validation:** `./scripts/verify-demo-workspace.ps1` reports **`Demo workspace disposition: PASS`** (or documented **HOLD** with stable reason codes) including **`GET /v1/demo/preview`** essentials via `scripts/demo_preview_essentials.py`. First-pilot proof collects `demo-workspace-validation.txt` when commercial handoff runs.

- [ ] **Demo-derived ROI labeling:** First-value reports for demo runs include **Demo-derived** evidence badges — never present demo hours or dollars as buyer outcomes.

- [ ] **`demo-workspaces-fixture-parity` + manifest pins:** Workflow job **`Go-to-market: demo workspace pins (manifest vs docs + seeds)`** green — validates **`DEMO_WORKSPACES.md`** anchors vs **`fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json`** and runs **`DemoWorkspaceFixtureManifestParityTests`** (finding/evidence counts vs seed builders). Branch protection should require this job wherever GA is certified.

- [ ] **`@release-gate` discipline:** **`ui-e2e-live`** executes **`demo-workspace-*.smoke.spec.ts`** when it runs (**`ci.yml`**: job `if:` is **`github.event_name != 'pull_request`** — **`push`** to default branch / **`workflow_dispatch`** / **`merge_group`**, depending on triggers). Confirm org branch protection attaches that check wherever you certify GA. Before tagging, additionally run **`cd archlucid-ui`** → **`npm exec playwright test --grep "@release-gate"`** and **`scripts/release-smoke`** live parity when claiming SQL/UI alignment.

- [ ] **PII realism:** Hosted copy + seeds contain **only synthetic** firms and placeholders; onboarding and trial docs point here for naming truth.

- [ ] **Fixture drift signal:** Breaking UI/API expectations without updating seeds/smoke manifests as **`@release-gate` failures**, forcing fixture repair (not muted checks).

- [ ] **Documented anchors:** Stable URL patterns (**above**), scope triplets (**per workspace**), bootstrap (**Sales + Marketing**) — this file stays the canonical cross-link target for onboarding/landing (**#31 / #32**).

---

## Workspace A — Self-demo / Product Tour

**Demonstrates:** A complete **architecture review lifecycle** narrative for skeptical buyers (**Capture → Evidence → Review → Assessment → Deliverables**) on a finalized synthetic **Contoso Cloud Platform** storyline — evidence basis cards, surfaced findings with severity-backed badges, a **Finalized decision record** posture, packaged deliverables (ZIP/markdown/export affordances) without implying real-customer attestations — ideal for **`NEXT_PUBLIC_SELF_DEMO_URL`** + landing **Try the self-demo**.

**Audience:** Buyers who activate **Try the self-demo** (marketing CTA).

**Synthetic storyline:** Northwind Architects (fabricated reviewer) reviews **Contoso Cloud Platform**. All artifacts, subscriptions, and customer names are **synthetic**.

**Committed review run (`dbo.Runs`):** deterministic GUID **`b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf`** (see `DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId` in **`ArchLucid.Core.Scoping`**).

### Stable UI entry URLs

Next.js redirects legacy **`/runs/*`** to **`/reviews/*`** (`archlucid-ui/next.config.ts`). Use the review shell path for bookmarks and campaigns.

| Variant | Pattern |
|---------|---------|
| **Canonical reviewer deep link** | `{UI_ORIGIN}/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| **Legacy / marketing shorthand** (`NEXT_PUBLIC_SELF_DEMO_URL`) | `{UI_ORIGIN}/runs/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` → **301** to `/reviews/...` |

Replace `{UI_ORIGIN}` with your host (local demo: typically `http://localhost:3000`).

### API / scope headers (mandatory triplet)

Run rows are SQL-scoped by **tenant**, **workspace**, and **scope project**. The shell forwards scope on `/api/proxy` via **`x-tenant-id`**, **`x-workspace-id`**, and **`x-project-id`**. Opening `/reviews/{runId}` **without** the matching workspace/project still targets the HTTP default scope (`ScopeIds`), so listings and run detail loads may **miss** the Product Tour fixtures.

For **Workspace A**, align headers (or JWT claims interpreted the same way) to:

| Header | Stable GUID (`ScopeIds.DefaultTenant` environment) |
|--------|-----------------------------------------------------|
| `x-tenant-id` | `11111111-1111-1111-1111-111111111111` |
| `x-workspace-id` | `2b2571e1-1884-62a2-1e8b-15a2a70a0342` |
| `x-project-id` | `9beb918c-83d4-1385-0486-21f341806c5c` |

Local operators can pick **Product Tour — Architecture Review** in the Scope Switcher (`archlucid-ui`); integrations should set the triple explicitly.

Unit coverage: **`DemoTourWorkspaceIdsParityTests`** must match **`DemoWorkspaceStableIds`** literals so marketing anchors never drift silently.

### `IsDemoWorkspace` and billing posture

Development bootstrap inserts **`dbo.TenantWorkspaces.IsDemoWorkspace = 1`** for the Product Tour workspace when migration **`166`** (or **`ArchLucid_Unified_Schema.sql`** parity fragment) deployed the flag. Seeds also tag that workspace so **SKU metering** can exclude scripted fixtures once product code honors the column.

### Read-only stance for evaluators

Today, **enforce read-only evaluator access** operationally (**Entra roles / RBAC**, product role matrix, trial policy) rather than trusting UI alone. Synthetic rows remain authoritative for the storyline; cloning onto non-default tenants is intentionally gated in **`DemoSeedService`** (requires **`ScopeIds.DefaultTenant`** unless product widens seeding intentionally).

---

## Workspace B — Synthetic regulated / AI governance scenario

**Demonstrates:** A **consultant-led regulated AI + security baseline** walkthrough — heavier cross-cutting findings sourced from **AI governance** and **security baseline** seed themes, **whitelabel export pre-fill** JSON on persisted export records, and executive-safe language about sensitive domains **without** hosting real PHI — ideal for **boutique / compliance** evaluators who need “show me the finding depth” before a pilot.

**Audience:** Evaluators who need a **regulated, AI-era governance** walkthrough with heavier findings and **consultant whitelabel** export hints.

**Synthetic storyline:** **Meridian Advisory Group** (fabricated consultant) delivers **Alpine Health Innovations — Patient Risk Scoring Platform** review. **No PHI, PII, or real regulated payloads** — classification tags and “patient” language are narrative only.

**Committed review run (`dbo.Runs`):** **`61c60d76-2b80-93f9-46bb-2f66fd608b9b`** (`DemoWorkspaceStableIds.RegulatedScenarioArchitectureReviewRunId`).

### Stable UI entry URL

| Pattern | Example |
|---------|---------|
| **Canonical reviewer deep link** | `{UI_ORIGIN}/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` |

### Scope headers (mandatory triplet)

Runs are filtered by tenant + workspace + project. Use:

| Header | GUID |
|--------|------|
| `x-tenant-id` | `11111111-1111-1111-1111-111111111111` |
| `x-workspace-id` | `3f1a16c3-172e-5632-c53a-3ed16446f603` |
| `x-project-id` | `49074cdf-bdab-a5fa-789b-09a3e556a8f2` |

SQL workspace display name: **AI Governance Review — Patient Risk Scoring Platform**. Project slug (`dbo.Projects.Name`): **`alpine-ai-governance-review`**.

### Whitelabel + export pre-fill

Seeded **`dbo.RunExportRecords`** for Workspace B stores **`AnalysisRequestJson`** with **`PersistedAnalysisExportRequest`**, including:

| JSON field | Intended use |
|------------|----------------|
| **`reviewBoardWhitelabelFirmDisplayName`** | Meridian Advisory Group |
| **`reviewBoardWhitelabelClientEngagementTitle`** | Alpine Health — AI Governance Engagement |
| **`reviewBoardWhitelabelLogoBlobReference`** | Opaque placeholder pointer (resolve to bytes in tenant storage for real PDF/DOCX) |
| **`reviewBoardWhitelabelFooterAttribution`** | Custom footer line with `{FirmDisplayName}` placeholder |

**Architecture review board packets** (`IArchitectureReviewExportService.GenerateReportAsync`) still require callers to pass **`WhitelabelConfiguration`** + optional logo bytes — the stored JSON is the **evaluator pre-fill** contract for tools and future UI. Artifact bundle markdown under the run also mirrors the same strings for human-readable tours.

Coverage: **`DemoRegulatedScenarioWorkspaceIdsParityTests`**, **`DemoSeedServiceTests.SeedAsync_seeds_workspace_b_regulated_scenario_with_whitelabel_export_hints`**.
