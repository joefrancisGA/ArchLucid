# FND-014 isolated remediation dry-run reference

This additive Python module simulates a narrow allowlist of resource property changes against a private in-memory copy. It has no shell, filesystem, network, cloud SDK, credential access or production write path. All steps are checked against explicit expected old values; stale plans and unauthorized requests fail closed without returning partial simulated changes. Results contain a decision reference, original/simulated SHA-256 model digests and proposed changes.

**Isolation limitation:** copying a Python dictionary is not an OS/container sandbox. The module cannot execute arbitrary remediation code and should not be advertised as a sandboxed executor. Production execution needs a separately provisioned sandbox with no production credentials, network egress disabled, CPU/memory/time quotas, process isolation, syscall restrictions, immutable input artifacts, trusted policy enforcement, and signed audit results. Authorization decisions in this module are supplied by the caller; no real identity service or policy engine is wired. The source model must be obtained through a tenant-scoped authorized read.

This does not apply remediation, create rollback plans, or mutate deployed systems. Tests verify nonmutation, denial, foreign tenant, wrong proposal, stale preconditions, unsupported operations and limits.

## 2026-11-23 control-reuse audit — strict simulated authorization

The `DryRunAuthorization` input is a *caller-supplied reference fact*, not a
production principal or independent policy-decision result. Its `allowed` field
must be exactly the Python Boolean `True`; numeric or string truthy values
(e.g., `1` or `"false"`) are rejected. This aligns the existing FND-014
contract with the literal-proof interpretation already used in FND-016 and
FND-018 without importing those controls or adding another policy service.
The existing tenant/project/proposal/principal/action/decision-ID matching
remains mandatory.

Default-branch source searches show `simulate_remediation` consumed by
FND-015 planning tests and the FND-016 isolated recovery rehearsal reference,
not a verified production cloud executor. This is a reference-level fail-closed
correction, not a claim of a production authorization vulnerability or a
new capability to execute remediation. The focused `test_fnd014_isolated_dry_run.py`
suite must run on the PR checkout before integration.
