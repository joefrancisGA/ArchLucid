# Fix: Diagrams “Unmapped API controller” banners (OP-01 map refresh)

**Model:** Luna / economy is enough. Do **not** redesign the Diagrams page.

**Symptom (SecureNow → Infrastructure → Diagrams, snapshot selected):** two cards at the top of the workbench:

- **Uploaded config proposals**
- **Inference questionnaire**

Each shows:

```
Unmapped API controller: This API controller is missing from the product capability map.
What failed: ArchLucid could not complete this request.
What's intact: Your workspace data and in-progress drafts were not changed by this failed request.
Next step: Retry the action, then open troubleshooting if the error repeats.
```

Retry does nothing. Architects cannot use Diagrams until this 500 stops.

## Root cause (already diagnosed — do not re-litigate)

`ProductLineRouteGateMiddleware` fail-closes **unmapped** controllers with HTTP **500** (not 403). Catalog is `docs/architecture/data/product-capability-map.json`, loaded **once at API startup**.

Both banners GET the same missing row:

- `GET /v1/infra-evidence/snapshots/{snapshotId}/operator-inferred-connections`
- `GET /v1/infra-evidence/snapshots/{snapshotId}/operator-inferred-connections/questionnaire`

Controller type (exists in code, missing from the map):

`ArchLucid.Api.Controllers.InfraEvidence.InfraEvidenceOperatorInferredConnectionsController`

The Diagrams page always mounts `OperatorInferredConnectionsPanel` and `InferenceQuestionnairePanel` when a snapshot is selected. They auto-fetch on mount. They hide only when empty **and** `panelError == null`, so this 500 keeps the cards visible. That hide rule is correct — **do not change it**.

This is **not** a SecureNow product-line 403. A mapped `architecture`-only row would say *Product line cannot use this route*. The 500 title means `TryGetControllerProductLine` failed.

SN-RT-10 / SN-RT-12 / SN-RT-13 shipped the controller + UI without regenerating the OP-01 map.

## Do not

- Do **not** hide, collapse, or feature-flag the Diagrams panels to “fix” the banners.
- Do **not** edit `OperatorInferredConnectionsPanel.tsx`, `InferenceQuestionnairePanel.tsx`, or `DiagramsWorkbenchClient.tsx`.
- Do **not** edit `ProductLineRouteGateMiddleware.cs` or the route-gate evaluator.
- Do **not** map the controller as `architecture` (SecureNow would then 403).
- Do **not** invent a second capability-map file.
- Do **not** reopen OP-07 / OP-08 / **TB-2400** / **TB-2401**.
- Do **not** add GTM **M-90 / M-44 / M-91 / M-92**. Do **not** reopen **TB-135 / TB-136**.
- Do **not** hide desktop review workspace tabs behind **More**.
- Do **not** run full-solution `dotnet test` or `npm ci`.
- Do **not** `git add -A`.

## What to build

Add the missing controller rows to the **existing** OP-01 file:

`docs/architecture/data/product-capability-map.json`

Folder rules in `scripts/ci/build_product_capability_map.py` already classify:

- `Controllers/InfraEvidence` → `capability: infra-evidence`, `productLine: both`
- `Controllers/OperationalSecurity` → `capability: infra-evidence`, `productLine: both`

These rows **must** exist after your change (`status: assigned`, `ownerNote: null`):

| typeName | capability | productLine |
|----------|------------|-------------|
| `ArchLucid.Api.Controllers.InfraEvidence.InfraEvidenceOperatorInferredConnectionsController` | `infra-evidence` | `both` |
| `ArchLucid.Api.Controllers.OperationalSecurity.OperationalSecurityArchitectMetricsController` | `infra-evidence` | `both` |
| `ArchLucid.Api.Controllers.OperationalSecurity.OperationalSecurityAssetAssertionsController` | `infra-evidence` | `both` |
| `ArchLucid.Api.Controllers.OperationalSecurity.OperationalSecurityDeclaredConnectionsController` | `infra-evidence` | `both` |
| `ArchLucid.Api.Controllers.OperationalSecurity.OperationalSecurityPathsController` | `infra-evidence` | `both` |

