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
