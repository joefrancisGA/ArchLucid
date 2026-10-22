# AZ-LAB-01 — Azure lab inventory generator

**Model:** Composer 2.5 slow (`composer-2.5`). That is the least expensive engine allowed for this repo without a separate override. Do not use a fast tier. Do not call any model, hosted or local, while generating inventory rows.

**Repo:** this workspace.

**Scope:** Azure only. Do not add AWS or GCP lab packs.

Paste this file as the whole task.

## Goal

Add a deterministic Azure lab-pack generator and three synthetic inventory ZIPs, reached from a closed disclosure under **Try demo data** on Extract & upload. The three existing showcase cards stay the only scenarios in the default picker.

## Why this approach

The showcase packs are about 21, 23, and 32 resources. They are stories. A landing zone near 500 resources, a later snapshot of that same landing zone, and a small messy estate are for exercising ingest, tables, and diagrams.

A seeded TypeScript function is the generator. It costs nothing after this session, it returns the same ZIP every time, and it does not put a multi-megabyte JSON file in the client bundle. Calling a model to invent resources would be slower, non-deterministic, and the expensive engine for a job that is a loop over a fixed type table.

Rejected alternatives:

- More cards beside Customer intake modernization. A pack that is supposed to look wrong would be read as a product bug.
- Checked-in giant `resources.json` files. They bloat the bundle and drift.
- Generating rows inside the picker render. `listInventoryDemoScenarios` already calls `buildResources()` for the three small packs. Doing that for 500 rows on every paint is the hitch to avoid.

## Read first

- `archlucid-ui/src/lib/arch-lucid-azure-extractor-demo-scenarios.ts` — showcase ids, ZIP entries, `zipSync` cache.
- `archlucid-ui/src/lib/arch-lucid-azure-extractor-demo-scenarios.test.ts` — the test that pins three showcase ids.
- `archlucid-ui/src/lib/arch-lucid-inventory-demo-scenarios.ts` — `listInventoryDemoScenarios` must stay showcase-only.
- `archlucid-ui/src/components/wizard/InventoryDemoScenarioPicker.tsx` — default rail. Do not feed lab ids into it.
- `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.tsx` — aside that mounts the picker.
- `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/use-extract-upload-demo.ts` — live "Try with Demo Data" path.
- `archlucid-ui/src/lib/administration/extract-upload-demo-scenario-url.ts` — `demoScenario` query param.
- `archlucid-ui/src/lib/extract-upload-settings-page-copy.ts` — aside copy.
- `ArchLucid.Core/AzureExtractor/AzureExtractorPackageInventoryReader.cs` (`ReadResources`, `MapResourceRow`).
- `ArchLucid.Core/AzureExtractor/AzureExtractorResourceInventoryReader.cs` (`TryReadFromZip`).

Showcase `getAzureExtractorDemoZipBytes` writes `resources.json` as an object `{ "resources": [ ... ] }` and uses `type` without `resourceType`. Both server readers require a JSON **array**. `AzureExtractorResourceInventoryReader` keeps a row only when `name` and `resourceType` are present. `MapResourceRow` accepts `type` or `resourceType`, and uses `id` when present. Lab packs must satisfy those readers. Do not change the three showcase builders in this task.

## What to build

### 1. Generator module

New file: `archlucid-ui/src/lib/azure-lab-inventory-generator.ts`.

Export a row type with concrete fields: `id`, `name`, `type`, `resourceType`, `location`, `resourceGroup`. `type` and `resourceType` are the same ARM type string. `id` is a full ARM id:

`/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/{type}/{name}`

No `properties` bag. No secrets, connection strings, keys, or PHI-like values. Subscription ids are the fake GUIDs below, not a real tenant.

Export three builder functions. Each is deterministic: same arguments, same array, same order.

**Landing zone.** `buildAzureLabLandingZoneResources()`.

