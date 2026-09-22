# ABQ-51 — Pin the AzureRM resource catalog and match source ids exactly

**Status: implemented.** Do not re-run this prompt. Recognition is catalog membership in `TerraformAzurermResourceTypeCatalog`.

**After ABQ-50.** Do not hunt. Do not append another `normalized.Contains("…")` fragment. Do not ship `gaf` / `gbg` / any new three-letter topology token. ABQ-50 still allows topology **zones**; it does not allow this treadmill to continue.

## Goal

`LooksLikeTerraformDatastoreSourceId` and `LooksLikeTerraformServiceSourceId` return true exactly when the parsed `azurerm_<slug>` is in the vendored HashiCorp AzureRM **v5.6.0** resource catalog, or on a short explicit retired-alias list. Completion is an empty diff between that vendored file and commit `daf16e27e2d45d2fb6b7d83644dc201363b05e62`. A source id is not recognized because `er`, `vm`, or `fty` occurs inside it.

## Why

Those two methods are one shared `Contains` chain (about 1,734 clauses). Hundreds of the clauses are invented three-letter tokens (`aaf` … `fty`) added so a Compute-category node with source id `azurerm_<token>.main` would receive a `ds-` alias. That set has no last element.

The published provider catalog is finite. Pin **hashicorp/terraform-provider-azurerm v5.6.0** (published 2026-09-17, commit `daf16e27e2d45d2fb6b7d83644dc201363b05e62`). `website/docs/r/*.html.markdown` at that commit is **1,105** resource slugs, from `aadb2c_directory` through `workloads_sap_three_tier_virtual_instance`. The directory tree is not truncated.

Against that catalog, every published type already returns true under the current chain, and **154** of them return true only because a fragment of length ≤ 3 occurs inside the name (`er` matches `server`, `certificate`, `balancer`). Several synthetic tokens already collide with real names (`arc`, `bot`, `rot`, `sig`). Calling that “complete” is an accident. Exact membership is the completion test.

Both methods already share one fragment set, so this prompt does not split datastore types from service types. One membership function serves both callers:

- Datastore-category nodes still always get the `ds-` alias; the service alias still depends on this check.
- Other categories still always get the service alias; the `ds-` alias still depends on this check.

Design constraints for the replacement:

- **Security.** Exact slug membership stops a two-letter fragment from attaching a datastore alias to an unrelated source id.
- **Scalability.** One `HashSet` lookup replaces a linear scan of every fragment. The set is 1,105 strings.
- **Reliability.** The pin plus a CI diff fails when HashiCorp adds or removes a documented resource. An empty diff is done.
- **Cost.** The catalog is an embedded text file. Runtime does not call GitHub. The remote diff runs only in the CI check.

Rejected alternatives: more three-letter tokens (unbounded, and they collide); keeping `Contains` because every catalog name already matches (the match is `er`); two hand-classified subset lists (the code does not have two lists today, and this prompt does not invent a datastore-versus-service policy).

## Context

- `ArchLucid.Application/Runs/Orchestration/TopologyProposalTerraformSourceIdHeuristics.cs` — both `LooksLikeTerraform*` methods. Leave `AddGraphNodeSyntheticLabelEndpointKeys` and `AddGraphNodeSyntheticLabelResolutionAliases` in place; they already call these methods.
- Hand-written regressions in `ArchLucid.Application.Tests/Runs/Orchestration/AgentTopologyProposalMergeGateTests.cs` (`azurerm_lb`, `azurerm_firewall`, `azurerm_storage_account`, and the other real source ids in that file).
- Generated files `AgentTopologyProposalMergeGate{Token}Tests.cs` whose only non-catalog source id is a synthetic token (`azurerm_bbg.main`, `azurerm_fty.main`, …). There are hundreds. They exist to lock the treadmill.
- Week-meter ban from ABQ-50: `scripts/ci/al-bug-ban-weekk-uom.py` (or the retired-class script, whichever landed). Its fixture that topology `Contains("lb")` is **not** a weekk violation must keep passing. Retarget that fixture at the catalog type if it asserts the heuristics file still contains `Contains("lb")`. Do not weaken the weekk regex.
- CI job `azure-extractor-pester` in `.github/workflows/ci.yml` already runs `python3 scripts/ci/al-bug-ban-retired-classes.py` as a blocking step. Add the catalog check beside it.