The last four are the same bug class (unmapped → 500 on Declared connections / related pages). Coverage will fail if you add only the Diagrams controller.

Keep controllers sorted by `typeName` (the file already is).

## Steps (do these in order)

1. Working-tree check (Linux Cloud Agent):

```bash
export PATH="$HOME/.local/bin:$PATH"
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path 'docs/architecture/data/product-capability-map.json'
```

If the script exits **2**, **stop**. Do not overwrite a dirty map.

2. Preferred: regenerate from the official builder:

```bash
python3 scripts/ci/build_product_capability_map.py
```

3. Review `git diff docs/architecture/data/product-capability-map.json`.

   - **Keep** the diff if it only **adds** missing controller rows (and maybe new `applicationNamespaces` prefixes).
   - **Stop and report** if the script **changes** `capability`, `productLine`, or `status` on a row that already existed. Do not silently reclassify live routes. Restore the map (`git restore -- docs/architecture/data/product-capability-map.json`) and use the surgical fallback below.

4. Surgical fallback (only if step 3 would reclassify existing rows): insert the five JSON objects in `typeName` order. Example shape:

```json
{
  "typeName": "ArchLucid.Api.Controllers.InfraEvidence.InfraEvidenceOperatorInferredConnectionsController",
  "capability": "infra-evidence",
  "productLine": "both",
  "status": "assigned",
  "ownerNote": null
}
```

5. If `ProductCapabilityMapCoverageTests` still names other missing `typeName`s, add those the same way (`assigned`, folder-rule product line). Do not leave the coverage test red.

6. Do **not** refresh `product-capability-namespace-allowlist.json` unless the coverage/ratchet test you run in this prompt fails and names that file.

## Acceptance criteria

1. `docs/architecture/data/product-capability-map.json` contains all five `typeName`s above, each `infra-evidence` / `both` / `assigned`.
2. `ProductCapabilityMapCoverageTests.Every_api_controller_is_mapped_exactly_once` is green.
3. No UI, middleware, OpenAPI, or route-tier edits.
4. Staged paths are only the map (plus this prompt if you were asked to land it). No `git add -A`.

## Verification

Emit `STILL EXECUTING... HH:mm:ss` every 8s if a command runs longer than 15s.

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj --filter 'FullyQualifiedName~ProductCapabilityMapCoverage'
```

Expect exit 0.

Optional sanity (no code change): confirm the new inferred-connections `typeName` is present:

```bash
python3 -c "import json; p='docs/architecture/data/product-capability-map.json'; names=[r['typeName'] for r in json.load(open(p))['controllers']]; t='ArchLucid.Api.Controllers.InfraEvidence.InfraEvidenceOperatorInferredConnectionsController'; assert t in names, 'missing'; print('mapped', t)"
```

## Done when

Coverage is green and the inferred-connections controller is in the map as `both`. After API recycle (deploy/restart — not a code step), Diagrams GETs return 200. Empty snapshots hide both panels; snapshots with proposals show the real tables, not the 500 cards.

## After the session

Summarize: map rows added, whether regen or surgical insert, test filter + exit code, and that the API must be recycled for the startup catalog to reload.

## Related

- Gate: `ArchLucid.Api/Middleware/ProductLineRouteGateMiddleware.cs`
- Catalog: `ArchLucid.Core/ProductCapability/ProductCapabilityControllerCatalog.cs`
- Builder: `scripts/ci/build_product_capability_map.py`
- Coverage: `ArchLucid.Architecture.Tests/ProductCapability/ProductCapabilityMapCoverageTests.cs`
- Controller: `ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceOperatorInferredConnectionsController.cs`
- UI mounts (do not edit): `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx`
- Prior contract: `.cursor/prompts/option-preserving-api-01-capability-map.md` (OP-01 is Done; this is a map refresh, not a new OP session)
