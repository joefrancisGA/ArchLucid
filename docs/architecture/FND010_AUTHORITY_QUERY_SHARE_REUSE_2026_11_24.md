# FND-010 authority-query resource-sharing adoption audit — 2026-11-24

## Finding and scope

Reviewed production `AuthorityQueryController` partials against the existing, centrally registered `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync`. The `GetRunDetail` legacy action already invokes that gate before `readHandlers`. Seven other run-ID read actions used only the class-level `ReadAuthority` policy, trusted tenant/workspace/project scope and (where a manifest was present) sealed-manifest verification:

| Run-ID action | Existing read | Reuse change |
| --- | --- | --- |
| `GetRunSummary` | `GetRunDetailAsync` then `GetRunSummaryAsync` | Check shared run-share gate **first** |
| `GetBuyerRunDetailSummary` | `GetRunDetailForBuyerSummaryAsync` and enrichment | Check shared run-share gate **first** |
| `GetRunRetrievalGrounding` | `GetRunDetailAsync` and `runRetrievalGroundingService.BuildAsync` | Check shared run-share gate **first** |
| `GetRunPipelineTimeline` | Run detail, `readHandlers.TryGetPipelineTimelineAsync` and audit | Check shared run-share gate **first** |
| `GetRunRationale` | Run detail, `readHandlers.GetRunRationaleAsync` | Check shared run-share gate **first** |
| `GetRunProvenance` | Run detail, provenance graph and audit | Check shared run-share gate **first** |
| `GetRunGoldenManifest` | `readHandlers.GetRunDetailAsync` then signed manifest and audit | Check shared run-share gate **first** |
| `GetRunDetail` | Existing `EnsureRunReadAllowedAsync` | Refactor to reuse the same local helper, preserve authorization order |

**Confirmed omission:** Seven controller-level read paths lacked the **additional architecture-specific restricted-sharing check** already required by the eighth. This is not evidence of cross-tenant leakage: read policy and scoped repository queries remain separate protective boundaries. `SealedManifestReadGuard` verifies signed integrity, not whether the principal may view a restricted architecture.

## Implementation

In the existing `AuthorityQueryController.SealedManifestGuard.cs` partial, add private `EnsureRunShareReadAllowedAsync(scope, runId, ct)`. It simply delegates to **the already injected production** `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync(this, User, scope, runId, ct)`; no new policy or local authorization algorithm. Apply it before **any run-detail or other protected read** in seven affected actions, reusing it in the already-guarded `GetRunDetail`. Denied or missing runs preserve the established non-disclosing 404.

Existing sealed-manifest, lifecycle, audit, cancellation, enrichment and DTO projection logic is unchanged. `RecordRunOperatorGovernanceDisposition` is an ExecuteAuthority mutation and receives separate review; `GetManifestSummary` starts with a manifest GUID and would require manifest-to-run linkage plus independent share verification, not a blind run-GUID gate. Scope-wide inventory/list routes also remain separate.

## Regression

Add an eight-case negative xUnit theory to the existing `AuthorityQueryControllerDispositionTests`, passing a strict `IArchitectureShareAccessGate`. For run summary, detail, buyer summary, retrieval grounding, timeline, rationale, provenance, and signed review record, a denied sharing decision must return `NotFoundResult` before **any** `IAuthorityQueryService` query or delegated `AuthorityRunReadHandlers` query. Existing ExecuteAuthority disposition bad-request tests remain intact.

Include `AuthorityQueryControllerDispositionTests` in the existing focused `FND-010 .NET Evidence Authorization` workflow; only actual compilation and executed tests are proof. Avoid running comprehensive/full `master` builds, changing master directly, or merging without owner approval. All other architectural controls remain untouched.

## Source provenance and limitations

GitHub path-filtered commit history (first returned page complete, <50 path commits, **not rename-follow**) at audit time:

| Inspected source | Earliest visible commit for path (UTC) | Last path modification on baseline master (UTC) |
| --- | --- | --- |
| `AuthorityQueryController.RunDetail.cs` | 2026-08-26 13:19:04 | 2026-10-10 06:35:24 |
| `AuthorityQueryController.Trail.cs` | 2026-08-26 13:19:04 | 2026-09-10 19:19:17 |
| `AuthorityQueryController.SealedManifestGuard.cs` | 2026-09-09 01:42:31 | 2026-09-10 16:55:50 |
| `AuthorityQueryControllerDispositionTests.cs` | 2026-09-12 17:00:58 | 2026-09-25 21:43:41 |

The **oldest visible source-file path cohort touched** is `RunDetail.cs` and `Trail.cs`, both dating to 2026-08-26. The **least recently modified of those two before this audit** was `Trail.cs`, last modified 2026-09-10. These are GitHub path-history facts, not a proven earliest date after historical renames. This PR modifies them again on 2026-11-24.

No blanket claim of all endpoint coverage; later review must inventory manifest-ID lookup, mutations, and other controllers. Pending PRs #7968/#7969/#7976 concern distinct readers and must be kept independent.
