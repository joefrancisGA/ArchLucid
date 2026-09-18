# AX-DC-06 — Outline / edge inspector: confidence band and rationale

**Wave:** AX-DC. **Depends on:** AX-DC-03 preferred; AX-DC-04 preferred. **Do not** add collectors.

Follow [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) global constraints.

## Goal

When an operator selects an edge in the diagram outline (or edge list), show **provenance**, **inference source**, **confidence band** (Proven / Probable / Inferred / Declared), and a one-line **authorization ≠ traffic** hint for `appAuthorizedAccess` edges.

## Why

IDP-03 added declared-connection rationale on the outline for HumanAssertion. Inventory-derived connection edges carry `ProvenanceKind` and `InferenceSource` on `DiagramEdge` but the workbench outline still reads like anonymous “connects”. Auditors ask why a line exists — especially for RBAC-derived **May access**.

## Context

- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx`
- `archlucid-ui/src/lib/infra-evidence/format-infra-evidence-outline-edge-to-label.ts`
- `archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.ts`
- API outline payload — ensure `provenanceKind`, `inferenceSource`, `declaredConnectionId` flow to client (extend if missing)
- IDP-03 declared panel pattern — reuse layout, do not fork a second inspector

## What to build

1. Extend outline edge model (TS + API if needed) with optional `provenanceKind`, `inferenceSource`, `visualKind` (from AX-DC-03).
2. Edge detail panel (or expanded row):
   - **Source:** inventory extract vs human-declared (map `ProvenanceKind`)
   - **Band:** Proven / Probable / Inferred / Declared / AI-inferred
   - **Inference source:** e.g. `inventory-app-authorized-access`, `inventory-hostname-inferred-target`
   - For `appAuthorizedAccess`: static hint “Authorization from managed identity and RBAC — does not prove runtime traffic.”
   - For `hostnameInferredTarget`: hint “Hostname match in app settings — confirm in application configuration.”
3. Declared connections: keep IDP-03 rationale/expiry — do not regress.
4. Tests:
   - `InfraEvidenceDiagramOutline.test.tsx`: selecting **May access** edge shows Probable band + authorization hint
   - HumanAssertion edge still shows declared rationale
5. a11y: band text in panel, not color-only.

## Acceptance criteria

- Outline answers “why does this line exist?” for MI+RBAC edges without opening the ZIP.
- No new Azure calls. No promotion to ObservedFact in copy.

## Constraints

- `cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx`
- API tests if DTO extended
- Heartbeat if >15s.

## Done when

Workbench edge inspector distinguishes **May access** (Probable authorization) from PE (Proven structural).
