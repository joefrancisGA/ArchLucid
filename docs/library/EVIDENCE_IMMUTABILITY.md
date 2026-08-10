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
| Run header anchors | `TR_Runs_SealCommittedHeader` on `dbo.Runs` when `GoldenManifestId` is set (migration 250, TB-310) |
| Run header registry | `CommittedRunHeaderAnchorRegistry` — anchor column list + trigger name |
| Run header startup probe | `SqlCommittedRunHeaderImmutabilityRules` — production-like SQL hosts fail closed |
| Header FK repoint detection | `CommittedRunHeaderFkRepointRegistry` + background probe (TB-311 / ADR 0046) — detection-only |
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
| Decision traces | `dbo.DecisionNodes`, `dbo.DecisioningTraces` | Sealed | Append at commit | DENY UPDATE/DELETE (`dbo.DecisionTraces` dropped in migration **296**) |
| Run header | `dbo.Runs` | **Anchor-sealed post-commit** | Status, disposition, ITSM fields | **TB-310:** evidence-anchor columns immutable via trigger + app guard; lifecycle columns mutable |

## Post-commit write paths (addressed)

| Feature | Old path | New path |
|---------|----------|----------|
| IaC stubs | `FindingIacStubGenerator` → `CreateManyAsync` (rewrite) | `IAgentResultEnrichmentRepository.UpsertEnrichedResultJsonAsync` |
| Confidence calibration | `PatchCalibratedConfidenceAsync` on `AgentResults` | `UpsertCalibratedConfidenceAsync` on enrichments |
| Evidence proposal promotion | `MarkEvidenceProposalPromotedAsync` on `AgentResults` | Enrichment repository |

## Out of scope (V1)

- **Platform WORM / immutable blob tier** — see [ADR 0040](../architecture/adrs/0040-tamper-evident-lineage-without-worm-storage.md); customer may apply immutability on exported copies
- Application-layer hash-linked lineage (#6 — **Done** TB-307 / ADR 0040; not WORM)
- FK repoint detection — **Done** (TB-311 / ADR 0046); detection-only background probe + admin counts
- Versioned evidence rows

## Verification

```bash
dotnet test ArchLucid.Architecture.Tests --filter "Sealed_evidence|Committed_run_header|HeaderRepoint|Suite=Core"
dotnet test ArchLucid.Persistence.Tests --filter "SealedEvidence|CommittedRunHeader|HeaderRepoint"
dotnet test ArchLucid.Host.Core.Tests --filter "SqlSealedEvidenceImmutabilityRulesTests|SqlCommittedRunHeaderImmutabilityRulesTests"
dotnet test ArchLucid.Core.Tests --filter "CommittedRunHeaderAnchorGuard"
```

## Export lineage + verify (TB-307 / ADR 0040)

Run export ZIPs (`GET /v1/artifacts/runs/{runId}/export`) include **`export-manifest.json`**: per-file SHA-256 checksums (UPPER hex) plus the committed `ManifestHash`, `RuleSetId`, and `RuleSetHash` anchors copied from the golden manifest at packaging time.

**Verify surface:** `GET /v1/artifacts/runs/{runId}/export/verify` recomputes the golden manifest hash via `IManifestHashService` and compares it to the latest `ManifestGenerated` audit anchor for the run. Response status is one of:

| Status | Meaning |
|--------|---------|
| `Match` | Recomputed hash equals the commit-time audit anchor |
| `Mismatch` | Anchor present but differs from recomputed hash (tamper/divergence signal) |
| `NotAttested` | No committed manifest or no `ManifestGenerated` anchor (not a server error) |

Each verify call emits `RunExportLineageVerified` audit (run id, status, hashes only — no secrets).

**Honest claim:** committed evidence is sealed in SQL; sponsor packets include checksums verifiable against commit anchors; long-term immutable retention is applied by the customer on exported copies ([ADR 0040](../architecture/adrs/0040-tamper-evident-lineage-without-worm-storage.md)). **Offline vs online split** (departing-tenant portability, Art. 20 vs lineage): [`OFFLINE_VERIFIABLE_EXPORT_PORTABILITY.md`](OFFLINE_VERIFIABLE_EXPORT_PORTABILITY.md) (**TB-1488** Done). **DR restore vs append-only / tamper:** [`EVIDENCE_BACKUP_RESTORE_INVARIANT_MAP.md`](EVIDENCE_BACKUP_RESTORE_INVARIANT_MAP.md) (**TB-1490** Done).

## PA / procurement matrix (TB-1009)

Contributor deep dive above remains the enforcement inventory. For the **append-only vs mutable** buyer/PA matrix and what a silent `UPDATE` destroys, see [`APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md`](APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md) (**TB-1009** Done). Honesty CI follow-on: **TB-1010**.

## References

- [`APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md`](APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md) — PA append-only / sealed vs mutable + Update-destruction matrix
- [ADR 0039](../architecture/adrs/0039-commit-sealed-evidence-immutability.md)
- [ADR 0045](../architecture/adrs/0045-committed-run-header-immutability.md)
- `ArchLucid.Persistence/Migrations/247_CommitSealedEvidenceImmutability.sql`
- `ArchLucid.Persistence/Migrations/259_SealCommittedRunHeader.sql`
- `docs/security/MANAGED_IDENTITY_SQL_BLOB.md` — `[ArchLucidApp]` role setup
