# Operator shell navigation contract (`nav-config`)

Canonical implementation: `src/lib/nav-config.ts`, built by the **eight** **`NavGroupBuilder`** classes in `src/lib/pilot-nav-group-builder.ts`, `operate-analysis-nav-group-builder.ts`, `operate-governance-nav-group-builder.ts`, `operate-infrastructure-nav-group-builder.ts`, `operate-policy-nav-group-builder.ts`, `operate-integrations-nav-group-builder.ts`, `operator/operator-admin-nav-group-builder.ts`, and `operator/operator-system-admin-nav-group-builder.ts`.

This document replaces the historical mega-comment on `nav-config.ts`. **API authorization stays on the server**; this file describes **UI shaping only**.

## API vs UI

- **`tier`** and **`requiredAuthority`** describe how the shell **should** present routes.
- **Computed visibility** is **`filterNavLinksForOperatorShell`** in **`nav-shell-visibility.ts`** (**authority** + committed-review lifecycle gate, plus demo/buyer packaging omissions; empty groups dropped). **`tier` does not hide rows** (owner 2026-08-03) — it is presentation and telemetry metadata only.
- **`[Authorize(Policy = …)]`** on **ArchLucid.Api** is **authoritative** (`401`/`403`); nav omission or soft-disabled controls never imply a safe POST or deep link.

## Two shaping surfaces

This stack owns **Visibility metadata only**:

1. **Visibility** — `tier` + `requiredAuthority` in nav config + **`nav-shell-visibility.ts`** + **`useNavSurface().layerGuidance`** / **`LayerHeader`**.
2. **Capability** — **`useOperateCapability()`** + **`OperateCapabilityHints`** (Execute+ floor).

Enumeration: **`docs/library/PRODUCT_PACKAGING.md`** §3.

## Primary navigation model (2026-06-14)

Removed **workflow-mode presets** (Pilot operator, Full navigator, Governance reviewer, Analytics investigator). Audit before removal:

| Control | Changed permissions? | Changed routes? | Changed data / workflows? | Changed page behavior? | Effect |
|---------|---------------------|-----------------|---------------------------|------------------------|--------|
| Workflow-mode toolbar + sidebar preset radios | No | No | No | No | **Sidebar link visibility only** — `localStorage` filter by href prefix; API `[Authorize]` unchanged |
| **Operator \| Sponsor** (retained) | No | Yes (shell destination) | No | No | Switches between operator workspace (`/`) and sponsor dashboard (`/architecture/sponsor-dashboard`) |

**Retained shaping:** authority rank from `GET /api/auth/me`, committed-review lifecycle gate, plus demo/buyer packaging omissions. Progressive disclosure tiers (`essential` / `extended` / `advanced`), collapsed-pilot **Show all features**, per-group **N more** counts, and **`useNavProgressiveDisclosure`** were **retired** (owner 2026-08-03; plumbing removed 2026-08-13 **TB-2243**). **`tier`** survives only as metadata.

**Sidebar link density (TB-2139 / TB-2243):** **`RoleNavDensityExpandControl`** is the **only** sidebar escape hatch — same component on desktop **`SidebarNav`** and mobile **`MobileNavDrawer`**. Copy uses **`SHOW_ALL_DESTINATIONS`** (`Show all sidebar links` / `Fewer sidebar links`). Role-shaped density may hide non-primary nav groups; authority and lifecycle gates still apply underneath.

**Commit-state presentation (TB-524):** `nav-committed-architecture-review-promotion.ts` never adds or removes a row. Once `hasCommittedArchitectureReview` is true it moves **First review guide** to the end of the Architecture group and re-tags it `extended`, and re-tags Compare / Evidence graph / pilot outcomes `essential`.

**Committed-review gate single input (TB-2330):** Pre-commit progressive disclosure reads **`useEffectiveNavCommittedArchitectureReview()`** only — principal commit flag plus buyer-polished shell override. **`useOperatorShellNavRows`**, **`CommandPalette`**, and **`use-is-operator-nav-href-reachable`** must not import **`useNavCommittedArchitectureReview`** directly; Vitest guard: `nav-committed-review-gate-drift-guard.test.ts`. Sidebar and command palette must agree on the same href set for a given tenant commit state.

