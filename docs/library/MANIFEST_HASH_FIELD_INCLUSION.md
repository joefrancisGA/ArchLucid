> **Scope:** Contributor-reference — manifest hash field inclusion matrix for commit-time content commitments (wave-2 suggestion 18).

# Manifest hash field inclusion (wave-2 suggestion 18)

`ManifestHashService.HasherSchemaVersion` is **`v9`** (wave-14 binds committed artifact inventory blob bytes; wave-13 introduced inventory rows; wave-12 binds package origin, architecture request id, structural execution mode, and pilot AOAI deployment snapshot; wave-11 binds focused-pilot mode + cloud provider; wave-10 binds κ content hash + KM content hash; wave-7 binds evidence pin hash digest; wave-6 bound create-time pin rows; wave-5 bound `ArchitectureVersionId`). The hash is a **content commitment** for structural manifest sections and committed governance — not the full findings envelope.

## Included in `h(M)`

- Scope ids, manifest/run/snapshot/trace/rule-set ids, **`ArchitectureVersionId`**
- **Create-time κ content hash** (`CreateTimeArchitectureVersionContentHashSha256`: uppercase hex over pinned κ artifact bytes)
- **Create-time κ model content hash** (`CreateTimeKnowledgeModelContentHashSha256`: uppercase hex over review-cache κ fingerprint bytes)
- **Create-time policy pack pins** (`CreateTimePolicyPackPins`: id + version rows)
- **Create-time evidence package pins** (`CreateTimeEvidencePackagePins`: provider + package id + collection timestamp when available)
- **Create-time evidence pin hash** (`CreateTimeEvidencePackagePinsHashSha256`: uppercase hex over canonical pin JSON)
- **Create-time focused-pilot pins** (`CreateTimeFocusedPilotModeEnabled`, `CreateTimeFocusedPilotCloudProvider`)
- **Create-time provenance pins** (`CreateTimePackageOrigin`, `CreateTimeArchitectureRequestId`, `CreateTimeStructuralExecutionMode`, `CreateTimePilotAoaiDeploymentSnapshot`)
- Structural sections: requirements, topology, security, compliance, cost, constraints, unresolved issues
- Sorted decisions (with sorted supporting finding ids / related node ids)
- Sorted assumptions and warnings
- Policy, provenance, feasibility verdict
- `EffectiveGovernanceAtCommit` and `ReviewStandardsAtCommit` descriptors
- **`CommittedArtifactInventory`** (sorted artifact name, content type, content hash, producer, captured UTC)

## Explicitly excluded

- `CreatedUtc` and other non-deterministic metadata (including review snapshot `GeneratedUtc`)
- LLM catalog **engine identity** (ADR 0065 D5′)
- Finding mute flags, human-review notes, insight-density curation, and disposition/treatment fields on `Finding` rows unless a future hasher baseline deliberately adds them

## Operator rule

Hash equality means **same sealed structural package + governance snapshot**, not “same finding dispositions” or “same model produced advisory text.” Use provenance tables and `Runs.EngineProvenanceJson` for producer drift.

Baseline lock: [`MANIFEST_HASH_HASHER_BASELINE.md`](MANIFEST_HASH_HASHER_BASELINE.md).
