# FND-017 resource-bound evidence authorization (advisory)

`FND017005` inspects the two known `EvidenceReadAuthorizationGate.AuthorizeAsync` invocations in the SecureNow temporal snapshot endpoint. It checks explicit arguments for the current principal, scope tenant/workspace/project, anchor `runId`, resolved `resolved.RunId`, and cancellation token. A duplicate anchor authorization, foreign run ID, swapped tenant field, or missing second authorization produces an advisory diagnostic. Five compiler-driven tests exercise these patterns.

**Limits:** This is a scoped syntax-and-symbol rule, not full interprocedural taint analysis. It does not prove that `scope` is trustworthy, `resolved` belongs to the authorized project, that the gate returns allowed, or that aliases and computed expressions are equivalent. It rejects aliases conservatively. Review real-source CI and pair with FND017002–004 and runtime cross-tenant tests before enforcement.