- Exactly 500 rows. Export `AZURE_LAB_LANDING_ZONE_RESOURCE_COUNT = 500`.
- Subscription `55555555-5555-5555-5555-555555555555`.
- 16 fixed resource groups, names stable and readable (`lz-connectivity`, `lz-identity`, `lz-management`, then `lz-app-01` through `lz-app-13`).
- Locations alternate `eastus` and `westus2` by group index. Do not use a random source.
- Fixed type table, cycled by `(groupIndex + indexInGroup) % tableLength`: `Microsoft.Network/virtualNetworks`, `Microsoft.Network/privateEndpoints`, `Microsoft.Network/applicationGateways`, `Microsoft.ContainerService/managedClusters`, `Microsoft.Web/sites`, `Microsoft.Sql/servers/databases`, `Microsoft.KeyVault/vaults`, `Microsoft.Storage/storageAccounts`, `Microsoft.OperationalInsights/workspaces`, `Microsoft.Compute/virtualMachines`, `Microsoft.Compute/disks`.
- Names are `{prefix}-{groupSlug}-{n}` with `n` starting at 1 inside the group. Prefixes are short and stable (`vnet`, `pe`, `agw`, `aks`, `app`, `sql`, `kv`, `st`, `law`, `vm`, `disk`). No slashes in names.

**Later snapshot.** `buildAzureLabLandingZoneDriftResources()`.

- Start from the landing-zone array.
- Drop the last 15 rows.
- Append 15 new rows in a new group `lz-app-new`, names `added-app-1` through `added-app-15`, type `Microsoft.Web/sites`, location `eastus`, same subscription.
- Export `AZURE_LAB_LANDING_ZONE_DRIFT_RESOURCE_COUNT = 500`.
- Kept rows stay in the same order. This is a set delta, not a reshuffle.

**Messy estate.** `buildAzureLabMessyEstateResources()`.

- Export `AZURE_LAB_MESSY_ESTATE_RESOURCE_COUNT` equal to the array length. Keep it between 40 and 80 so the odd rows are findable.
- Subscription `66666666-6666-6666-6666-666666666666`.
- Hand-list the odd rows. Do not randomize them.
- Two resources with the same `name` in different resource groups, so the ARM ids differ.
- One row with location `""` (the server treats whitespace location as null). `name` and `resourceType` still present.
- One row whose type is `Microsoft.Contoso/widgets`, with `isUnknownType: true` on that row only. Extend the row type with optional `isUnknownType`.
- One name of 180 characters, ASCII letters and digits only, no slash.
- One name that contains `Nätverk-テスト`.
- One private-endpoint row named `pe-missing-target-1`. The missing target is explained in the README, not by a dangling id field.
- Every name is unique inside its resource group. Every `id` is unique.

No clock, no `Math.random`, no `crypto`. A fixed table is enough. Do not add a seed parameter unless a test needs two seeds; these three packs are the product, and their inputs are constants.

### 2. Scenario module

New file: `archlucid-ui/src/lib/azure-lab-inventory-demo-scenarios.ts`.

Export:

- `AZURE_LAB_DEMO_SCENARIO_IDS`: `"azure-lab-landing-zone"`, `"azure-lab-landing-zone-later"`, `"azure-lab-messy-estate"`.
- `AzureLabDemoScenarioId`.
- `isAzureLabDemoScenarioId`.
- `getAzureLabDemoScenario`.
- `listAzureLabDemoScenarioSummaries()` returning `{ id, title, subtitle, resourceCount }`. `resourceCount` is the exported constant. This function must not call a builder.
- `getAzureLabDemoZipBytes(scenarioId)` with a module-level `Map` cache. Build on first call only.
- `createAzureLabDemoZipFile(scenarioId)`.

Titles and subtitles, sentence case:

| Id | Title | Subtitle |
|----|-------|----------|
| `azure-lab-landing-zone` | Landing zone, 500 resources | Sixteen resource groups across eastus and westus2. Synthetic scale sample. |
| `azure-lab-landing-zone-later` | Landing zone, later snapshot | Same landing zone with 15 resources removed and 15 added. For drift. |
| `azure-lab-messy-estate` | Messy estate | Duplicate names, an unknown type, and a policy row for a missing resource. Expected to look incomplete. |

Manifest (`schemaVersion` 1), one per pack:

