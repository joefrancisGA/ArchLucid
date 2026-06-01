> **Scope:** Contributor reference for `packManifest` on vertical templates under `templates/policy-packs/{id}/policy-pack.json`. Distinct from **bundled default** packs under `ArchLucid.Application/.../Bundled/` (validated by `check_policy_pack_content_quality.py`).

# Policy pack metadata contract (TB-175)

## Location

Each vertical template folder includes `policy-pack.json` with:

- **Runtime fields:** `complianceRuleKeys`, `advisoryDefaults`, `metadata` (unchanged for ingestion)
- **Buyer manifest:** `packManifest` (TB-175 — mirrors starter-pack.json shape plus proof-specific fields)

## Required `packManifest` keys

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | string | Folder name (e.g. `saas`) |
| `title` | string | Chooser / index title |
| `targetBuyer` | string | Primary persona |
| `buyerJob` | string | Job-to-be-done for dry-run index |
| `owner` | string | Review owner |
| `lastReviewedUtc` | `YYYY-MM-DD` | Freshness for procurement proof |
| `requiredInputs` | string[] | Scope assignment + evidence expectations |
| `expectedOutputs` | string[] | Findings / dry-run outputs |
| `scopeLabel` | enum | `V1-ready`, `V1.1-deferred`, `V2-deferred`, `owner-input-required` |
| `doNotUseWhen` | string[] | Anti-patterns |
| `deferredScopeNotes` | string | What the pack does **not** prove |
| `buyerSafeCaveat` | string | Must include not-certification / architecture-review wording |
| `sampleFindingSummary` | string | Example advisory finding for sponsors |

## Enforcement

- `python scripts/ci/check_policy_pack_manifests.py`
- `python scripts/ci/generate_policy_pack_dry_run_index.py --check` (index must match manifests)

## Surfaces

- Generated index: [`POLICY_PACK_DRY_RUN_INDEX.md`](POLICY_PACK_DRY_RUN_INDEX.md)
- Starter packs (ZIP path): [`ACCELERATOR_CHOOSER.md`](ACCELERATOR_CHOOSER.md)
- Bundled tenant defaults: [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md)
