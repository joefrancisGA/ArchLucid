# FND-014 isolated remediation dry-run reference

This additive Python module simulates a narrow allowlist of resource property changes against a private in-memory copy. It has no shell, filesystem, network, cloud SDK, credential access or production write path. All steps are checked against explicit expected old values; stale plans and unauthorized requests fail closed without returning partial simulated changes. Results contain a decision reference, original/simulated SHA-256 model digests and proposed changes.

**Isolation limitation:** copying a Python dictionary is not an OS/container sandbox. The module cannot execute arbitrary remediation code and should not be advertised as a sandboxed executor. Production execution needs a separately provisioned sandbox with no production credentials, network egress disabled, CPU/memory/time quotas, process isolation, syscall restrictions, immutable input artifacts, trusted policy enforcement, and signed audit results. Authorization decisions in this module are supplied by the caller; no real identity service or policy engine is wired. The source model must be obtained through a tenant-scoped authorized read.

This does not apply remediation, create rollback plans, or mutate deployed systems. Tests verify nonmutation, denial, foreign tenant, wrong proposal, stale preconditions, unsupported operations and limits.
