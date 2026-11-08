# Review href routing (Working desk)

Operators in **Working** mode should open review workspaces under the architecture identity desk when a parent `architectureId` is known. Peer URLs (`/architecture/reviews/{runId}`) remain valid entry points; the shell may redirect or link builders should prefer nested hrefs for continuity.

## Canonical helpers

| Surface | Helper | Notes |
|--------|--------|--------|
| Open review (pathname-aware) | `resolveDeskContinuityReviewOpenHref` | Uses current route + cached desk continuity when nested id is missing |
| Open review (scoped insight / home) | `resolveScopedInsightOpenReviewHrefWithDeskContinuity` | Recent primary review target + cache |
| Review workspace from run + architecture | `buildReviewWorkspaceRouteHref` | Tab, finding, hash |
| Working share / clipboard | `resolveWorkingShareReviewHref` | Nested base when Working |
| Print / provenance child routes | `resolveWorkingReviewChildSuffixHref` | Print and provenance under nested reviews |
| Back navigation after child routes | `resolveWorkingBackHref` | Desk continuity before flat fallback |
| Governance / home “open review” | `resolveGovernanceScopedReviewOpenHref` | Same desk resolution pattern as governance queue |
| First-review spine open gate | `resolveFirstReviewOpenGateReviewHref` | Includes spine hash and finding id |
| Findings / evidence inspect | `resolveQuickDecisionFindingWorkspaceHref` | Governance and graph deep links |
| Sealed collateral back | `resolveSealedCollateralReviewDeskHref` | Manifest and sealed-record surfaces |
| Global search | `resolveGlobalSearchDeskArchitectureId` | Maps search hit to desk architecture id |
| Lib / pilot rails (no pathname) | `resolveLibOpenReviewHref` | Uses desk continuity cache for first-pilot and palette hrefs |
| Lib workspace / finding / provenance | `resolveLibReviewWorkspaceHref`, `resolveLibFindingDetailHref`, `resolveLibReviewProvenanceHref` | Lib copy, sponsor exports, findings job views, and evidence chips without `usePathname` |
| Flat peer guard (CI) | `flat-peer-review-href-guard.test.ts` | Blocks `` href={`/architecture/reviews/${…}` `` in guarded Operate scopes |

## Route shapes

- **Nested (preferred when id known):** `/architecture/architectures/{architectureId}/reviews/{runId}`
- **Peer (legacy / deep link):** `/architecture/reviews/{runId}`

## Continuity writes

`OperatorRecentViewsTracker` persists `parentArchitectureId` on review visits. Recent views and desk continuity cache feed home “continue review” and pin/compare flows.

## Agents

When adding a new link to a review detail tab or finding workspace, search this table first and extend an existing helper before inlining `reviewDetailPath` or template-literal peer paths.