## What to build

### 1. Vendor the catalog

Fetch the resource list from the **pinned commit**, not from `latest` and not from `main`.

1. `GET https://api.github.com/repos/hashicorp/terraform-provider-azurerm/git/commits/daf16e27e2d45d2fb6b7d83644dc201363b05e62` and read `tree.sha`.
2. Walk trees `website` → `docs` → `r` via `GET /repos/hashicorp/terraform-provider-azurerm/git/trees/{sha}`.
3. Slugs are blob names that end in `.html.markdown`, with that suffix removed. Sort with ordinal order. One slug per line.
4. Abort if the tree is truncated, the count is not **1105**, or any of these sentinels is missing: `aadb2c_directory`, `storage_account`, `firewall`, `lb`, `linux_virtual_machine`, `ai_foundry`, `windows_web_app`, `workloads_sap_three_tier_virtual_instance`.
5. If GitHub is unreachable, stop. Do not invent slugs and do not copy a partial list.

Write:

- `ArchLucid.Application/Runs/Orchestration/azurerm-resource-types-v5.6.0.txt`
  - First line comment: `# hashicorp/terraform-provider-azurerm v5.6.0 commit daf16e27e2d45d2fb6b7d83644dc201363b05e62 count 1105`
  - Then the 1,105 slugs. No duplicates.
- Embed that file on `ArchLucid.Application.csproj` the same way other `EmbeddedResource` items in that project are included.
- `TerraformAzurermResourceTypeCatalog.cs` — one class. Loads the embedded file once into a `HashSet<string>` with `StringComparer.OrdinalIgnoreCase`. Null-check the manifest stream. Expose the count and a method that reports whether a parsed slug is a member.

### 2. Parse, then look up

`TerraformAzurermResourceTypeParser.cs` — one class.

- Null or whitespace → no slug.
- Trim. Find the first bounded token `(?i)(?<![A-Za-z0-9_])azurerm_([A-Za-z0-9_]+)`.
- The capture is the slug. `azurerm_storage_account.main` → `storage_account`. `azurerm_linux_virtual_machine.main` → `linux_virtual_machine`.
- No `azurerm_` token → no slug. A bare `server`, `er`, or `storage_account` does not match.
- Do not match ARM ids in this prompt. Do not substring-scan the remainder of the string.

`TerraformAzurermRetiredResourceAliases.cs` — one class, a small `HashSet` plus a one-line comment per slug naming the surviving hand-written test or production string that requires it.

Build that set by search, not by guessing:

1. After the catalog file exists, search production and **hand-written** tests for `azurerm_<slug>`.
2. Ignore generated `AgentTopologyProposalMergeGate*.cs` files you are about to delete.
3. If the slug is in the catalog, it is not retired.
4. If the only hits are synthetic gate tests, do not retire the slug. Delete those tests instead.
5. If `AgentTopologyProposalMergeGateTests.cs` or production code uses the slug and asserts the `ds-` alias is kept, add it. Cite the method in the comment.
6. Do not add two- and three-letter abbreviations (`er`, `vm`, `fw`, `kv`, `fty`) unless step 5 cites that exact slug. `azurerm_sql` is retired only when a surviving test uses the source id `azurerm_sql` (the v5.6.0 types are `mssql_*`, not `sql`). A retired `sql` slug must not make `azurerm_mssql_server` match via substring; `mssql_server` matches because it is in the catalog.

Both heuristic methods become: parsed slug is in the catalog or in the retired set. Delete the `normalized.Contains` chains. Leave a comment that recognition is catalog membership at the pinned commit, not a fragment list.

### 3. Tests

New file `ArchLucid.Application.Tests/Runs/Orchestration/TerraformAzurermResourceTypeCatalogTests.cs` — one class:

