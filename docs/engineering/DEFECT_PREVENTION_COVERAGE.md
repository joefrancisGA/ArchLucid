# Defect prevention coverage

This matrix is the completion record for the twenty ideas in
[`DEFECT_PREVENTION_IMPLEMENTATION_BACKLOG.md`](DEFECT_PREVENTION_IMPLEMENTATION_BACKLOG.md).
`Enforced` means a checked-in command or test can fail the relevant behavior.
`Partial` means only some surfaces are covered. `Gap` means the idea remains
advisory and needs implementation.

| Item | Status | Current evidence | Remaining work |
| --- | --- | --- | --- |
| Route inventory parity | Enforced | `scripts/ci/assert_archlucid_ui_app_router_unique_paths.py`; route catalog and workbook guards | Extend the same gate to all changed redirect declarations |
| Help-topic search completeness | Partial | `help-center-catalog.test.ts`; `help-search-panel-catalog.test.ts` | Add one registry parity test covering every help page and alias |
| Mutation audit coverage | Enforced | `scripts/ci/check_audit_matrix.py`; OpenAPI mutation audit guard | Keep the matrix required on pull requests |
| Authorization outcome contracts | Partial | Tenant scope guards and proxy authorization tests | Add a shared allow/deny/not-found contract fixture for changed endpoints |
| Complete UI state matrix | Partial | Existing component and Playwright state tests | Require the six applicable states for new changed surfaces |
| Canonical-link and redirect verification | Enforced | Help redirect parity tests and route catalog migration checks | Add generated-link crawling for non-help routes |
| Expand/migrate/contract migrations | Enforced | Migration numbering, SQL touch, and rolling-deploy checks | Add restart proof to every new migration fixture |
| Accessibility regression gate | Enforced | Mock and live axe jobs plus focus tests | Track exceptions with expiry and owner metadata |
| Release-diff risk review | Partial | Release gates and buyer surface strict guards | Produce a categorized diff artifact for each release candidate |
| Dependency and generated-contract integrity | Enforced | OpenAPI snapshot checks and single npm dependency version checks | Add a generated client round-trip fixture |
| Contract-drift sentinel | Enforced | OpenAPI snapshot and API type synchronization checks | Add runtime response replay for high-risk endpoints |
| Replayable production failures | Partial | Existing defect fixtures and seeded drills | Require sanitized fixture linkage in defect records |
| Concurrency race probes | Partial | Idempotency drift checks and concurrency-focused tests | Add deterministic duplicate-submit probes to write endpoint suites |
| Permission monotonicity checks | Partial | Navigation authority monotonicity tests | Add API result monotonicity checks for tenant-scoped reads |
| Sensitive-data sink scanner | Partial | Redaction tests and CodeQL coverage | Add a source-to-sink classified-field inventory |
| Configuration parity validation | Partial | Configuration parity checks and deployment preflights | Compare required keys across CI, staging, and production manifests |
| Background-job poison handling | Partial | Dead-letter alert tests and worker state coverage | Add bounded retry and duplicate delivery fixtures per message family |
| Clock-skew coverage | Partial | Date/time static guard and timezone tests | Add injected-clock cases for expiry and retry deadlines |
| Resource-leak budget | Gap | No repository-wide executable budget found | Add repeat-run disposal probes for streams, timers, contexts, and temp files |
| Failure-message safety lint | Partial | Sanitized logging rules and UI generic-error tests | Add a CI scanner for secrets, SQL, stack traces, and internal paths |

The remaining `Partial` and `Gap` rows are the implementation queue. A row
must move to `Enforced` only after its failure case is tested and its command is
wired into the appropriate CI lane.
