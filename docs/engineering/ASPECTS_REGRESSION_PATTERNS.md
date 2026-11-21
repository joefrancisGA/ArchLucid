# Aspects regression-pattern library (design recommendation #16)

This small cross-product registry reuses **real, pre-existing** ArchLucid and SecureNow tests introduced by merged Aspects pull requests. It deliberately does not copy test fixtures or change application behavior. The deliverable is an executable, reviewable index of repeat defect classes plus a safe focused test runner.

## Initial evidence and coverage

| Pattern | Source pull requests | Representative tests |
| --- | --- | --- |
| Atomic persistence and idempotency | #7501, #7463 | Failed agent-result replacement rolls back; concurrent identical insight signals reuse one record |
| Malformed external data | #7538 | Oversized JSON finding/run identifiers cannot overflow |
| Tenant/workspace/project scoping | #7457 | Foreign-workspace ITSM tickets cannot contaminate risk-register reads |
| Cancellation and stale responses | #7467, #7511, #7523 | Caller cancellation propagates, obsolete finding audits and previous product responses cannot overwrite current results |
| Deterministic pagination/completeness | #7532 | Bounded audit pages produce accurate overflow evidence |

There are **eight registered regression cases** across five patterns and two product lines; five can run without SQL Server, and three are explicitly SQL-gated. Shared ArchLucid assemblies also implement SecureNow functionality. The product field is a feature-coverage annotation, not a separate build target.

## Fast no-dependency checks

From the repository root:

    python3 -m unittest discover -s scripts/tests -p 'test_aspects_regression_patterns.py'
    python3 scripts/ci/aspects_regression_patterns.py --check --plan

The catalog guard rejects dangling test method references, missing or unsafe paths, duplicate IDs, invalid selectors and disappearance of any of the five defect patterns or two product lines. A lightweight PR workflow performs only these Python checks; the regular CI matrix retains responsibility for compiling and running the actual application tests.

## Run focused behavior regressions

    python3 scripts/ci/aspects_regression_patterns.py --run
    python3 scripts/ci/aspects_regression_patterns.py --run --pattern async-lifecycle
    python3 scripts/ci/aspects_regression_patterns.py --run --include-sql

The runner uses subprocess argument arrays (never a shell). It requires the existing .NET 10 SDK and restored NuGet packages, and Node 22 plus installed UI dependencies for Vitest. The .NET invocation deliberately uses --no-restore; run the normal repo restore before a manual targeted sweep. SQL integration tests are **opt-in** because existing SkippableFact methods can skip if no SQL Server fixture exists. A green process exit does NOT establish that SQL cases executed; verify passed/skipped output.

## Evolving the library

Register an existing behavior-level regression test for each genuinely recurring Aspects failure class. Prefer a test that failed before its fix and requires real expected behavior after it. Avoid adding hundreds of near-duplicates or building yet another large testing framework. The registry and runner are intentionally narrow to avoid consuming 1.0 release capacity.

No production code, database migrations, default CI jobs, RC48 stabilization workflows, or existing hourly Aspects sweeps are changed.