**Governance mode is label-only.** `useGovernanceMode()` / `GovernanceModeToggle` change **nav copy, never nav visibility**. The only nav effect is `resolveNavLinkPresentation` → `resolveReviewsListNavLinkLabel`, which swaps the Reviews-list plural noun via `governanceModeVocabulary`. Do **not** add href- or group-level hiding keyed on governance mode: turning the toggle off must not remove the Governance group or any `/governance/*` destination, because operators use the toggle for vocabulary and would lose reachable routes with no explanation. A `governance-mode-nav-filter.ts` module that hid 14 hrefs plus the whole `operate-governance` group existed but was never imported by any component — its tests passed against behavior the shell never had, so it was removed rather than wired in. Visibility belongs to `nav-shell-visibility.ts` (authority + lifecycle) and the packaging omissions below.

## Nav groups → buyer layers

**8** groups, **76** configured links (`flattenNavLinks()`). Group `id`s are stable (used as `localStorage` keys); only the label is user-visible.

| Group `id`              | Label          | `surface`         | Layer   | Links | Notes |
|-------------------------|----------------|-------------------|---------|------:|--------|
| `pilot`                 | Architecture   | `review-workflow` | Pilot   | 6 | request · run · finalize · review; essentials omit `requiredAuthority` |
| `operate-analysis`      | Insights       | `review-workflow` | Operate | 11 | analysis slice — compare, graph, Q&A, sponsor value, workspace health KPIs, … |
| `operate-governance`    | Approval       | `review-workflow` | Operate | 14 | decide/track loop — queue, findings, decisions, audit, alerts, approval setup |
| `operate-infrastructure` | Infrastructure | `review-workflow` | Operate | 7 | inventory snapshots, diagrams, resource hub, Ask, remediation instances |
| `operate-policy`        | Policy         | `review-workflow` | Operate | 4 | policy packs, standards, alert rules, schedules |
| `operate-integrations`  | Integrations   | `review-workflow` | Operate | 7 | connector configuration and outbound event surfaces |
| `operator-admin`        | Administration | `platform-admin`  | Admin   | 14 | system health, tenant cost, settings, support, users |
| `operator-system-admin` | Internal       | `system-admin`    | Admin   | 17 | employee-only; behind `isShowSystemAdministrationNavEnabled()` |

Group labels come from `OPERATOR_NAV_GROUP_LABELS` in `src/lib/i18n.ts` except `operator-admin` and `operator-system-admin`, which inline their labels. `OPERATOR_NAV_GROUP_LABELS` still exports `reports`, `operations`, and `help` values that no live group consumes.

**Shell filter:** `listNavGroupsVisibleInOperatorShell(..., surfaceFilter)` can target **`review-workflow`** vs **`platform-admin`** so buyer-first chrome (sidebar, palette) can separate review work from administration without duplicating hrefs.

## Product line (Architecture vs Security)

One Next.js app and one API host. `NEXT_PUBLIC_ARCHLUCID_PRODUCT=architecture|security` (default **architecture**) plus cookie `archlucid_product_line_v1` selects the shell. Assignments live in **`src/lib/product-line/product-line-catalog.ts`**:

| Assignment | Effect |
|---|---|
| `both` | Visible in Architecture and Security |
| `architecture` (default for unlisted hrefs) | Architecture shell only |
| `security` | Security shell only |

**Security spine today:** the `operate-infrastructure` group (`/governance/infrastructure/*`), OpSec factory pages still under Approval (`/governance/remediation-factory`, `remediation-patterns`, `audit-evidence`), Integrations (inventory + outbound bridges), shared Administration (users, identity, billing, trust, health, support — not AI usage / model governance / baseline / recycle bin), and Internal diagnostics (health, configuration, tenants — not trial funnel / pricing / replay / learning).

The Security shell **skips** the committed-architecture-review nav gate and role-density collapse so Infrastructure is not hidden behind a first sealed review. Shuffle destinations in that catalog file or at **`/internal/product-line`** (localStorage overlay).

**Local start:** `.\scripts\start-local-api-and-ui.ps1` starts **one** `ArchLucid.Api` plus **two** Next.js windows against `archlucid-ui/.env.local` — Architecture on **3000**, Security on **3001**. Pass `-SkipSecurityUi` to keep the old one-UI loop. Windows spawn sets `$env:NEXT_PUBLIC_ARCHLUCID_PRODUCT` in each window; do not rely on `npm run dev:security` there (Unix `VAR=value` prefixes do not apply in `powershell.exe`). On Unix-like shells, `npm run dev:security` still boots Security on **3001**.

