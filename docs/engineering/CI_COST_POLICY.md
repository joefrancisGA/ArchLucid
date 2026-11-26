# CI cost and validation policy

Audience: contributors and release engineers.

## Standing policy (2026-11-26)

- Prefer cost-efficient, compilation-first development. Commit compiling increments without requiring a comprehensive regression run for every small change. Use focused tests for changed behavior and always distinguish unverified from passing.
- Batch related edits before opening or updating a PR. Do not deliberately trigger redundant runs per file. Cancel superseded PR runs; never cancel an active merge-queue run solely because another PR was updated.
- Keep existing required check names and enforce secret scanning, compilation and relevant authorization/security checks before merge. Do not override protections or report a skipped check as actual test execution.
- Keep ordinary master PR validation narrow. Use source-path lanes with conservative unknown-diff behavior. Prose-only changes may omit expensive compilation when the classifier explicitly determines that no executable or security-contract path changed.
- Consolidate same-project test filters into one invocation, reuse builds within jobs, cache dependencies, and prefer Linux for ordinary cross-platform integration scripts. Retain full platform checks on release/manual validation.
- Comprehensive regression, SQL, browser, fuzz, resilience and performance qualification belongs on the active release candidate (currently RC50), not on routine master PRs. Full master CI only on explicit request. Targeted SQL/security tests remain appropriate on relevant changes.
- Keep existing required FND-061 authorization and FND-010 coverage intact. Cross-workflow consolidation and shared build artifacts require validation of check provenance and same-SHA artifact integrity before retiring duplicate jobs.
- Target fewer than ten substantive workflows per routine PR where feasible; measure actual billed runner minutes before declaring savings. Prefer the cost objective over redundant breadth, not over security correctness.

## Measurement and rollout

Track workflow launches, job executions, canceled obsolete runs, cache hits, runner minutes and merge latency before/after the rollout. The observed baseline was 266 workflow launches over seven PR revisions. Do not equate launch reduction with dollar savings. No comprehensive build is automatically requested by this policy.

Review the active repository ruleset before moving a required check or changing its name. If actual CI or billing telemetry is unavailable, report that explicitly.
