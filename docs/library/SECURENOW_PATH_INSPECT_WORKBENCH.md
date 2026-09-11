# SecureNow path inspect workbench (SA-16)

Operators stay in the remediation factory priority queue. Selecting a row opens an inline **Path inspect** panel that loads the cited architect path without leaving the desk.

## UI surfaces

- **Remediation factory** (`/security/remediation-factory`, `/governance/remediation-factory`):
  - **Ranked architect paths** table (`GET /v1/operational-security/paths/ranked`) — select a path row to inspect without a finding citation.
  - **Priority queue** — select a finding row when it cites a `PathId`.
  - **Architect outcome metrics** (`SecureNowArchitectOutcomeMetricsPanel`) — compare snapshot pairs via `GET /v1/operational-security/architect-metrics` (SA-11).
- Empty state when the finding has no `PathId`: “No architect path cited — this finding is resource-scoped.”

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
- Keyboard: selecting a priority or ranked-path row moves focus to the path inspect panel (`tabIndex={-1}`, focus-visible ring).

## Frontend modules

- `archlucid-ui/src/lib/security-evidence-path-api.ts`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`
- `archlucid-ui/src/hooks/use-security-evidence-ranked-paths-query.ts`
- `archlucid-ui/src/hooks/use-security-evidence-path-rank-query.ts`
- `archlucid-ui/src/components/security/SecureNowArchitectOutcomeMetricsPanel.tsx`

## Depends on

- **SA-04** path inspector API
- **SA-09** path ranking (rank section + ranked table)
- **SA-11** architect outcome metrics panel
- **SA-14** advisory remediation instances (optional link)
- **SA-15** organizational routing rows (optional section)
- **SA-17** constrained path explanation (simulator button)
