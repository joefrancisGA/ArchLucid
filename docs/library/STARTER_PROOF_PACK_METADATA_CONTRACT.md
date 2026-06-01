# Starter proof pack metadata contract (TB-171)

> **Scope:** Machine-readable metadata beside each `templates/starter-proof-packs/{pack-id}/` folder.  
> **Enforced by:** `scripts/ci/check_starter_proof_packs.py` and `scripts/ci/dry_run_starter_proof_packs.py`.

## File

Each pack directory must include `starter-pack.json` with these keys (all required, non-empty):

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | string | Folder name and stable pack identifier |
| `title` | string | Human title for chooser tables |
| `targetBuyer` | string | Primary persona |
| `buyerJob` | string | Job-to-be-done label for accelerator chooser |
| `owner` | string | Review owner (team or role) |
| `lastReviewedUtc` | ISO-8601 date | Freshness for procurement/sponsor proof |
| `requiredInputs` | string[] | Filenames operators must attach |
| `expectedOutputs` | string[] | Proof artifacts buyers should expect |
| `scopeLabel` | enum | `V1-ready`, `V1.1-deferred`, `V2-deferred`, or `owner-input-required` |
| `doNotUseWhen` | string[] | Explicit anti-patterns (required) |
| `deferredScopeNotes` | string | What the pack does **not** prove |

Recommended optional fields used in-repo:

| Field | Purpose |
| --- | --- |
| `sourceConfidence` | `synthetic-demo-labeled`, etc. |
| `acceptanceChecks` | Human-readable checks mirrored in CI/tests |

## Required pack files

- `architecture-request.json`
- `second-run.json`
- `policy-context.json`
- `proof-package-checklist.md`
- `README.md`
- `starter-pack.json`

## Chooser surfaces

- Repo table: [`templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md`](../../templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md)
- Docs: [`ACCELERATOR_CHOOSER.md`](ACCELERATOR_CHOOSER.md)
- In-app: `/help/accelerator-chooser` and operator home `AcceleratorChooserCard`

## Golden walkthrough

One canonical path: [`walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md`](walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md) (regulated SaaS pack).