- Landing zone: `scriptVersion` `0.0.0-lab-landing-zone`, `collectionTimestamp` `2026-06-21T12:00:00.000Z`, scope ending in `/resourceGroups/lz-connectivity`, `switchesUsed` `[]`.
- Later snapshot: `scriptVersion` `0.0.0-lab-landing-zone-later`, `collectionTimestamp` `2026-06-22T12:00:00.000Z`, same subscription and scope, `switchesUsed` `[]`.
- Messy estate: `scriptVersion` `0.0.0-lab-messy-estate`, `collectionTimestamp` `2026-06-21T12:30:00.000Z`, scope ending in `/resourceGroups/MessyPrimaryRg` while rows also exist in at least one other group, `switchesUsed` `[]`.

`resources.json` is `JSON.stringify` of the **array**, not `{ resources: [...] }`.

`policy-compliance.json`:

- Landing zone and later snapshot: `summary` `{ total: 20, nonCompliant: 2, compliant: 18 }`. Two `states` rows whose `resourceId` values are ids that exist in that pack (first Key Vault, first storage account). `complianceState` `NonCompliant`. Policy names can match the showcase wording style.
- Messy estate: one `states` row whose `resourceId` is `/subscriptions/66666666-6666-6666-6666-666666666666/resourceGroups/MissingRg/providers/Microsoft.KeyVault/vaults/does-not-exist`. That id must not appear in the resource array. `summary.nonCompliant` is 1.

`README.txt` always contains `Synthetic lab inventory. Not customer evidence.`

- Messy estate also contains `Expected to look incomplete.`
- Later snapshot also contains `Later snapshot of the landing zone lab pack.`

`architecture-diagram.mmd` is a short group sketch. Do not emit one node per resource.

ZIP filename: `archlucid-lab-landing-zone.zip`, `archlucid-lab-landing-zone-later.zip`, `archlucid-lab-messy-estate.zip`.

Do not import this module from `arch-lucid-inventory-demo-scenarios.ts`. Do not append these ids to `AZURE_EXTRACTOR_DEMO_SCENARIO_IDS`.

### 3. Extract & upload disclosure

On Extract & upload only, under the existing showcase picker and above **Try with Demo Data**, add a `<details>` disclosure. Closed by default. Open when the selected id is a lab id (including a `demoScenario` deep link).

Summary text: `Scale and edge samples`.

Body line: `These samples exercise large and irregular Azure inventories. Edge samples are expected to look incomplete.`

Put both strings in `extract-upload-settings-page-copy.ts`.

Inside the disclosure, a radiogroup of the three lab summaries. Reuse the showcase button styling (`OPERATOR_SELECTION.tile` when selected, neutral border otherwise). `data-testid` values:

- `extract-upload-lab-demo-disclosure`
- `extract-upload-lab-demo-scenario-picker`
- `extract-upload-lab-demo-scenario-{id}`

Selecting a lab id clears the showcase selection, and selecting a showcase id clears the lab selection. One id is selected at a time. The existing **Try with Demo Data** button uploads whichever id is selected.

Widen the live path in `use-extract-upload-demo.ts` and `extract-upload-demo-scenario-url.ts` so `demoScenario` accepts a showcase id or a lab id. Unknown values still fall back to the current showcase default. Resolve zip bytes and wizard prefill from the matching catalog. Lab wizard prefill uses the scenario system name and a description that starts with `Demo Azure lab package`.

Also update `use-extract-upload-settings.ts` if it still types this upload. Do not delete either hook.

Do not mount the lab picker on `WizardStepEvidenceUpload`, `AzureExtractorPackageZipField`, or `Tier1InventoryZipUploadPanel`.

`AzureExtractorDemoScenarioPicker` stays a pass-through to the showcase picker.

### 4. Code style

Match the surrounding TypeScript. Concrete types, not `var`. Imports at the top. A blank line before `if` and `for` unless it is the first line in the function. A short comment on the ARM id format and on why `resources.json` is an array. No new dependency. No new finding engine, `EngineType`, or coverage engine.

## Tests

From `archlucid-ui/`:

