# Defect-prevention implementation backlog

This backlog turns recurring product and delivery failure modes into small,
repeatable checks. Each item has an owner-facing trigger and an acceptance
test so the prevention work can be implemented incrementally and reviewed
without relying on memory.

## 1. Route inventory parity

- **Trigger:** A Next.js page, redirect, or tabbed hub route changes.
- **Prevention:** Compare App Router pages, help routes, redirects, and the
  owner traffic workbook from one canonical catalog.
- **Acceptance:** CI fails on duplicate URL paths, stale rows, missing rows, or
  redirect-only paths presented as canonical routes.

## 2. Help-topic search completeness

- **Trigger:** A help page, slug, alias, or search result changes.
- **Prevention:** Treat the help registry and search-panel catalog as linked
  contracts, including title, route, alias, and related-topic metadata.
- **Acceptance:** A catalog test fails when a searchable topic has no page, a
  page has no searchable entry, or an alias resolves to the wrong canonical
  slug.

## 3. Mutation audit coverage

- **Trigger:** A POST, PUT, PATCH, or DELETE endpoint is added or changed.
- **Prevention:** Derive the mutation inventory from controllers/OpenAPI and
  compare it with the audit-event matrix.
- **Acceptance:** CI fails when a mutation lacks an event type, actor/target
  mapping, redaction policy, or focused negative-path test.

## 4. Authorization outcome contracts

- **Trigger:** Authorization, tenant scope, or a UI action changes.
- **Prevention:** Test allowed, cross-tenant, missing-scope, forbidden, and
  not-found outcomes against both the API response and the UI state.
- **Acceptance:** The UI never advertises a successful action after a denied
  response, and denial responses do not disclose object existence.

## 5. Complete UI state matrix

- **Trigger:** A buyer-facing list, form, dashboard, or mutation flow changes.
- **Prevention:** Require fixtures/tests for loading, empty, error,
  permission-denied, stale/partial data, and duplicate-submit states.
- **Acceptance:** Every changed surface has deterministic selectors and at
  least one regression assertion for each applicable state.

## 6. Canonical-link and redirect verification

- **Trigger:** A route is renamed, moved, or consolidated into a tabbed hub.
- **Prevention:** Keep canonical links, intentional bookmarks, and redirects in
  one registry with explicit migration ownership.
- **Acceptance:** Tests verify old bookmarks redirect only when intended and
  every generated link points to the canonical route.

## 7. Expand/migrate/contract migration checks

- **Trigger:** A schema, index, constraint, default, or persisted field changes.
- **Prevention:** Validate forward compatibility, retry behavior, backfill
  progress, rollback/recovery, and older-application overlap.
- **Acceptance:** A migration test starts from an empty catalog and a prior
  representative schema, then proves both upgrade and safe restart behavior.

## 8. Accessibility regression gate

- **Trigger:** A UI component, route shell, modal, form, or navigation changes.
- **Prevention:** Run automated axe checks plus focused keyboard/focus tests for
  the changed surface; document any time-boxed exception.
- **Acceptance:** Critical/serious violations, missing accessible names, lost
  focus restoration, and broken skip/navigation focus fail the relevant CI job.

## 9. Release-diff risk review

- **Trigger:** A release changes policy, evidence, audit, authorization,
  export, migration, or other high-risk surfaces.
- **Prevention:** Generate a categorized diff and require a focused verification
  path, rollback signal, and support symptom for each affected category.
- **Acceptance:** The release checklist cannot close with an unclassified
  high-risk file or without a reproducible verification command.

## 10. Dependency and generated-contract integrity

- **Trigger:** A dependency, lockfile, OpenAPI schema, generated client, or
  snapshot changes.
- **Prevention:** Verify one resolved dependency version, generated-source
  parity, unknown-field/round-trip compatibility, and a documented rollback.
- **Acceptance:** CI fails on duplicate critical dependency versions, stale
  generated clients, incompatible contract snapshots, or unexplained fixture
  changes.

## Delivery rule

Existing repository checks should be linked to these items instead of creating
parallel mechanisms. A new recurring escape should add one focused regression
case and update the matching item with the smallest reusable prevention check.

## Fresh prevention ideas: wave 2

## 11. Contract-drift sentinel

- **Trigger:** An API schema, generated client, or response DTO changes.
- **Prevention:** Replay representative requests against the API and compare
  status codes, required fields, optional fields, enum values, and unknown
  property handling with the generated contract.
- **Acceptance:** CI reports the exact endpoint and field when runtime behavior
  diverges from the checked-in contract.

## 12. Replayable production failures

- **Trigger:** A production or staging incident reaches the defect log.
- **Prevention:** Store a sanitized input/state fixture with the expected result
  and the smallest neighboring boundary case.
- **Acceptance:** The fixture runs in the owning test lane and fails before the
  fix is applied in a verification branch.

## 13. Concurrency race probes

- **Trigger:** A write path uses retries, queues, optimistic concurrency, or
  duplicate-submit protection.
- **Prevention:** Run deterministic parallel attempts with the same resource,
  idempotency key, and cancellation point.
- **Acceptance:** The test proves the allowed number of side effects and the
  stable response for every competing caller.

## 14. Permission monotonicity checks

- **Trigger:** A role, policy, tenant scope, or resource filter changes.
- **Prevention:** Compare visibility and available actions for progressively
  narrower identities and scopes.
- **Acceptance:** Removing permission never increases returned data, exposed
  metadata, or enabled actions.

## 15. Sensitive-data sink scanner

- **Trigger:** A classified field is added to a DTO, log event, export, metric,
  URL, or client telemetry payload.
- **Prevention:** Maintain field classifications and scan known sinks for
  unapproved personal, confidential, or secret values.
- **Acceptance:** CI identifies the source field, sink, classification, and
  missing redaction or approval.

## 16. Configuration parity validation

- **Trigger:** A configuration key, default, environment variable, or secret
  binding changes.
- **Prevention:** Compare required keys, types, defaults, and validation rules
  across local, CI, staging, and production-like configurations.
- **Acceptance:** Missing keys, unsafe default drift, and undocumented
  environment-only behavior fail the configuration check.

## 17. Background-job poison handling

- **Trigger:** A worker consumes a message, scheduled job, or external event.
- **Prevention:** Exercise malformed input, repeated failure, expired lease,
  duplicate delivery, cancellation, and dead-letter routing.
- **Acceptance:** Retries are bounded, the poison item is observable, and no
  duplicate side effect occurs after recovery.

## 18. Clock-skew coverage

- **Trigger:** Expiry, scheduling, token, retry, or deadline logic changes.
- **Prevention:** Run with injected clocks ahead and behind, at UTC day
  boundaries, and across daylight-saving transitions.
- **Acceptance:** The test records the chosen clock and proves expiry and retry
  decisions remain stable at each boundary.

## 19. Resource-leak budget

- **Trigger:** A path opens a stream, response, database context, timer,
  subscription, or temporary file.
- **Prevention:** Add disposal assertions and bounded repeated-run diagnostics
  for long-lived or retrying paths.
- **Acceptance:** Repeated execution does not increase open handles, active
  timers, subscriptions, or temporary files beyond the declared budget.

## 20. Failure-message safety lint

- **Trigger:** An exception, validation message, API error, audit event, or
  support bundle changes.
- **Prevention:** Scan emitted text for stack traces, SQL fragments, tokens,
  secrets, raw cross-tenant identifiers, and internal file paths.
- **Acceptance:** The check fails with the source location and requires a safe,
  actionable replacement or an explicit reviewed exception.