- Vendored count is 1105. First slug `aadb2c_directory`. Last slug `workloads_sap_three_tier_virtual_instance`. No duplicate lines. Slugs are sorted.
- `azurerm_storage_account.main`, `azurerm_firewall.main`, `azurerm_lb.main`, `azurerm_linux_virtual_machine.main`, and `azurerm_ai_foundry.main` return true from **both** methods. `ai_foundry` is the proof that recognition is the slug, not the letters `er`.
- `azurerm_fty.main`, `azurerm_bbg.main`, `azurerm_not_a_resource.main`, `server`, empty, and null return false from both methods.
- Each cited retired alias, if the set is non-empty, returns true. A catalog neighbor of that alias still matches only as its own slug.

Delete a generated `AgentTopologyProposalMergeGate*.cs` file when every `azurerm_` slug in it is either `linux_virtual_machine` (the paired compute node) or absent from the catalog and from the retired set. Do that with a script. Do not hand-edit hundreds of files.

Keep `AgentTopologyProposalMergeGateTests.cs`. Keep a generated gate file when it contains any other catalog slug (`lb`, `firewall`, …). If a file mixes a catalog slug and a synthetic slug, delete only the synthetic fact.

Do not delete historical ledger rows in `docs/library/AL_BUG_HUNT_LEDGER.md`. Append one line that synthetic source-id tokens are closed by catalog membership at v5.6.0 and that new three-letter tokens are not hunt-ready. Do not retick old `(proven)` rows.

### 4. CI

`scripts/ci/assert_azurerm_resource_catalog.py`, blocking, beside `al-bug-ban-retired-classes.py` in job `azure-extractor-pester`. Not `continue-on-error`.

Offline checks (always):

- Header commit is `daf16e27e2d45d2fb6b7d83644dc201363b05e62`, count line is 1105, slugs are unique and ordinal-sorted, sentinels above are present.
- `TopologyProposalTerraformSourceIdHeuristics.cs` contains no `normalized.Contains(`.
- No `AgentTopologyProposalMergeGate*.cs` test file references `azurerm_<slug>` unless that slug is in the vendored catalog, the retired-alias source file, or is `linux_virtual_machine` on a file that also contains a real catalog slug.

Remote check: refetch the git tree at that commit and diff slugs. Run it when `ARCHLUCID_AZURERM_CATALOG_REMOTE=1`. The unit test does not call the network. Document the env var next to the workflow step.

`scripts/ci/tests/test_assert_azurerm_resource_catalog.py` (or the existing `scripts/ci/tests/` style): a fixture catalog with a duplicate or a missing sentinel fails; a heuristics snippet that still has `normalized.Contains("er")` fails; a catalog member passes.

Scoped test:

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~TerraformAzurermResourceTypeCatalog|FullyQualifiedName~AgentTopologyProposalMergeGate"
python3 scripts/ci/tests/test_assert_azurerm_resource_catalog.py
python3 scripts/ci/assert_azurerm_resource_catalog.py
```

One scoped compile: `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'`.

## Acceptance criteria

- Both methods answer from the pinned set. `azurerm_ai_foundry.main` is true. `azurerm_fty.main` is false. `server` is false.
- The heuristics file has no `normalized.Contains(`.
- Vendored slug count is 1105 and matches commit `daf16e27` when the remote check runs.
- Hand-written gate tests for real types still pass. Synthetic-token gate files are gone.
- The weekk ban still fails a `HasCompactWeekkSuffix` fixture and still ignores this catalog.
- No new three-letter token, no new Terraform show-json property, no `weekk+` matcher.

## Constraints

- Do not run `/al-bug`. Do not add a hunt batch. Do not edit context-ingestion `TerraformShowJsonInfrastructureDeclarationParser.ResourceMapping.cs` (the property treadmill is a different list).
- Do not reopen weekk UOM farming (ABQ-46–50). Do not reopen **TB-135** / **TB-136** or GTM rows **M-90**, **M-44**, **M-91**, **M-92**, **G-REAL-05**, **G-ASSURANCE-02**.
- Do not mass-delete ledger `(proven)` rows. Do not `git add` untracked `scripts/agent/ship-hunts-*.py`.
- Working-tree safety on every tracked path. One class per file. Concrete types. Check nulls. Blank line before `if` / `foreach` unless it is the first line in the method. No `ConfigureAwait(false)` in tests.
- Stage only paths this prompt changes.