`npx vitest run src/lib/azure-lab-inventory-generator.test.ts src/lib/azure-lab-inventory-demo-scenarios.test.ts src/lib/arch-lucid-azure-extractor-demo-scenarios.test.ts src/lib/administration/extract-upload-demo-scenario-url.test.ts src/components/wizard/InventoryDemoScenarioPicker.test.tsx`

Add `extract-upload-demo-scenario-url.test.ts` if that file does not exist yet. Cover showcase ids, lab ids, and an unknown value.

Generator tests:

- Landing zone length is 500, drift length is 500, messy length equals its constant and is between 40 and 80.
- Two landing-zone calls return deep-equal arrays.
- Drift shares 485 ids with the landing zone, drops 15, and adds the 15 `added-app-*` ids.
- Messy estate has a duplicated name across groups, an empty location, `Microsoft.Contoso/widgets` with `isUnknownType: true`, a 180-character name, `Nätverk-テスト`, and `pe-missing-target-1`.
- Every lab `id` is unique. No name contains `/`.

Scenario tests:

- `listAzureLabDemoScenarioSummaries()` resource counts equal the constants and do not require a second build to be correct. Spy or count calls if practical; at minimum, the summary module must not call `zipSync` during list.
- `getAzureLabDemoZipBytes` returns the same `Uint8Array` instance on the second call.
- Unzip shows `manifest.json`, `resources.json`, `policy-compliance.json`, `README.txt`, `architecture-diagram.mmd`.
- `resources.json` parses as an array. First row has `name`, `type`, `resourceType`, `id`.
- `readArchLucidAzurePackageZipFromBytes` returns `ok: true`.
- README lines above are present on the matching pack.
- Messy policy `resourceId` is absent from messy resource ids.
- `AZURE_EXTRACTOR_DEMO_SCENARIO_IDS` still has length 3.
- `listInventoryDemoScenarios("azure")` still has length 3 and does not include a lab id.

Picker or page test, focused, not a browser crawl:

- The lab disclosure is present and closed when the selected id is `customer-intake-modernization`.
- Lab scenario buttons are not inside `extract-upload-demo-scenario-picker`.

If a page test is too heavy because of the settings client, cover the disclosure with a small component test around the new picker plus a unit test that the disclosure `open` flag is true only for lab ids. Put that flag in a pure helper, `isAzureLabDemoScenarioId`, and use it from the page.

## Acceptance criteria

- Extract & upload still shows exactly three showcase cards.
- Scale and edge samples are behind a closed disclosure on that page only.
- Choosing a lab pack and **Try with Demo Data** uploads a ZIP whose `resources.json` is an array the server readers can map.
- Landing zone is 500 resources. The later snapshot is the same set plus and minus 15. Messy estate is the odd pack, and its copy says it is expected to look incomplete.
- No model call, no AWS pack, no GCP pack, no new coverage engine.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Exit 2 means stop and report that path.
- Do not hide desktop review workspace tabs behind a More menu.
- Do not add a finding engine or change `DeterministicInsightDensityGate`.
- Do not flip `AgentExecution:Mode` away from Simulator.
- Sentence case. Visible-boundary buttons (no ghost or link variant). The disclosure summary is a `<summary>`, not a new button variant.
- No full-solution `dotnet build`. No dev server. C# files stay untouched, so no compile check is required unless you break that rule.
- Commit only when the user names the branch in the same request. Suggested name shape: `cursor/azure-lab-inventory-generator-<session-suffix>`.

## Done when

A test builds the landing-zone ZIP once, reads `resources.json` as an array of 500 rows with `resourceType` and ARM `id`, and `listInventoryDemoScenarios("azure")` still returns the original three showcase ids.

## Design notes for the implementer

Security: fake subscription GUIDs only. The messy pack is odd names and a missing policy target, not credentials.

Scalability: 500 rows is the department size. The ZIP is built on first download and cached. Listing the disclosure does not build it. Stay far under the 200 MB upload cap. Do not jump to tens of thousands in this task.

Reliability: no clock and no random source, so two clicks upload the same bytes.

Cost: generation is a local loop. `switchesUsed` is empty so the pack does not imply a Cost Management or retail-price query.
