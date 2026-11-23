> **Scope:** Contributor-reference — remediation instance state machine, preflight, execute, and verify workflow (IE-13).

# Remediation instance workflow (IE-13)

Governed remediation instances apply **approved** remediation pattern versions through a state machine. **Execute never mutates customer Azure** — advisory artifacts only.

## State machine

```
Classified → PreflightPassed | PreflightBlocked
PreflightPassed → Approved → WaveAssigned → Executed → Verified | VerificationFailed
Verified → Closed
```

`PatternVersion` is frozen on the instance at creation.

## Preflight (fail-closed)

On inventory snapshot:

- Active operational security **exception** required (IE-12)
- IE-11 **Conflict** blocks
- Only **ExactMatch** / **ProbableMatch**
- **SemiAutomated/Automated** require rollback definition in pattern content
- Production tags recorded in preflight result

## Execute

- **Manual/Guided:** checklist + immutable evidence (`result=emitted`)
- **SemiAutomated/Automated:** advisory Terraform representation (IE-05) — **no** `terraform apply` / ARM mutation

## Verify

Uses a **later** inventory snapshot than execution. `ExecutionSucceeded` + `VerificationFailed` is first-class.

Verification queries (pattern content):

- `snapshot.resource.present`
- `property:key=value`

## Schema

Migration **360** — `dbo.RemediationInstances`, `dbo.RemediationEvidence`

## Related

- IE-11 matcher (preflight conflict check)
- IE-12 exceptions (preflight requirement)
- AE-09 handoff (nullable `AssessmentId` / `ControlId` on instance)

## Atomic approval provenance — 2026-11-23

The existing production `RemediationInstanceService.ApproveAsync` now
requires a persisted preflight snapshot/result and an eight-byte SQL
rowversion. It retains separate creator/approver segregation and the
frozen pattern version. Approval is committed through
`IProjectScopedRemediationInstanceRepository.CommitApprovalInScopeAsync`
rather than a generic mutation.

The SQL implementation updates **only** the approval/status/updated
fields when tenant, workspace, project, instance ID, expected rowversion,
prior `PreflightPassed` status, completed preflight and distinct creator
all match. It inserts a `RemediationEvidencePhase.Approval` record in
the **same SQL transaction**. Evidence captures scope, instance/finding,
frozen pattern and version IDs, preflight snapshot, SHA-256 of the persisted
preflight-result JSON, prior rowversion, approver and time. If the
evidence insert fails, the approval update rolls back. A stale or
foreign rowversion cannot produce an approval receipt. Unsupported
repository adapters fail closed. Generic SQL `UpdateInstanceAsync` and
`UpdateInstanceInScopeAsync` calls can no longer silently set status
`Approved` without that atomic method.

The SQL Server-managed `RowVersion` column (migration 425) must never
appear in INSERT column lists. The two remediation-instance INSERT
statements previously listed it without supplying a value; that
malformed insert prevented new SQL records from being created. Both
now let SQL Server generate the token. This is a prerequisite for
later scoped rowversion-protected transitions.

**Limits:** This records an instance's approved **preflight/frozen
pattern**, not an independently approved FND-015 plan with forward
and inverse remediation steps. The `RemediationEvidence` table is not
shown to be independently signed, immutable/WORM, or a RequiredAuditEvent
journal; the new record is audit-adjacent evidence, **not** a cryptographic
approval attestation or execution grant. Legacy/direct database writes and
other non-approval state transitions require separate protection review.
No cloud mutation or execution enablement is added.

Focused unit, structural and SQL-fixture regression tests must
be reviewed on the PR. SQL fixture skips do not certify the transaction.
