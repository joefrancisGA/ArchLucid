# Audit evidence lineage UI (AE-10)

Operate surface for deterministic audit control chain of custody.

## Routes

- `/governance/audit-evidence` — lookup form (assessment, snapshot, control ids)
- `/governance/audit-evidence/{assessmentId}/snapshots/{snapshotId}/controls/{controlId}` — control detail (ReadAuthority)

## Capabilities

- Positive checkbox affordance when `readyForPositiveCheckbox` is true (green check expands chain)
- Broken link reasons and per-evidence `missingLinkKinds` when chain is incomplete
- Spine: control → automated evaluation → evidence requirements → evidence nodes (resource ids, pointers, collector/selector versions, collected UTC)
- Snapshot hash verification status surfaced inline

## API

`GET v1/infra-evidence/audit-assessments/{assessmentId}/snapshots/{snapshotId}/controls/{controlId}/lineage`

## Constraints

- Read-only — no LLM narration; ids and hashes only
- Insufficient evidence or hash failure cannot present as supported
- Deep links use explicit assessment/snapshot/control ids (no second collector list API on this batch)
