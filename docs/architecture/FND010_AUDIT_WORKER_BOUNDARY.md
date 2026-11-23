# FND-010 decision auditing and non-HTTP caller boundary

This increment adds a structured decision audit interface and logging implementation, and a worker adapter that obtains its principal from an explicit trusted identity provider rather than job payload claims. The default worker identity provider returns no principal, so background jobs cannot acquire evidence access accidentally.

The centralized decision service now writes a decision record (unique decision ID, action, scope, resource, outcome, reason, caller classification and UTC time) before returning any authorization decision. If audit writing fails, even an otherwise allowed decision is denied. Unknown actions, including remediation.execute, remain denied. No raw tokens, claims or evidence content are logged.

## Implementation and reuse audit (2026-11-23)

The original structured-logging sink `LoggingCentralAuthorizationAudit` remains in source
as a non-durable reference. It is **not** the API production DI registration:
`ArchLucid.Api/Program.cs` registers `SqlCentralAuthorizationAudit`
when `ISqlConnectionFactory` exists, otherwise `UnavailableCentralAuthorizationAudit`
which rejects every decision. SQL authorization journal writes invoke
`dbo.AppendAuthorizationDecision` before an allow returns. This is a
production-oriented code path; SQL migrations and persistence success in an
actual deployment are separate prerequisites.

The API also registers `DenyUnconfiguredWorkerIdentity` as the default
`ITrustedWorkerIdentity`. The `WorkerAuthorizationAdapter` is registered
but indexed `master` code search has not shown a production caller; it is
therefore a **configured adapter with deny-all identity**, not evidence of
a deployed worker entitlement system. Existing tests assert no central policy
call without a trusted principal and delegation once trusted. This audit adds
focused tests proving that an unauthenticated principal, identity provider
exception, or central authorization exception cannot grant access, and that
caller cancellation propagates without being rewritten as a denial.

The adapter does **not** mint claims from a job payload. It reuses
`ICentralAuthorizationDecisions`, including scope, read entitlement, policy
and durable audit handling. Worker scope-context propagation, independent
workload identity validation, caller-kind provenance, and end-to-end runtime
registration must be established before a production worker can be enabled.

## Remaining limitations

- A compiled `SqlCentralAuthorizationAudit` is not proof its migrations and
  append-only permissions have been deployed.
- The central decision contract remains in the API assembly. Workers must not
  introduce a dependency from Core or lower-level libraries back to API.
- An earlier summary that called the logging sink the production audit path is
  superseded by the above verified `Program.cs` registration.
- Cloud remediation execution is still unsupported; `remediation.execute`
  is denied as an unknown action, and the default independent approval
  authority denies `remediation.plan`.
- Independent administrative SQL run archives and stale-run remediation
  remain a separate audit-atomicity follow-up: their repository operations
  commit before `AdminRunArchiveAuditLogger` writes the
  `ManifestArchived` event. That event is **not** present in the
  currently inspected `RequiredAuditEventTypes.All`. Do not relabel it
  Required or refactor those repositories into another transaction without
  a scoped authority, repository and compatibility review.
- The current tests exercise worker-denial semantics on a PR checkout, not
  a live workload identity integration.
