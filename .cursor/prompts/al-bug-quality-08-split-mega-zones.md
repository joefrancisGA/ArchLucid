# ABQ-08 — Split mega-zones into namespace-scoped hunt zones

**After ABQ-06 preferred** (picker must keep parsing new ids). Do not implement `-Nominate` here (ABQ-09).

## Goal

No ledger zone has `paths` of an entire project (`ArchLucid.Core/`, `ArchLucid.Contracts/`) or an entire unbounded controller tree that the picker can farm for hundreds of hunts. `archlucid-core` and `api-governance-tenancy-controllers` become several **namespace-scoped** zones with honest `hunts: 0` / `unseeded` (carry a short “split from …” note). Historical hypotheses stay on a **retired** `archlucid-core` / `api-governance-tenancy-controllers` section with `status: exhausted` (or `cooling`) so history is not deleted.

## Why

Curated zones exist so a hunt reads a handful of files. `paths: ArchLucid.Core/` plus `impact: high` plus unbounded speed made 397 of 1,236 run-log hunts hit one id. `api-governance-tenancy-controllers` similarly reports hunts 265 / bugs 504 on `ArchLucid.Api/Controllers/Governance/` + `Tenancy/`. Seed hunts then reseed from whichever file is convenient (redactor, advice patterns, schemaVersion).

## Context

- `docs/library/AL_BUG_HUNT_LEDGER.md` — zone stanzas; picker splits on `## Zone:`
- `scripts/agent/al-bug-pick-zone.ps1` — no code change required unless a zone id alias must map old hints (`core domain`) to a **family** of new ids — if so, hint matching should pick the highest-scoring **child**, not resurrect the mega-zone
- Existing focused zones that already slice Core/Application (e.g. `commit-output-integrity`, `llm-wallet`) stay; do **not** duplicate their paths into new children

## What to build

1. **Retire** `archlucid-core`: set `status: exhausted`, `paths:` empty or a comment path `docs/library/AL_BUG_HUNT_LEDGER.md` so git churn on Core does not reopen it, aliases keep `core domain` **and** add `retired mega-zone`. Leave hypotheses as history.
2. **Add unseeded child zones** (one stanza each, 0 hunts, candidate or empty hypotheses, `impact` matching the slice). Suggested split (adjust if a child would duplicate an existing zone’s paths — skip duplicates):

   | New id | paths (prefix) | impact |
   | --- | --- | --- |
   | `core-azure-extractor` | `ArchLucid.Core/AzureExtractor/` | high |
   | `core-configuration-summary` | `ArchLucid.Core/Configuration/` | high |
   | `core-findings-advice` | `ArchLucid.Core/Findings/` | medium |
   | `core-requests-constraints` | `ArchLucid.Core/Requests/` | medium |
   | `core-authority-runs` | `ArchLucid.Core/Runs/`; `ArchLucid.Core/Authority/` | high |
   | `core-tenancy-commercial` | `ArchLucid.Core/Identity/`; `ArchLucid.Core/Billing/`; `ArchLucid.Core/Budgeting/` | high |
   | `core-safety-network` | `ArchLucid.Core/Safety/`; `ArchLucid.Core/Http/` | high |
   | `core-costing` | `ArchLucid.Core/Costing/` | medium |
   | `core-explanation-json` | `ArchLucid.Core/Explanation/` | medium |

   Do **not** create a leftover `core-misc` that re-points at `ArchLucid.Core/`. Uncovered namespaces wait for ABQ-09 nominate.

3. **Retire** `api-governance-tenancy-controllers` the same way. Split at least:

   | New id | paths |
   | --- | --- |
   | `api-policy-packs` | `ArchLucid.Api/Controllers/Governance/` files for policy packs (list concrete files if the folder mixes stickiness/posture) |
   | `api-governance-stickiness` | stickiness / posture / pre-finalize controllers |
   | `api-tenancy-workspaces` | `ArchLucid.Api/Controllers/Tenancy/` |

   Prefer **concrete files** over a whole folder when the folder is huge. `test-filter` must be a real `FullyQualifiedName~` disjunction that exists.

4. Optionally split `archlucid-contracts` (`impact: low` already) only if hunts ≥ 15 and paths are still `ArchLucid.Contracts/` — a single `contracts-json-converters` zone with the converter directory is enough; do not invent 20 contract zones.
5. Pester: a fixture mega-zone with empty paths + exhausted is not picked when children are `unseeded`. Hint `core domain` resolves to a child, not the retired id, **or** document that the hint is retired and must be updated — picking the exhausted parent is a bug.
6. Do not invent hunt-ready hypotheses for children (unseeded + candidates only, or empty). Do not copy three harm-class templates.

## Acceptance criteria

- Picker `-Preview` (SkipGit) no longer returns `archlucid-core` while children are unseeded/open.
- Ledger still contains the historical mega-zone text (retired).
- Each new zone’s `paths` is a directory or file list a human can read in one sitting, not `ArchLucid.Core/`.
- `test-filter` is non-empty and names types that exist (spot-check with `rg class` / existing test class names).

## Constraints

- Do not rewrite thousands of historical hypothesis lines; freeze them under the retired id.
- Do not run `/al-bug` to “seed” every child in this session — unseeded is the correct start.
- Do not touch production C#.
- Working-tree safety on the ledger (it is large and often dirty — stop on exit 2).
