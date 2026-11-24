# FND-010 canonical authority read reuse — 2026-11-24

Baseline: master `600542b4c93637fd6532058cb8a0ad1cafd47ec1`. The six run-specific actions in `AuthorityReadsController` enter protected run-detail hydration under `ReadAuthority` without the architecture-specific sharing decision. Provenance reads through `IAuthorityQueryService` directly. The other five read through `AuthorityRunReadHandlers`. The legacy authority detail, manifest, timeline, rationale and provenance actions already check the shared gate before hydration.

| Canonical action | Protected work behind the share gate |
| --- | --- |
| `GetRunDetail` | Run detail, snapshots and enrichment |
| `GetRunManifest` | Run detail and sealed manifest |
| `GetReviewTrail` | Run detail and audit timeline |
| `GetReviewTrailRationale` | Run detail and decision rationale |
| `GetReviewTrailProvenance` | Run detail and provenance graph |
| `GetReviewTrailExport` | Run detail and traceability ZIP generation |

All six now consume the registered `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync` decision using the request principal, trusted scope, exact route run ID and request cancellation. The gate's existing 404 response covers missing and unshared runs. Existing seal verification and successful-access audit calls remain in the action flow.

`AuthorityReadsControllerShareAccessTests` uses strict dependencies for all six denial cases and an ordered positive gate decision followed by the existing scoped detail query. The existing FND-010 .NET Evidence Authorization workflow selects the new suite on PRs. The source audit addresses resource sharing. Mandatory central audit coverage on these surfaces remains a separate verification item.

The inventory action `ListRuns` needs a collection-level review of pre-pagination visibility, cursor behavior and the inventory seal check. Follow up by reconciling these six actions with the adoption baseline in #8052 after this change is integrated.