Do **not** split hosts, migrations, or git branches for this. Product line is UI composition on the shared platform.

## Drift guard (contributors)

When adding or moving a route, follow the **ordered checklist** in **`docs/library/PRODUCT_PACKAGING.md`** §3 *Contributor drift guard* (API policy → nav config → `layer-guidance` / `LayerHeader` → **`useOperateCapability`** → packaging doc). Verify **C#** `[Authorize(Policy = …)]` still matches each link’s **`requiredAuthority`** string.

**TB-882 authority parity (CI):** `python scripts/ci/check_nav_authority_controller_parity.py` cross-checks nav `requiredAuthority` against mapped controllers' primary `HttpGet` policies (`scripts/ci/data/nav_authority_controller_parity_manifest.json`). Regenerate with `--sync` when nav or controller policies change; document intentional stricter/looser nav in `scripts/ci/data/nav_authority_controller_parity_exemptions.json`. Vitest: `nav-authority-controller-parity.test.ts`, `nav-route-title-parity.test.ts`.

### Route namespace policy (TB-404)

Operator sidebar groups imply a URL prefix in the address bar. **76** nav hrefs span **8** groups. The **TB-405–408** route moves have landed, so only **1** registered cross-namespace exception remains.

| Nav group `id` | Canonical prefix(es) | Notes |
|----------------|----------------------|--------|
| `pilot` | *(none — heterogeneous top-level review paths)* | Prefix enforcement skipped; review paths live at `/`, `/architecture/*`. |
| `operate-analysis` | *(none)* | Prefix enforcement skipped: `/insights/ask-review-questions`, `/insights/compare-two-reviews`, `/insights/impact-preview`, … |
| `operate-governance` | `/governance` | Approval-loop nav hrefs under `/governance/*` (TB-405). |
| `operate-infrastructure` | `/governance` | Infrastructure evidence workbenches under `/governance/infrastructure/*` (IE-UX-00). |
| `operate-policy` | `/governance` | Policy/setup nav hrefs under `/governance/*` (TB-405). |
| `operate-integrations` | `/integrations` | All Integrations nav hrefs under `/integrations/*` (TB-407). |
| `operator-admin` | `/administration` | All Administration nav hrefs under `/administration/*` (TB-406). |
| `operator-system-admin` | `/internal` | Internal operations moved `/admin/*` → `/internal/*`; legacy `/admin/*` are redirects only. |

**Registered exceptions (0):** `NAV_ROUTE_NAMESPACE_EXCEPTIONS` is empty. Workspace health lives at `/insights/workspace-health` under the Insights (`operate-analysis`) nav group, so no cross-namespace exception row is required.

**Exception registry (source of truth):** `src/lib/nav-route-namespace-exceptions.ts`  
**Prefix matcher + policies:** `src/lib/nav-route-namespace-policy.ts`  
**CI drift guard:** `src/lib/nav-route-namespace.test.ts` — fails when a new nav `href` is neither prefix-aligned nor registered with a non-empty `exceptionReason`.

When adding a nav link whose URL prefix differs from its sidebar group, **add a registry row first** (or move the route under **TB-405–408**).

### Hub pages (TB-680)

Hub surfaces (`/architecture/first-review-guide`, operator home setup cards, Core Pilot checklist, optional workspace setup) are **status + deep-link** pages — not second homes for settings wizards or Internal Operations tooling.

| Rule | Rationale |
|------|-----------|
| Every action has **exactly one owning page** | Avoid duplicate SSO, health, or role-management flows across hubs. |
| Hub pages may show **completion status** and **deep-link** only | No embedded forms, wizards, or mutation controls for actions owned elsewhere. |
| Hub pages must **not** link to `operator-system-admin` cluster routes in default customer shells | e.g. `/internal/health`, `/internal/configuration`, `/internal/failed-integration-messages`, internal value-report tabs. Use buyer-safe `/administration/system-health` when platform health is linked (see **TB-677**). |
| Role-gated blocks use **authority flags**, not disclosure alone | Optional setup stays collapsed **and** non-admins see delegation copy only (**TB-678**). |

