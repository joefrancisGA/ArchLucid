# Defect-prevention guardrails

These are lightweight prompts for developers and reviewers. They are advisory
and must not be turned into merge-blocking checks without an explicit product
decision. The goal is to make common omissions visible while the change is
still easy to correct.

## API mutations

Before opening a PR for a write endpoint, walk through:

- authentication and the intended authorization tier;
- tenant, workspace, project, and object scope derived from trusted context;
- validation of required, optional, and mutually exclusive inputs;
- retry, duplicate-submit, optimistic-concurrency, and partial-failure behavior;
- stable error status codes and messages for callers; and
- the typed audit event, actor, target, correlation ID, and redaction rules.

Prefer the existing application service patterns and nearby tests over adding
controller-local policy. If a mutation intentionally differs from a pattern,
record why in the PR.

## Tenant and object scope

For changed reads and writes, consider four scenarios explicitly:

1. an authorized request for an object in the caller's scope;
2. an authorized request for another tenant or workspace;
3. a request with missing or malformed scope context; and
4. an object that does not exist or is not visible to the caller.

The last three should not disclose data through response bodies, timing-sensitive
messages, logs, or audit payloads. Use the repository's existing scope guards and
negative-test fixtures where available.

## Migrations and data shape changes

Record the answers to these questions in the PR description:

- Can the previous application version run while the migration is rolling out?
- Is the migration safe to retry, and what happens after a partial failure?
- Is a backfill required, and how is progress observed?
- What is the recovery or rollback procedure if deployment is interrupted?
- Are indexes, constraints, defaults, and nullability aligned with the code?

Keep destructive cleanup separate from the compatibility migration when
possible. Prefer an additive expand/ migrate/ contract sequence.

## Verification notes

Every PR should name one focused verification path a reviewer can reproduce:

- a unit or integration test;
- a local CLI or smoke command;
- a UI scenario; or
- a documented manual request/response sequence.

This note is useful even when the broader CI suite is green; it captures the
author's highest-risk assumption and gives reviewers a fast way to challenge it.

## Bug fixes

For a defect fix, preserve a small record of the original failure: the input or
state that triggered it, the expected behavior, and the nearest boundary case.
When practical, add a focused regression test before or alongside the fix. Also
check the adjacent behavior that could be affected by the correction; a fix for
an empty collection, for example, should not change the one-item case.

## Persistence, configuration, and observability

Use established repository patterns for persistence queries: apply scope before
materializing data, project only the fields needed, paginate unbounded lists,
pass cancellation tokens, and avoid assumptions that a navigation property was
loaded. Treat configuration as input: provide a safe default where appropriate,
validate invalid combinations at startup, keep secrets out of source and logs,
and describe a compatible rollout for renamed or removed settings.

Logs should make an incident diagnosable without exposing secrets or customer
data. Include stable event names and correlation identifiers; redact tokens,
credentials, personal data, and raw request bodies unless a reviewed policy
explicitly permits them.

## Retries, concurrency, and UI states

For operations that callers, jobs, or users may repeat, decide whether duplicate
execution is harmless, rejected, or coalesced. Consider idempotency keys,
optimistic concurrency, transaction boundaries, and what a retry observes after
a partial failure.

For UI changes, exercise loading, empty, error, permission-denied, stale-data,
partial-data, and double-submit states. Date/time and numeric changes should use
UTC and culture-independent parsing at boundaries, explicit rounding rules for
money, and documented inclusive/exclusive range behavior.

## Dependencies

Before updating a dependency, inspect the release notes, lockfile delta,
transitive versions, license implications, and a practical rollback path. Note
the user-facing or security reason for the update in the PR when it is not
obvious from the version change.

## Advisory self-review

Run the optional helper from the repository root before handoff:

```powershell
pwsh -NoProfile -File scripts/agent/defect-prevention-advisory.ps1
```

It only prints suggestions based on changed file paths and always exits zero.
It does not modify files, run tests, or affect commits, builds, or merges.

## Additional change-specific guardrails

Use these prompts when the change touches one of the following areas:

- **Feature flags:** record the safe default, disabled-path behavior, owner, and
  retirement date for the flag.
- **Authorization:** update the role/resource/operation decision table and name
  the expected allow and deny outcomes.
- **Errors:** use the repository's established distinction between validation,
  conflict, not-found, forbidden, and transient failures; keep messages safe for
  end users and useful for support.
- **Caching:** define the cache key, tenant scope, TTL, invalidation trigger,
  stale-data behavior, and whether any sensitive value may be cached.
- **Background jobs:** decide retry and cancellation behavior, idempotency,
  poison-message handling, lease/ownership rules, and tenant context.
- **External integrations:** document timeout, retry, authentication, rate
  limit, schema-drift, sandbox/live, and fallback behavior.
