# SN-QQ-08 — Map the SecureNow questions controller

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not rebuild the question queue. Do not implement SN-QQ-04, SN-QQ-05, or SN-QQ-06 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

**Depends on:** `InfraEvidenceSecureNowQuestionsController` already exists. SN-QQ-07 already shows the API problem on Diagrams. This is the same map gap SN-RT-14 closed for the inferred-connections controller. Extend the existing OP-01 map. Do not invent a second file.

## Goal

SecureNow Diagrams can load the subscription question queue. The page stops saying "Unmapped API controller: This API controller is missing from the product capability map."

## Why

On subscription `Hmd_HI_HAP_Non_Prod`, snapshot `Hmd_HI_HAP_Non_Prod · 10/3/2026, 17:55 UTC` (`fb8c5cd7-b8e9-48a5-84a9-89385ed66dd1`), Diagram type is still "Select Type". The snapshot dropdown already listed that capture. Above the form the pink line is:

```text
Unmapped API controller: This API controller is missing from the product capability map.
```

Under it, the `api-problem` recovery says ArchLucid could not complete this request, workspace data and drafts were not changed, and the reader should retry.

`ProductLineRouteGateMiddleware` returns HTTP 500 with that title and detail when `TryGetControllerProductLine` cannot find the controller `FullName` in `docs/architecture/data/product-capability-map.json`. A product-line mismatch would say "Product line cannot use this route" and return 403. This page is the unmapped 500.

The question queue calls both of these GETs as soon as a snapshot is selected:

- `/v1/infra-evidence/snapshots/{snapshotId}/questions`
- `/v1/infra-evidence/snapshots/{snapshotId}/operator-inferred-connections`

`InfraEvidenceOperatorInferredConnectionsController` is already on the map as `infra-evidence` / `both` / `assigned`. `InfraEvidenceSnapshotsController` is mapped the same way, which is why the snapshot dropdown works. This type name is absent:

```text
ArchLucid.Api.Controllers.InfraEvidence.InfraEvidenceSecureNowQuestionsController
```

Lookup is an exact ordinal `FullName` match. `ArchLucid.Application.InfraEvidence` on the map does not cover the controller row. `CONTROLLER_FOLDER_RULES["InfraEvidence"]` in `scripts/ci/build_product_capability_map.py` is `("infra-evidence", "both")`. No override exists for this type.

## What to build

Add this row exactly once, in `typeName` sort order with the other `ArchLucid.Api.Controllers.InfraEvidence.*` rows:

```json
{
  "typeName": "ArchLucid.Api.Controllers.InfraEvidence.InfraEvidenceSecureNowQuestionsController",
  "capability": "infra-evidence",
  "productLine": "both",
  "status": "assigned",
  "ownerNote": null
}
```

`productLine` stays `both`. `architecture` would 403 SecureNow Diagrams. Do not mark the row `disputed`.

Prefer:

```bash
python3 scripts/ci/build_product_capability_map.py
```

Review the diff of `docs/architecture/data/product-capability-map.json`. Keep the new questions-controller row, and any other new controller the coverage test also requires. If the script reclassifies an existing assigned row (`capability`, `productLine`, `status`, or `ownerNote`), stop. Revert those reclassifications. Hand-insert only the missing controller row. Do not invent a second map file.

Do not change `ProductLineRouteGateMiddleware`, the questions controller, the question-queue UI, error-recovery copy, OpenAPI, or route-tier policy. Do not add a try/catch that turns the 500 into an empty question list.

## Read first

- `ArchLucid.Api/Middleware/ProductLineRouteGateMiddleware.cs`
- `ArchLucid.Core/ProductCapability/ProductCapabilityControllerCatalog.cs`
- `docs/architecture/data/product-capability-map.json`
- `scripts/ci/build_product_capability_map.py`
- `ArchLucid.Architecture.Tests/ProductCapability/ProductCapabilityMapCoverageTests.cs`
- `ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceSecureNowQuestionsController.cs`
- `.cursor/prompts/securenow-runtime-connection-14-operator-inferred-capability-map.md` (the same map fix for the neighboring controller)

## Tests

```bash
python3 -c "import json; p='docs/architecture/data/product-capability-map.json'; d=json.load(open(p)); rows=[c for c in d['controllers'] if c['typeName'].endswith('InfraEvidenceSecureNowQuestionsController')]; assert len(rows)==1, rows; assert rows[0]['capability']=='infra-evidence'; assert rows[0]['productLine']=='both'; assert rows[0]['status']=='assigned'; print(rows[0])"
export PATH="$HOME/.dotnet:$PATH"
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj --filter 'FullyQualifiedName~ProductCapabilityMap'
```

`ProductCapabilityMapCoverageTests.Every_api_controller_is_mapped_exactly_once` is included in that filter. Do not run the full solution. Do not run `npm ci`. Skip `agent-compile-check.ps1` unless you edited C#.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Stage only this prompt's paths. No `git add -A`.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not hide a diagrams tab behind More.
- Do not rebuild OP-01 or OP-04. Do not add product-line headers.
- Do not re-run SN-QQ-01 through SN-QQ-07 as greenfield.

## Done when

The map contains `InfraEvidenceSecureNowQuestionsController` exactly once, with `infra-evidence` / `both` / `assigned`. The coverage tests are green. The session summary says whether regen reclassified any existing rows (must be none). After the API process reloads the JSON, selecting that snapshot no longer shows "Unmapped API controller".
