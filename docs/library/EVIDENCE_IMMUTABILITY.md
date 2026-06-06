> **Scope:** Contributor-reference — commit-sealed vs pre-commit mutable evidence inventory (TB-303 / ADR 0039); not a buyer-facing trust claim.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Evidence immutability inventory

## Commit definition

A run is **committed** when `AuthorityRunOrchestrator.FinalizeCommittedPipelineAsync` completes successfully within the authority unit of work. Evidence rows persisted in that transaction (and child rows keyed by the run’s `RunId`) are **commit-sealed**.

Pre-commit stages may rewrite draft rows; after commit, sealed tables accept **INSERT only** for the `[ArchLucidApp]` principal.

## Enforced contract (V1)

| Mechanism | Detail |
|-----------|--------|
| SQL permissions | `DENY UPDATE`, `DENY DELETE` on sealed tables to `[ArchLucidApp]` (migration 247, `ArchLucid.sql`) |
| Registry | `SealedEvidenceTableRegistry` in Core — single list for migrations and startup probe |
| Startup probe | `SqlSealedEvidenceImmutabilityRules` — production-like SQL hosts fail closed |
| Agent results | Insert-only on `dbo.AgentResults`; post-commit writes → `dbo.AgentResultEnrichments` |
| Evidence packages | Insert-only; unique index on `RunId` |
| Audit | Existing migration 051 pattern (included in sealed registry) |

## Artifact classification

| Artifact | Table(s) | Class | Post-commit mutation (before TB-303) | V1 change |
|----------|----------|-------|--------------------------------------|-----------|
| Audit events | `dbo.AuditEvents` | Sealed | None (already DENY) | In registry + probe |
| Agent results | `dbo.AgentResults` | Sealed | Delete-then-insert retry; calibration/IaC/promotion patches | Insert-only; overlay table |
| Agent enrichments | `dbo.AgentResultEnrichments` | **Mutable overlay** | N/A (new) | Calibration, IaC JSON, promotion timestamp |
| Evidence packages | `dbo.AgentEvidencePackages` | Sealed | Delete-then-insert | Insert-only + unique `RunId` |
| Golden manifests | `dbo.GoldenManifests` + children | Sealed | In-place updates possible via app | DENY UPDATE/DELETE |
| Artifact bundles | `dbo.ArtifactBundles` + children | Sealed | Same | DENY UPDATE/DELETE |
| Context / graph / findings snapshots | `dbo.ContextSnapshots*`, `dbo.GraphSnapshot*`, `dbo.FindingsSnapshot*`, `dbo.Finding*` | Sealed | Append at commit; no legitimate post-commit edit | DENY UPDATE/DELETE |
| Decision traces | `dbo.DecisionTraces`, `dbo.DecisionNodes`, `dbo.DecisioningTraces` | Sealed | Append at commit | DENY UPDATE/DELETE |
| Run header | `dbo.Runs` | **Pre-commit / post-commit mutable** | Status, disposition, ITSM fields | **Not sealed in V1** — FK chain protects children |

## Post-commit write paths (addressed)

| Feature | Old path | New path |
|---------|----------|----------|
| IaC stubs | `FindingIacStubGenerator` → `CreateManyAsync` (rewrite) | `IAgentResultEnrichmentRepository.UpsertEnrichedResultJsonAsync` |
| Confidence calibration | `PatchCalibratedConfidenceAsync` on `AgentResults` | `UpsertCalibratedConfidenceAsync` on enrichments |
| Evidence proposal promotion | `MarkEvidenceProposalPromotedAsync` on `AgentResults` | Enrichment repository |

## Out of scope (V1)

- Cryptographic hash-linked lineage / WORM storage (#6)
- Sealing `dbo.Runs` header or FK repoint detection
- Versioned evidence rows

## Verification

```bash
dotnet test ArchLucid.Architecture.Tests --filter "Sealed_evidence|Suite=Core"
dotnet test ArchLucid.Persistence.Tests --filter "SealedEvidence"
dotnet test ArchLucid.Host.Core.Tests --filter "SqlSealedEvidenceImmutabilityRulesTests"
```

## References

- [ADR 0039](../architecture/adrs/0039-commit-sealed-evidence-immutability.md)
- `ArchLucid.Persistence/Migrations/247_CommitSealedEvidenceImmutability.sql`
- `docs/security/MANAGED_IDENTITY_SQL_BLOB.md` — `[ArchLucidApp]` role setup
