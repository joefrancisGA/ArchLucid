# FND-010 exact-manifest sealed-read reuse consolidation (2026-11-24)

## Decision

Consolidate the **duplicated manifest-summary identity and sealed-integrity algorithm** in the **existing** `ArchLucid.Application.Runs.Finalization.SealedManifestReadGuard`; do not create a new authorization service, move MVC HTTP policy into Application, or duplicate `IArchitectureShareAccessGate`.

The audit was performed against `master` after PR #7998 was merged. The consumer-specific manifest-ID reads are already gated in both controllers:
- `AuthorityQueryController.GetManifestSummary` reads a scoped manifest-to-run projection, invokes the canonical `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync`, hides denied run IDs as manifest 404, then loads the summary and exact manifest.
- `ArtifactExportController`'s four manifest-ID artifact actions use the same scoped run projection, share gate and exact-manifest lookup; the three run-ID wrappers gate before hydrating run detail and delegate to those manifest routes.

**Confirmed duplication, not new policy:** both controllers independently checked (a) run-header ↔ pinned golden-manifest ID/run ownership, (b) requested manifest ID, authorized run ID, tenant/workspace/project scope, and summary hash, and (c) both sealed hashes when a historical manifest is requested. These checks were each ~40–65 lines in controller partials and invoked the same `SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow` primitive. Separate implementations could drift over time and produce inconsistent authorization-adjacent integrity behavior.

## Implementation

Extend the *existing* static `SealedManifestReadGuard` with `EnsureManifestSummaryBindingAndHashesOrThrow(scope, manifestId, summary, requestedManifest, runDetail, hashService)`. It accepts only verified, scoped read models, **never makes a repository lookup or an authorization decision**, and raises the existing `ConflictException` for any inconsistent association. The already-existing sealed-hash primitive is called on:
- **Current pinned document:** exactly once when the same object is both requested and current.
- **Historical requested document:** the requested manifest's hash and the current pinned manifest's hash, each once, independently.
- Missing/mismatched run, pinned pointer, requested ID/scope/owner, summary hash or self-inconsistent same-ID documents: fail closed.

`AuthorityQueryController.SealedManifestGuard.cs` and `ArtifactExportController.SealedManifestGuard.cs` now delegate their common integrity validation to this Application guard, retaining their existing HTTP 409 mapping. The artifact wrapper keeps a short pinned-header precheck **only to avoid a needless historical repository read when the run association is already invalid**; the shared guard independently revalidates this before hashing. Existing HTTP authorization, 404 disclosure policy, sealed manifest and lifecycle/career checks are unchanged.

**Why not merge authorization and integrity into one new component?** The existing `IArchitectureShareAccessGate` owns principal-aware access evaluation and non-disclosing HTTP denial, whereas `SealedManifestReadGuard` owns content identity and hash consistency. A combined service would need to entangle MVC `IActionResult`, principal resolution, repository reads, and application hash rules, or add yet another public authorization contract. Two controller consumers and four artifact paths justify **reuse of the shared validation algorithm**, not an expanded policy abstraction. The manifest-summary projection-to-run recheck remains intentionally repeated near the access gate so denied requests never read full payload data.

## Regression evidence

The existing focused FND-010 .NET authorization workflow already selects `AuthorityManifestSummaryShareAccessTests` and `ArtifactExportSealedManifestRuntimeConflictTests`. Added five *direct guard* cases to the former (current/historical seal count and rejection-before-hash for wrong run, pinned ID, requested scope). The existing controller negative/positive cases assert denied-before-read behavior, current versus historic manifest retrieval, tampered hash conflicts, no disclosure and unchanged downstream artifact reads. No workflow modification or full `master` build is necessary.

Source-only changes are **not evidence of a passing test run**; the draft PR's focused CI must compile and execute these suites.

## Audit provenance

Source path history returned by GitHub at review time (not rename-following):
| File | Earliest visible path commit (UTC) | Latest path commit on baseline master (UTC) |
| --- | --- | --- |
| `SealedManifestReadGuard.cs` (Application) | 2026-09-04 02:04:23 | 2026-09-04 02:04:23 |
| `AuthorityQueryController.SealedManifestGuard.cs` | 2026-09-09 01:42:31 | 2026-11-24 08:20:20 |
| `ArtifactExportController.SealedManifestGuard.cs` | 2026-09-04 02:04:23 | 2026-11-24 13:55:48 |
| `AuthorityManifestSummaryShareAccessTests.cs` | 2026-11-24 07:10:48 | 2026-11-24 08:02:03 |

The **oldest reviewed source path modified in this PR** is `SealedManifestReadGuard.cs`, last previously modified on September 4, 2026. No claim is made about pre-rename lineage.

No cloud execution/remediation change; no additional FND control family; owner retains merge authority; full builds on `master` remain disallowed absent an explicit instruction.
