> **Scope:** Contributor-reference — test-only SecureNow synthetic-world assurance for maintainers; not buyer-facing proof.

# SecureNow synthetic Azure worlds

The synthetic-world suite provides a small, manually authored semantic oracle for SecureNow path reasoning.

The key rule is that **expected truth is written independently of the production implementation**. A world declares literal expected path ordering, cut points, evidence references, and confidence/provenance. Production ranking and cut-point code are then evaluated against those expectations.

## Initial worlds

| World | Independent truth asserted |
|---|---|
| `public-exposure-vs-private-endpoint` | Confirmed public reachability ranks above an otherwise comparable private-endpoint route. |
| `shared-managed-identity-cut-point` | Three privilege paths sharing one managed identity produce that identity as the highest-leverage cut point and collapse all three paths. |
| `crown-jewel-consequence` | An active human crown-jewel assertion raises business consequence; unknown consequence remains unknown and does not zero a technically real path. |
| `insufficient-evidence-confidence` | Missing NSG evidence remains `InsufficientEvidence` / `DeterministicInference`; it is never promoted to `ObservedFact`. |

All worlds also preserve explicit evidence references through path materialization.

## Location

- `ArchLucid.Application.Tests/InfraEvidence/SyntheticAzureWorlds/SyntheticAzureWorld.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SyntheticAzureWorlds/SyntheticAzurePath.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SyntheticAzureWorlds/SyntheticAzureHop.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SyntheticAzureWorlds/SyntheticAzureWorldCatalog.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecureNowSyntheticAzureWorldTests.cs`

## Independence boundary

The oracle **does not** call:

- `SecurityEvidencePathRankCalculator` to compute expected ranking;
- `SecurityEvidenceCutPointAnalyzer` to compute expected cut keys;
- production path enumerators to manufacture expected paths;
- an LLM;
- Azure.

The materializer only translates the manually authored world into the production path record shape and runs the existing structural path guard. The assertions compare literal expected truth to production outputs.

## Expansion rules

Add worlds for:

1. inherited versus direct RBAC;
2. nested Entra groups;
3. NSG allow/deny combinations;
4. private endpoint plus public-access contradictions;
5. managed identity / service principal privilege chains;
6. Key Vault secret and SQL/Cosmos/Storage terminal assets;
7. multiple disjoint paths and shared controls;
8. missing or contradictory evidence;
9. unsupported claims that must not be emitted.

Prefer one tiny world per semantic claim. Keep expected truth obvious enough that a reviewer can verify it without reading production implementation.

Do not turn this suite into another copy of the production algorithms. If a world needs a reference algorithm, add that separately as an independent brute-force oracle.

## Independent bounded path oracles

The test suite includes small brute-force oracles under
`ArchLucid.Application.Tests/InfraEvidence/ReferenceAssurance/` for reachability and the
narrow privilege role/action slice. They walk simple paths over plain node/edge tuples to a
fixed depth and compare full path signatures with production enumeration.

The oracles do not call production graph builders, path enumerators, rankers, or cut-point
analyzers. Their graphs are deliberately tiny and their terminal resources are hand-listed so
expected paths remain countable by inspection. They are contributor-only regression checks, not
buyer-facing proof.


## Metamorphic companion suite

[`SECURENOW_METAMORPHIC_ASSURANCE.md`](SECURENOW_METAMORPHIC_ASSURANCE.md) transforms these fixed-truth worlds in ways that should not change their security meaning and verifies that SecureNow preserves the same semantic result.
