# SN-RT-14 — Map operator-inferred connections on the OP-01 capability map

**Wave:** SecureNow runtime connections (**SN-RT**). **Follow-on to SN-RT-10 / SN-RT-12 / SN-RT-13.** **Depends on:** those controllers already exist on trunk.

Do not implement from the wave index. Implement only *What to build*.

This is **not** OP-01 greenfield. The map already exists. **Extend it — do not invent a second file.**

## Symptom (already diagnosed — do not re-diagnose)

On SecureNow **Diagrams**, with a snapshot selected, two panels fail independently with the same problem:

```text
Unmapped API controller
This API controller is missing from the product capability map.
```

Generic InternalError recovery copy follows (“What failed / What’s intact / Next step”). **Retry** re-GETs the same routes and keeps failing.

| Panel | Load GET |
|-------|----------|
| Uploaded config proposals | `/v1/infra-evidence/snapshots/{snapshotId}/operator-inferred-connections` |
| Inference questionnaire | `/v1/infra-evidence/snapshots/{snapshotId}/operator-inferred-connections/questionnaire` |

Both actions live on `ArchLucid.Api.Controllers.InfraEvidence.InfraEvidenceOperatorInferredConnectionsController`.

Subscription list, snapshot picker, snapshot id, executive-diagram checkboxes, and export chrome already work. Those use mapped controllers such as `InfraEvidenceSnapshotsController`.

## Why this 500 happens

`ProductLineRouteGateMiddleware` (OP-04) **fails closed** when `IProductCapabilityControllerCatalog.TryGetControllerProductLine` cannot find the controller `FullName` in `docs/architecture/data/product-capability-map.json`. Unmapped → **500** `Unmapped API controller`.

This is **not** a product-line 403. A Security-vs-architecture-only miss would title **Product line cannot use this route**.

SN-RT-10/12/13 shipped the controller and Diagrams panels without regenerating the OP-01 map. Neighbor InfraEvidence rows are present. This type name is absent:

```text
ArchLucid.Api.Controllers.InfraEvidence.InfraEvidenceOperatorInferredConnectionsController
```

Lookup is an exact ordinal `FullName` match. `ArchLucid.Application.InfraEvidence` is already on the map; that does **not** cover the controller row.

`ArchLucid.Api.csproj` already copies the JSON to the API output (`CopyToOutputDirectory=PreserveNewest`). No second copy step.

## Expected row (after fix)

`CONTROLLER_FOLDER_RULES["InfraEvidence"]` in `scripts/ci/build_product_capability_map.py` is `("infra-evidence", "both")`. No override exists for this type. The row **must** be:

```json
{
  "typeName": "ArchLucid.Api.Controllers.InfraEvidence.InfraEvidenceOperatorInferredConnectionsController",
  "capability": "infra-evidence",
  "productLine": "both",
  "status": "assigned",
  "ownerNote": null
}
```

`productLine` **must** stay `both`. `architecture` would 403 SecureNow Diagrams. Do not mark `disputed`.

## What to build

1. Working-tree check any tracked path before edit. New JSON/docs you create this session are fine.
2. Prefer regenerate:

```bash
python3 scripts/ci/build_product_capability_map.py
```

3. Review the diff of `docs/architecture/data/product-capability-map.json`:
   - **Keep** the new operator-inferred controller row (and any other *new* controller the coverage test would also require).
   - If the script **reclassifies existing assigned rows** (capability / productLine / status / ownerNote changes), **stop**. Revert those reclassifications. Hand-insert only the missing controller row in `controllers` sort order (`typeName` ordinal, with the other `ArchLucid.Api.Controllers.InfraEvidence.*` rows). Do **not** invent a second map file.
4. Confirm the expected row exists **exactly once**.
5. Do **not** change `ProductLineRouteGateMiddleware`, the controller, the two Diagrams panels, error-recovery copy, OpenAPI, or route-tier policy. This is a map-row gap, not a behavior gap.
6. Do **not** implement SN-RT-HOLD (secret harvest, auto-answer, merge observed into May access, hosted POST).

## Key files (read in this order)

| Area | File |
|------|------|
| Gate | `ArchLucid.Api/Middleware/ProductLineRouteGateMiddleware.cs` |
| Catalog | `ArchLucid.Core/ProductCapability/ProductCapabilityControllerCatalog.cs` |
| Map | `docs/architecture/data/product-capability-map.json` |
| Regenerator | `scripts/ci/build_product_capability_map.py` |
| Coverage | `ArchLucid.Architecture.Tests/ProductCapability/ProductCapabilityMapCoverageTests.cs` |
| Controller | `ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceOperatorInferredConnectionsController.cs` |
| UI loads | `archlucid-ui/src/lib/infra-evidence/operator-inferred-connection-api.ts` |
| Copy-into-output | `ArchLucid.Api/ArchLucid.Api.csproj` (existing `Content` include) |

## Acceptance criteria

- Map contains the operator-inferred controller **exactly once**, with `infra-evidence` / `both` / `assigned`.
- `ProductCapabilityMapCoverageTests` is green (`Every_api_controller_is_mapped_exactly_once` included).
- No middleware, controller, or UI behavior change.
- SecureNow Diagrams can call list + questionnaire without the unmapped 500 (after API restart so the catalog reloads the JSON). Retry on the two panels should then succeed or show empty/proposal UI — not this problem title.
- Zero new map formats. JSON remains the OP-01 contract.

## Constraints

- Working-tree check. Stage only this prompt’s paths. **No `git add -A`.**
- Do **not** hide desktop review workspace tabs behind **More**.
- Do **not** 403 `both` / health / OpenAPI. Do **not** add headers (OP-03). Do **not** rebuild OP-01/OP-04.
- Do **not** move Application folders or split the API host.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. Do **not** implement G-REAL-06.
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if compile/test >15s.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.

## Verification

```bash
python3 -c "import json; p='docs/architecture/data/product-capability-map.json'; d=json.load(open(p)); rows=[c for c in d['controllers'] if c['typeName'].endswith('InfraEvidenceOperatorInferredConnectionsController')]; assert len(rows)==1, rows; assert rows[0]['capability']=='infra-evidence'; assert rows[0]['productLine']=='both'; assert rows[0]['status']=='assigned'; print(rows[0])"
export PATH="$HOME/.dotnet:$PATH"
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj --filter 'FullyQualifiedName~ProductCapabilityMap'
```

Heartbeat every 8s if >15s. Do **not** `npm ci`. Do **not** run full-solution `dotnet test`. Compile check is optional (JSON-only change); skip `agent-compile-check.ps1` unless you edited C#.

## Done when

The map row exists, coverage tests are green, and the session summary lists: files changed, whether regen reclassified any existing rows (must be none), tests run, residual (API process must reload the JSON).

Suggested Cloud Agent branch: `cursor/sn-rt-operator-inferred-capability-map-a7c1`. Name the branch in any commit/push request.
