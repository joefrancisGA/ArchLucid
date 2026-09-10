# SecureNow path inspect workbench (SA-16)

Operators stay in the remediation factory priority queue. Selecting a row opens an inline **Path inspect** panel that loads the cited architect path without leaving the desk.

## UI surfaces

- **Remediation factory** (`/security/remediation-factory`, `/governance/remediation-factory`): inline panel below the priority table when a row is selected.
- Empty state when the finding has no `PathId`: “No architect path cited — this finding is resource-scoped.”

## Panel contents

| Section | Source |
|--------|--------|
| Path kind + confidence **band** | `GET /v1/operational-security/paths/{pathId}` |
| Weakest hop callout | `weakestHop`, `weakestHopReason` |
| Hops table (from, to, edge, provenance, band) | `hops[]` |
| Cut points | `relatedCutPoints[]` |
| Organizational routing | `routing[]` (parsed when present; OpenAPI regen may lag SA-15) |
| Advisory instance link | `GET /v1/infra-evidence/remediation-instances?findingId=` → remediation workbench deep link |

## Constraints (product)

- No percentage display for path confidence.
- No force-directed graph as the primary view.
- No desktop workspace tab collapse or **More** overflow changes.
- Keyboard: selecting a priority row moves focus to the path inspect panel (`tabIndex={-1}`, focus-visible ring).

## Frontend modules

- `archlucid-ui/src/lib/security-evidence-path-api.ts`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`

## Depends on

- **SA-04** path inspector API
- **SA-14** advisory remediation instances (optional link)
- **SA-15** organizational routing rows (optional section)
