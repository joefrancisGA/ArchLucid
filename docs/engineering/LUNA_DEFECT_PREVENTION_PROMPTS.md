# Luna defect-prevention prompts

These prompts are intentionally narrow. Each asks Luna to inspect evidence first, make the smallest safe change, and report verification.

## Lint triage

> Run the project’s lint command. Group failures by root cause, fix only confirmed violations, and rerun lint. Do not weaken rules or add broad suppressions. Report changed files and verification results.

## TypeScript 7 compatibility

> Inspect the TypeScript, ESLint, and typescript-eslint versions. Confirm TypeScript 7 remains the compiler while the supported TypeScript API remains available to ESLint. Make the smallest compatible change, run clean-install checks, and report resolved versions.

## Authorization coverage

> Find API mutations missing explicit authorization or anonymous intent. Compare controller attributes with existing authorization tests and allowlists. Fix only genuine gaps and add focused regression tests.

## Tenant isolation

> Choose one tenant-scoped repository or service. Add a test proving tenant A cannot read, update, delete, or count tenant B’s records. Reuse existing test factories and run only the focused test suite.

## Idempotency

> Identify one retried mutation. Add a test that submits the same idempotency key twice and proves one durable result, one expected audit outcome, and no duplicate side effect.

## Migration safety

> Inspect the newest database migration. Add or improve a test for an empty catalog, upgrade from the previous schema, and safe startup after migration. Do not rewrite historical migrations.

## API error contract

> Select one public endpoint and verify validation, authorization failure, not-found, conflict, and unexpected-error responses. Ensure each uses the documented problem-details shape and does not expose secrets or stack traces.

## Background-job retry behavior

> Select one background worker. Test transient failure, retry exhaustion, cancellation, and poison-message handling. Verify correlation ID, tenant context, retry count, and durable failure state.

## Playwright console guard

> Add a focused Playwright test for one critical user journey. Fail on unexpected page errors, console errors, failed requests, and HTTP 5xx responses. Use a small documented allowlist only for known browser noise.

## Temporary behavior cleanup

> Find temporary flags, compatibility aliases, allowlists, and TODO workarounds. Add owner, reason, replacement plan, and expiry metadata. Add a CI check that fails when an entry expires or lacks required fields.