- **Imports and exports:** check authorization, tenant boundaries, redaction,
  size limits, encoding, validation, duplicate handling, and auditability.
- **Accessibility:** verify keyboard access, focus movement, labels, error
  announcements, contrast, and screen-reader names for changed UI.
- **Dependency injection:** confirm service lifetimes are safe for database
  contexts, HTTP clients, caches, and request or tenant context.
- **Definition of done:** state the focused verification, documentation, rollout,
  and recovery work expected for the change type (API, UI, database,
  integration, job, or configuration).

## Further implementation safeguards

- **Nullability:** keep optional fields aligned across API contracts, domain
  models, persistence, and UI; document defaults instead of relying on implicit
  null behavior.
- **Serialization:** exercise renamed fields, unknown fields, enum additions,
  casing, defaults, and round-trip compatibility before changing wire formats.
- **Pagination:** consider empty and final pages, invalid cursors, stable
  ordering, duplicates, deleted records, and maximum page sizes.
- **Cancellation and timeouts:** propagate cancellation tokens and make timeout
  behavior explicit for database, HTTP, file, and background operations.
- **Resource disposal:** review streams, responses, database commands,
  temporary files, timers, and subscriptions for ownership and cleanup.
- **Localization:** avoid hard-coded user-facing strings and check culture,
  sorting, casing, pluralization, text expansion, dates, and numbers.
- **File processing:** validate content rather than trusting extensions, enforce
  size limits, sanitize names, prevent path traversal, and clean up partial work.
- **Test data:** prefer builders with explicit, realistic defaults; avoid shared
  mutable fixtures and test values that accidentally hide authorization or
  boundary defects.
- **Events and messages:** preserve stable names and versions, tolerate unknown
  fields, and account for duplicate delivery, ordering, retries, and dead-letter
  handling.
- **Operational readiness:** record the useful logs, metrics, audit events,
  rollback step, and support symptom for a faulty deployment.

## Additional prevention tasks

- **Input boundaries:** keep examples for empty, whitespace-only, Unicode,
  maximum-length, malformed-ID, duplicate, and contradictory inputs near the
  affected feature.
- **Destructive operations:** provide clear target identification, confirmation,
  preview or dry-run behavior, recovery/undo guidance, and an audit record.
- **Identifiers:** document when to use internal, public, opaque, or
  tenant-scoped identifiers and the expected behavior for invalid IDs.
- **Transaction boundaries:** identify which writes must succeed together and
  how partial success, compensation, and user-visible retry behavior work.
- **Data classification:** classify new fields as public, internal, personal,
  confidential, or secret before exposing them through APIs, logs, exports, or
  analytics.
- **Domain invariants:** record rules that must always hold and enforce them at
  the appropriate domain/application boundary rather than only in the UI.
- **Workflow states:** use a small state diagram for complex workflows showing
  valid transitions, terminal states, retries, cancellation, and recovery.
- **Changed defaults:** explain who is affected when a default changes, how
  existing records behave, and how a user can recover from an undesirable value.
- **Test doubles:** make mocks and stubs preserve important production traits,
  including authorization, failures, latency, cancellation, pagination, and
  realistic data shapes.
- **Regression learning:** after a defect, record the missed assumption and
  turn it into a reusable example, template, prompt, or self-review rule.

## Developer convenience safeguards

- **High-risk editor snippets:** provide approved snippets for scoped queries,
  authorized mutations, audit events, typed errors, cancellation, and HTTP
  calls so safe patterns are easy to reuse.
- **Advisory diagnostics:** surface likely omissions such as ignored
  cancellation, unsafe logging, unscoped queries, or synchronous I/O as
  informational guidance rather than merge gates.
- **Deterministic tests:** standardize injected clocks, random seeds, GUIDs,
  ordering, locale, time zones, and external responses.
- **Local fault injection:** document simple ways to simulate timeouts, network
  failures, duplicate messages, slow dependencies, and partial responses.
- **API deprecation:** document replacement fields/endpoints, communication,
  usage measurement, compatibility windows, and removal criteria.
- **Rate limits and backpressure:** consider burst traffic, per-tenant fairness,
  queue growth, retry storms, and user-safe overload responses.
- **Telemetry cardinality:** define safe metric and log dimensions so raw IDs or
  unbounded values do not accidentally create operational noise or cost.
- **Secret rotation:** document overlapping credentials, rollout order,
  fallback behavior, revocation, auditability, and emergency recovery.
- **Feature interactions:** check behavior with existing flags, roles,
  integrations, imports, caches, jobs, and tenant settings.
- **Pattern catalog:** maintain short repository-native examples and link them
  from the PR template so developers can copy known-safe approaches.
