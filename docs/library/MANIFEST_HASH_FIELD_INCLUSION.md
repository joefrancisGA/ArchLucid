> **Scope:** Contributor-reference — manifest hash field inclusion matrix for commit-time content commitments (wave-2 suggestion 18).

# Manifest hash field inclusion (wave-2 suggestion 18)

`ManifestHashService.HasherSchemaVersion` is **`v3`** (wave-6 binds create-time policy/evidence pins; wave-5 bound `ArchitectureVersionId`). The hash is a **content commitment** for structural manifest sections and committed governance — not the full findings envelope.

## Included in `h(M)`

- Scope ids, manifest/run/snapshot/trace/rule-set ids, **`ArchitectureVersionId`**
- **Create-time policy pack pins** (`CreateTimePolicyPackPins`: id + version rows)
- **Create-time evidence package pins** (`CreateTimeEvidencePackagePins`: provider + package id)
- Structural sections: requirements, topology, security, compliance, cost, constraints, unresolved issues
- Sorted decisions (with sorted supporting finding ids / related node ids)
- Sorted assumptions and warnings
- Policy, provenance, feasibility verdict
- `EffectiveGovernanceAtCommit` and `ReviewStandardsAtCommit` descriptors

## Explicitly excluded

- `CreatedUtc` and other non-deterministic metadata
- LLM catalog **engine identity** (ADR 0065 D5′)
- Finding mute flags, human-review notes, insight-density curation, and disposition/treatment fields on `Finding` rows unless a future hasher baseline deliberately adds them

## Operator rule

Hash equality means **same sealed structural package + governance snapshot**, not “same finding dispositions” or “same model produced advisory text.” Use provenance tables and `Runs.EngineProvenanceJson` for producer drift.

Baseline lock: [`MANIFEST_HASH_HASHER_BASELINE.md`](MANIFEST_HASH_HASHER_BASELINE.md).
