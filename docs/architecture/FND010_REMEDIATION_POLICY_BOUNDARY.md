# FND-010 remediation policy boundary

Central authorization now recognizes `remediation.plan` as a distinct action. It requires trusted tenant/workspace/project scope, a server-side `IRemediationApprovalAuthority` decision, and `ExecuteAuthority`. The registered approval authority denies by default. `remediation.execute` and all other unknown actions remain unsupported and denied. Every result follows the existing mandatory audit path.

This is a policy integration seam, not approval issuance or remediation execution. No approval database, signature verification, dual control, expiry, rollback preconditions or production executor is connected. The authorization contract still lives in the API assembly; moving it to a shared core/application assembly requires dependency-graph review. The existing audit sink is structured logging, not durable append-only persistence. Both remain explicit release blockers. No feature flag enabled.
