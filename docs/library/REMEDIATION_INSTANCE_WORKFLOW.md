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