**Contract module:** `src/lib/onboarding-hub-contract.ts`  
**CI drift guard:** `scripts/onboarding-hub-drift-guard.test.ts` — fails when scanned hub sources reintroduce forbidden internal href prefixes or embed `FinishSetupWizardPanel` / `Tier2ConnectionWizard`.

Cross-ref: First review guide redundancy audit (**TB-674**–**TB-679**).

### Breadcrumb contract (TB-2090 — removed)

Shell and page-local **breadcrumb trails are removed** (**TB-2090**). Primary wayfinding is left-nav + page titles. Buyer-polished satellite routes may still show a contextual **Back to review** link via `resolveBuyerOperateBackLink` when the golden-journey stepper is not active. Finding/manifest detail pages use explicit back links (`data-testid` …`back-to-review`), not `aria-label="Breadcrumb"`. Do not reintroduce `breadcrumb-map.ts` / `Breadcrumbs.tsx` / `breadcrumb-visibility.ts`.

### Cross-module Vitest anchors

- **`authority-seam-regression.test.ts`** — e.g. **`/governance`** must stay **`ExecuteAuthority`** so Reader-ranked callers do not see it under Operate nav (deep-link still hits API policy); every **`ExecuteAuthority`** row under **`operate-analysis`** and **`operate-governance`** stays absent from Read-tier filtered nav; Pilot essential hrefs stay visible for Reader; **caller rank `0`** stays stricter than Read for **`ReadAuthority`** links; **`/alerts`** stays **`advanced`** tier in config; filtered link order and **`listNavGroupsVisibleInOperatorShell`** group order stay aligned with config; Operate governance href sets grow **monotonically** Read→Execute→Admin under **`filterNavLinksByAuthority`**; the full **Operate analysis** link set survives at Read rank when authority allows; **`/governance/approval-queue`** appears for **Execute** rank (**`filterNavLinksForOperatorShell`**).
- **`OperatorNavAuthorityProvider.test.tsx`** — **`useNavCallerAuthorityRank`** stays Read during JWT **`/me`** refetch so stale Execute rank does not flash in nav or hooks.
- **`OperateCapabilityHints.authority.test.tsx`** — rank-gated Operate sidebar/page cues share the same **`ExecuteAuthority`** numeric floor as **`useOperateCapability`** (governance resolution, audit log, **Alerts inbox**, **governance dashboard** reader cue, alert tooling).
- **`authority-execute-floor-regression.test.ts`** — same **boolean** for a synthetic **`ExecuteAuthority`** row vs **`operateCapabilityFromRank`**.
- **`authority-shaped-ui-regression.test.ts`** — every catalog **`ExecuteAuthority`** link hidden at Read / visible at Execute (new rows cannot drift untested); **`operate-governance`** monotonicity Reader→Admin.
- **`nav-shell-visibility.test.ts`** — Analysis extended **Execute** links (e.g. **`/internal/validate-route`**) gate on rank alone; empty groups are dropped after authority filtering.
- **`workspace-navigation-help-alignment.test.ts`** — desktop **`SidebarNav`** and mobile **`MobileNavDrawer`** both mount **`RoleNavDensityExpandControl`** (density parity guard).
- **`current-principal.test.ts`** — **`maxAuthority`** vs **`requiredAuthorityFromRank`** and **`hasEnterpriseOperatorSurfaces`** vs mutation capability.
- **`nav-config.structure.test.ts`** — duplicate **`href`**s; **Pilot** essentials omit **`requiredAuthority`**; **Operate** **`ExecuteAuthority`** links must not use **`essential`** tier (rank + packaging story).
- **`nav-route-namespace.test.ts`** — every nav **`href`** matches its group canonical prefix or **`NAV_ROUTE_NAMESPACE_EXCEPTIONS`** (TB-404).
- **`authority-shaped-layout-regression.test.tsx`** — **inspect-first** DOM when mutation hook is false (parallel to tier→authority story; still **UI only**).

## Operator home view tabs vs sidebar sections

Home recent-reviews preview tabs (`RunsDashboardPanelFilters` line tabs on `/`) map to sidebar groups as follows — tab labels were renamed to match nav vocabulary (not review-workspace tabs):

| Home tab (`hideHeading`) | Sidebar group | Primary nav destination |
|--------------------------|---------------|-------------------------|
| **Recent** | Architecture (`pilot`) | `/architecture/reviews` |
| **Findings** | Approval (`operate-governance`) | `/governance/findings` (open-finding pressure) |
| **Monitoring** | Approval (`operate-governance`) | Governance approval queue / warning-filtered reviews |

