# FND-017 initial real-source reconciliation — 2026-11-22

## CI evidence

The FND-017 GitHub Actions workflows for PRs #7766, #7768, #7769, #7771, #7772 and #7773 were all **queued** when inspected. This report does not claim that the analyzers compile or that any test passed. Latest observed run: [45053015293](https://github.com/joefrancisGA/ArchLucid/actions/runs/45053015293), semantic-boundaries job queued.

## Actual endpoint inspected

`ArchLucid.Api/Controllers/Planning/GraphController.Snapshot.cs`, method `GetArchitectureGraphTemporalSnapshot` on master.

The endpoint has a `secureNowExchange` feature-flag branch. The anchor authorization is performed only when `secureNowExchange` is true; ordinary graph reads intentionally bypass that SecureNow-specific gate. The resolved run is separately authorized inside a second `secureNowExchange` conditional before `authorityQueryService.GetRunDetailAsync`. Both gate results are checked for denial and terminate with `NotFound()`. The code also compares resolved and anchor project IDs before the second authorization.

### Rule-by-rule initial disposition

| Rule | Preliminary disposition | Reason |
| --- | --- | --- |
| FND017001 | Awaiting compilation / repository baseline | Semantic Core dependency rule; no confirmed full-repo build |
| FND017002 | **Known false-positive risk** | Requires authorization invocation before unconditional repository read even for non-SecureNow mode |
| FND017003 | Source pattern appears satisfied; awaiting tests | Both SecureNow gate results use `if (!access.Allowed) return NotFound()` (second uses `resolvedAccess`) |
| FND017004 | **Known false-positive risk** | A SecureNow gate inside `if (secureNowExchange)` cannot dominate an unconditional read across the ordinary non-exchange path |
| FND017005 | Source pattern appears satisfied; awaiting tests | First gate binds `runId`; second binds `resolved.RunId`, both use current scope and principal |

## Safe disposition

**Do not promote any FND-017 diagnostic to mandatory enforcement.** FND017002 and FND017004 require mode-aware path predicates before their findings can be interpreted as security defects. FND017003 checks only a narrow denial-return pattern and FND017005 checks explicit argument syntax rather than general dataflow. A successful workflow is a prerequisite, not a substitute for cross-tenant runtime tests and security review.

## Follow-up acceptance criteria

1. GitHub Actions actually executes and passes all analyzer regression suites.
2. Test against the real endpoint in both `secureNowExchange=false` and `secureNowExchange=true` modes.
3. Replace unconditional read dominance with path-sensitive implications: every *SecureNow exchange* read must be guarded by a successful authorization for that exact run.
4. Validate that the resolved resource is project-scoped and that denied gates cannot fall through.
5. Record observed diagnostics, false positives, owner-reviewed exemptions and baseline counts before any blocking rule.
