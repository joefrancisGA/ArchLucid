> **Scope:** Contributor-reference — SecureNow path inspect workbench surfaces (SA-16, **SA-16+** desk cohesion).

# SecureNow path inspect workbench (SA-16)

Operators inspect cited architect paths **inline** on SecureNow desks without opening a graph explorer. One shared **`SecurityEvidencePathInspectPanel`** loads hops, ordinal confidence bands, cut points, and optional simulator explanation for the current selection.

Operator-facing summary: [`docs/library/customer-facing/SECURITY_EVIDENCE_PATHS_OPERATOR_GUIDE.md`](customer-facing/SECURITY_EVIDENCE_PATHS_OPERATOR_GUIDE.md).

## UI surfaces

### Remediation factory

Routes: `/security/remediation-factory`, `/governance/remediation-factory`.

- **Ranked architect paths** table (`GET /v1/operational-security/paths/ranked`) — select a path row to inspect without a finding citation (`pathIdOverride` on the panel).
- **Priority queue** — select a finding row when it cites a `PathId`; selection syncs to the `findingId` query param where URL state is enabled.
- **Architect outcome metrics** (`SecureNowArchitectOutcomeMetricsPanel`) — compare snapshot pairs via `GET /v1/operational-security/architect-metrics` (SA-11).
- Page header shortcut row documents **Alt+J**, **Alt+K**, **Alt+I**, and **Alt+E** (priority score simulator when a finding row is selected).

### SecureNow Findings queue

Route: `/compliance/findings` (Security product line).

- Single table row selection drives path inspect via the cited finding’s `PathId`.
- Deep links and refresh-safe selection use the **`findingId`** query param (same constant as remediation factory: `REMEDIATION_FACTORY_FINDING_ID_PARAM` in `remediation-factory-url-state.ts`), coordinated with bulk selection via `governance-findings-queue-desk-url.ts`.
- Page header shortcut row: findings triage keys (**Alt+1** / **Alt+2** / **Alt+3** when Execute+ triage is enabled), **Alt+J** / **Alt+K** for row navigation, and **Alt+I** (Focus path inspect).

### Assigned to me

Route: `/security/assigned-to-me` (Security product line).

- Same panel and **`findingId`** URL cursor as the tenant findings queue; wired through `GovernanceAssignedToMePathInspectSection.tsx`.
- Page header shortcut row (SecureNow only): **Alt+J**, **Alt+K**, triage keys when enabled, and **Alt+I**. Architecture product-line assigned-to-me does not show this row.

### Finding detail (Security product line)

On `productLine === "security"`, nested finding inspect surfaces render the same panel (for example `FindingDetailPageView.tsx`, `FindingInspectView.tsx`) with `findingId` from the route — not a separate path-inspect API.

### Empty state

When the finding has no `PathId`: “No architect path cited — this finding is resource-scoped.”

## Keyboard and command palette

| Action | Key / entry | Desks |
|--------|-------------|--------|
| Focus path inspect | **Alt+I** | Remediation factory, SecureNow Findings, Assigned to me |
| Focus path inspect | Command palette **Focus path inspect** | Remediation factory (`action-remediation-factory-inspect`), findings desks (`action-governance-findings-path-inspect`) |
| Next / previous row | **Alt+J** / **Alt+K** | Factory priority + ranked tables; findings queues (existing findings shortcuts) |
| Explain selected score | **Alt+E** | Remediation factory only (selected finding row) |

Hooks: `useRemediationFactoryShortcuts.ts`, `use-governance-findings-queue-path-inspect-shortcuts.ts`. Registry rows: `remediation-factory-page-shortcuts.ts`, `FINDINGS_PAGE_SHORTCUTS` + `governance-findings-queue-path-inspect-page-shortcuts.ts` in `GovernanceFindingsQueueHeader.tsx`.

Selecting a factory priority or ranked-path row still moves focus to the path inspect panel (`tabIndex={-1}`, focus-visible ring) when the desk auto-focuses after selection.

## Panel contents

| Section | Source |
|--------|--------|
| Path kind + confidence **band** | `GET /v1/operational-security/paths/{pathId}` |
| Rank breakdown (when opened from ranked table or cited path) | `GET /v1/operational-security/paths/{pathId}/rank` |
| Weakest hop callout | `weakestHop`, `weakestHopReason` |
| Architect path summary | `explanationTemplate.architectSentence` (ordinal bands; no `%`) |
| Simulator explanation (optional) | `POST /v1/operational-security/paths/{pathId}/explanations` with `{ useSimulator: true }` |
| Hops table (from, to, edge, provenance, band) | `hops[]` |
| Cut points | `relatedCutPoints[]` |
| Organizational routing | `routing[]` (parsed when present; OpenAPI regen may lag SA-15) |
| Advisory instance link | `GET /v1/infra-evidence/remediation-instances?findingId=` → remediation workbench deep link (finding-scoped rows only) |

## Constraints (product)

- No percentage display for path confidence.
- No force-directed graph as the primary view.
- No desktop workspace tab collapse or **More** overflow changes.
- Do not hide desktop review workspace tabs to make room for path inspect (product rule).

## Frontend modules

**Shared panel and API**

- `archlucid-ui/src/lib/security-evidence-path-api.ts`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`
- `archlucid-ui/src/hooks/use-security-evidence-ranked-paths-query.ts`
- `archlucid-ui/src/hooks/use-security-evidence-path-rank-query.ts`
- `archlucid-ui/src/components/security/SecureNowArchitectOutcomeMetricsPanel.tsx`

**Remediation factory**

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`
- `archlucid-ui/src/hooks/useRemediationFactoryShortcuts.ts`

**Findings desks (SA-16+)**

- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceAssignedToMePathInspectSection.tsx`
- `archlucid-ui/src/lib/governance/governance-findings-queue-desk-url.ts`
- `archlucid-ui/src/hooks/use-governance-findings-queue-path-inspect-shortcuts.ts`
- `archlucid-ui/src/lib/governance/governance-findings-queue-command-palette-events.ts`
- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueHeader.tsx`

## Depends on

- **SA-04** path inspector API
- **SA-09** path ranking (rank section + ranked table)
- **SA-11** architect outcome metrics panel
- **SA-14** advisory remediation instances (optional link)
- **SA-15** organizational routing rows (optional section)
- **SA-17** constrained path explanation (simulator button)
