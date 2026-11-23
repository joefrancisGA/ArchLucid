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
repository adapters fail closed. The generic scoped `UpdateInstanceInScopeAsync` cannot set status
`Approved` without that atomic method. The former tenant-only
`UpdateInstanceAsync` is subsequently removed by the legacy-write audit.

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


## Strict rowversion CAS on all protected remediation updates — 2026-11-23

The original scoped SQL update and atomic verification transaction accepted
`(@ExpectedRowVersion IS NULL OR RowVersion = @ExpectedRowVersion)`. That
allowed a null expected token to bypass concurrency protection, unlike the
stronger approval transaction. Both now require an **eight-byte current
rowversion** before opening the write and use the unconditional SQL predicate
`RowVersion = @ExpectedRowVersion`, in addition to exact tenant, workspace,
project and instance scope. A stale/null/malformed token cannot mutate state;
a rejected verification cannot insert its evidence record.

A successful verification advances SQL Server's generated rowversion. If a
subsequent association write fails, the existing compensation path must
not reuse the pre-verification token: it rereads the scoped current record
without using a caller cancellation token, confirms it is still in the exact
just-verified mutable state, then restores with a CAS against the freshly
observed rowversion. If another writer has changed the state, recovery
raises an aggregate failure rather than clobbering the newer state.
This does not make the independently stored association and evidence
transactionally atomic across repositories; that remains a separate
reconciliation/design concern.

The in-memory test mutation mapping now retains its source token and may
accept a fixture-supplied replacement token to simulate SQL Server's
generation after writes. Legacy test-only records without a token are not
proof of SQL concurrency safety. SQL-backed tests must execute against a
disposable test catalog; a skipped fixture does not validate this repair.

**Scope of this pass:** the two protected SQL operations and the verified
association-failure compensation path. The tenant-only `UpdateInstanceAsync`
method was identified as a separate residual risk and subsequently retired
by the legacy-write audit below. This does not establish that external
direct/administrative database writers have been eliminated. No FND-015
signing authority or cloud execution was enabled.

## Retire tenant-only legacy remediation UPDATE — 2026-11-23

The reuse audit of `IRemediationInstanceRepository.UpdateInstanceAsync`
found no production caller: indexed repository search located only its
contract definition, SQL/no-op implementations, test doubles, and structural
CI assertions. The legacy SQL update was limited to tenant/instance IDs,
lacked workspace/project scope and a row-version predicate, and could
mutate statuses without the dedicated approval/verification evidence
transactions. Checking for `Approved` alone did not make the method safe
for other state changes.

The unused method has been **removed** from the repository interface,
SQL implementation, no-op adapter and application test doubles. Existing
production callers of `IProjectScopedRemediationInstanceRepository`
continue to use `UpdateInScopeAsync` with exact project scope and strict
row-version CAS, or `CommitApprovalInScopeAsync` /
`CommitVerificationInScopeAsync` where state and evidence must commit
together. No new persistence abstraction or alternative update method was
introduced.

An interface-reflection unit test and targeted Python source-contract tests
now reject reintroduction of the tenant-only method. The existing scoped
insert/read behavior and advisory-only `ExecuteAsync` remain unchanged.
**This is an intentional breaking repository contract change** for any
consumer outside the audited code tree; integration owners must migrate
such consumers to a scoped operation. This is not proof of SQL database
permissions or out-of-repository writers. Confirm the focused .NET and
contract tests before describing it as runtime validated.
