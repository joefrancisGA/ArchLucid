# IDX-10 — Private-endpoint opt-in toggle

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-02 (hidden hops already compose). **Do not** default the toggle on. **Do not** show NIC cards.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Every inventory-diagram workbench mode exposes a visible-boundary **Show private endpoints** control that sets `DiagramAstCompileOptions.IncludePrivateEndpointNodes`. Default **off**. Export Mermaid and PNG honor the same flag. Hidden PEs still drive IDX-02 compose.

## Why

The compile option already exists. Operators cannot opt in. Owner asked: do not display private endpoints unless opted in, but keep using them for edge analysis. Without a control, that contract is invisible and Architecture/Security/selected modes may not even be reachable from the parser.

## Applies to every `DiagramMode`

| Mode | Toggle |
|------|--------|
| Executive, Architecture, Network, Security, Identity, Data, FullSubscription, ResourceGroup, SelectedResources, DependencyNeighborhood | Show the control; default off; when on, PE cards for PEs that survive **that mode's** node filter |
| DataFlow / DataArchitecture | Same control; when off, PE cards hidden but PE hops may still place data nodes `in` a VNet; when on, PE cards may appear as endpoints if the stage/type filter includes them |

Also add missing parser keys so enum values are reachable: `architecture`, `security`, `selectedResources` (plus existing keys). Do not remove `full` / `executive` / etc.

## Context

- `DiagramAstCompileOptions.IncludePrivateEndpointNodes`
- `NetworkDiagramNodeFilter.ExcludePrivateEndpoints`
- `InfraEvidenceMermaidModeParser`
- `DiagramsWorkbenchClient.tsx` (operator + SecureNow infrastructure diagrams surfaces — apply to both if they share the client)
- Preview/render API query string — extend honestly; OpenAPI snapshot if the wire contract changes

## What to build

1. API: accept `includePrivateEndpointNodes=true|false` (default false) on preview/render. Thread into compile options for **all** modes.

2. Parser: add `architecture`, `security`, `selectedResources` if missing. `selectedResources` requires selected node ids (mirror neighborhood seed requirement).

3. UI: Carbon `Button` or toggle with visible boundary, sentence case **Show private endpoints**, not a ghost link. State is per workbench session (query param ok). Do not add a desktop review tab.

4. When off: assert zero `Microsoft.Network/privateEndpoints` nodes on forest/Mermaid/PNG for each mode. When on: PEs that pass the mode filter appear; compose must **not** double-draw PE hops (IDX-02 skip-when-visible).

5. Tests:
   - Parser default false.
   - Application render: FullSubscription / Network / Data / DataFlow / Identity / neighborhood × flag off → 0 PE nodes; flag on + PE in fixture → PE node on modes whose filter includes network/data.
   - Vitest: control present on diagrams workbench; default unchecked; toggling refetches with the flag.
   - SecureNow diagrams route if it reuses the client.

## Acceptance criteria

- NICs remain hidden in both toggle states.
- No second PE analysis pipeline.

## Constraints

- OpenAPI / client types if wire contract changes (`docs/library/API_CONTRACTS.md`).
- No GTM / TB-135 / tab collapse.

## Done when

An operator can opt in to PE cards on Full subscription **and** Network **and** Data Flow, and the default canvas still hides them while keeping composed `in` edges.