Do not collapse these preview tabs into a **More** menu on desktop; they are distinct from sidebar cluster **Show N more … destinations** disclosures.

## `layer-guidance.ts` / `LayerHeader`

**Operate · governance** route families use **`LAYER_PAGE_GUIDANCE`** rows with **`enterpriseFootnote`** (see **`authority-seam-regression.test.ts`** — Operate analysis vs governance footnote contract). That strip is **cognitive packaging only**; it does not replace **`requiredAuthority`** in nav config or **`[Authorize]`** on the API.

## `requiredAuthority` vs Operate POSTs

This field is the **only** gate on **nav / palette visibility** — Operate `extended` and `advanced` hrefs are visible at sufficient rank without a separate sidebar reveal step (**`nav-shell-visibility.test.ts`**). Role-shaped density may still collapse groups until the operator uses **Show all sidebar links**. In-page **POST / toggle** soft-enable on Operate-heavy routes uses **`useOperateCapability()`** — same **`AUTHORITY_RANK.ExecuteAuthority`** floor as **`ExecuteAuthority`** links here; keep both aligned with C# policies. **Audit CSV export** is a documented exception: gated on **`/me`** roles (**Auditor** or **Admin**) on the audit page, not this nav field alone.

## Authority (`requiredAuthority`) — first-pass map

UI hint only; API still 401/403.

- **Omit** on Pilot *essentials* (home, getting-started, new run, runs) so Reader-signed-in pilots keep the default path.
- **Analysis · extended:** inspection/diff surfaces that are `ReadAuthority` on the API (`GraphController`, `AuthorityCompareController`) use **`ReadAuthority`**. **Replay** stays **`ExecuteAuthority`** (`AuthorityReplayController`).
- **Operate · analysis (`operate-analysis`):** every link sets **`requiredAuthority`**. Read/analytics pages → **`ReadAuthority`** unless the API primary workflow is Execute-class (planning, evolution candidates; advisory **schedules** and digest **subscriptions** are hub tabs under **`/governance/advisory-scans`** and **`/digests`** with in-page Execute gating). Link `title` strings use **“Label — short description”** for tooltips (same convention as governance slice).
- **Operate · approval (`operate-governance`):** **approval queue / findings / decisions / audit / alerts** whose controllers are class-scoped **`ReadAuthority`** → **`ReadAuthority`**. **Governance workflow** (mutations) → **`ExecuteAuthority`**.
- **Operate · policy (`operate-policy`):** **policy packs / standards / alert rules / schedules / setup** whose controllers are class-scoped **`ReadAuthority`** → **`ReadAuthority`**.
- **Operator admin (`operator-admin`, `platform-admin` surface):** tenant directory and support use **`/administration/users`** and **`/administration/support`** (legacy `/admin/*` redirect); **`/administration/security-trust`** replaces **`/workspace/security-trust`**. **`AdminAuthority`** on user management. Other admin destinations use **`ReadAuthority`** / **`ExecuteAuthority`** as appropriate. Elsewhere under Operate, do not label list/browse pages **`AdminAuthority`** when the API is Read-class — POST-only admin actions stay on server policy.

## UI shaping vs API authorization (boundary)

**`[Authorize(Policy = …)]`** on **ArchLucid.Api** is authoritative (**401/403**) for every route and POST — always. `requiredAuthority` drives **shell visibility** in **`nav-shell-visibility`** — not whether HTTP writes succeed. Keep policy **names** aligned with C# when moving routes.

**Vitest:** `nav-config.structure.test.ts` (graph invariants); **`authority-execute-floor-regression.test.ts`** (Execute-class nav row vs mutation capability; Operate **`operate-governance`** Reader vs Execute href sets); **`src/app/(operator)/operate-authority-ui-shaping.test.tsx`** (representative Operate pages: **`useOperateCapability`** → **`disabled`** on primary actions).

Omitting `requiredAuthority` is used only for **Pilot essentials** (default path for any authenticated rank). Every **Operate** nav link sets `requiredAuthority`. Applied in **`nav-shell-visibility`**.

Group IDs are intentionally stable (used as localStorage keys); only labels are user-visible.
