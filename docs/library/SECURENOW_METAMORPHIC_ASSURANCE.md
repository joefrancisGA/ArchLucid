> **Scope:** Contributor-reference — test-only SecureNow metamorphic assurance for maintainers; not buyer-facing proof.

# SecureNow metamorphic assurance

> **Scope:** Test-only metamorphic assurance over the synthetic Azure worlds. No Azure mutation, no LLM, no second collector, no new `IFindingEngine`.

Metamorphic tests complement the fixed-truth worlds in
[`SECURENOW_SYNTHETIC_AZURE_WORLDS.md`](SECURENOW_SYNTHETIC_AZURE_WORLDS.md).

The fixed worlds ask: **is the answer correct for this known world?**

The metamorphic suite asks: **does the answer remain semantically stable when something irrelevant changes?**

## Current invariants

| Transformation | Required invariant |
|---|---|
| Reverse the input order of otherwise identical paths | Rank order and scores do not change. |
| Rewrite evidence-reference labels without changing path facts | Ranking and cut-point shape do not change; evidence text itself does change. |
| Add a disconnected, low-leverage path | Existing paths keep their relative order; the known shared managed identity remains the primary cut point. |
| JSON serialize/deserialize path records and hops | Rank order, scores, and cut-point shape do not change. |
| Change tenant/workspace/project/snapshot identifiers | Semantic ranking does not change. |
| Evaluate the identical world repeatedly | Deterministic outputs remain identical. |

## Why this is independent assurance

The transformations are authored without consulting the ranking or cut-point implementation. The suite compares the production result before and after a transformation whose semantic irrelevance is explicit.

This catches defects such as:

- accidental dependence on collection/insertion order;
- ranking that changes because evidence-reference text changed;
- unrelated graph/path contamination;
- serialization-dependent behavior;
- scope identifiers leaking into semantic calculation;
- hidden nondeterminism.

## Expansion candidates

Add metamorphic transformations only when the semantic invariant is obvious:

- add unrelated tags/metadata once represented in the world model;
- duplicate equivalent evidence without duplicating a semantic edge;
- rename display-only resource labels while preserving canonical ids;
- reorder inventory rows before graph projection;
- reorder RBAC assignments;
- add an unrelated subscription/resource group;
- equivalent casing/normalization variants for Azure resource ids;
- deterministic replay across persisted snapshot round trips.

Do **not** reorder hops inside a path: hop order is semantic. Do **not** mutate confidence/provenance or privilege edge types and call the change irrelevant.

## Directional mutations

Directional mutations are semantically relevant, test-only transformations. Unlike the invariance suite, they are expected to move one named security dimension in a known direction:

- adding public ingress must not improve technical-exposure scoring;
- adding a private-endpoint route must not cancel an existing public-exposure signal;
- removing public exposure must not worsen technical exposure;
- write privilege must not score below equivalent read privilege;
- removing a shared identity from paths must reduce that identity's collapsed-path count.

These tests compare the affected dimension rather than asserting that one composite security score captures every architecture tradeoff. They use synthetic worlds only, with no Azure mutation, LLM, or buyer-facing assurance claim.

## Independent bounded path oracles

The SecureNow test suite also contains small brute-force oracles under `ArchLucid.Application.Tests/InfraEvidence/ReferenceAssurance/`:

- `ReferenceReachabilityOracle` compares reachability path signatures on bounded graphs;
- `ReferencePrivilegePathOracle` compares simple privilege-path signatures for the narrow role/action slice.

Each oracle uses only plain node and edge tuples and hand-listed terminal resources. It must not call production graph builders, path enumerators, rankers, or cut-point analyzers. The graphs are intentionally tiny and bounded so a reviewer can count their expected paths by hand. Matching path signatures—not only counts—guards against swapped or duplicated results. These oracles are contributor-only regression checks, not customer or buyer proof.
