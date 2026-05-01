# Operator runs list — demo / static fallback

## Why

Primary navigation includes **Runs**. When `listRunsByProjectPaged` throws or returns JSON that fails coercion, the empty error state is a bad demo and screenshots show a dead end.

## Behavior

`tryStaticDemoRunSummariesPaged(projectId[, options])` in `src/lib/operator-static-demo.ts` returns a single **Claims Intake Modernization** row when **any** of:

- `NEXT_PUBLIC_DEMO_STATIC_OPERATOR=true`
- `NEXT_PUBLIC_DEMO_MODE=true` / `=1`

**Or** callers pass `{ afterAuthorityListFailure: true }`: when `listRunsByProjectPaged` **throws** or coercion fails (reviews page, home dashboard snapshot, merged pickers, executive error paths, runs grid error boundary), the same curated row appears **without** needing demo env vars (`OpenAI UI assessment 2026-05-01`).

Review detail, manifest summary, findings inspect, explanation, artifacts, timeline, provenance graph, and governance approval/promotion static payloads for known showcase URL tokens activate via `isStaticDemoPayloadFallbackActiveForRun` **without** those env vars when live authority APIs fail.

The runs page clears `loadFailure` / `malformedMessage` after applying this fallback and shows `OperatorDemoStaticBanner`.

## Related fix

The **Recent finalized runs — median delta** strip (`BeforeAfterDeltaTopPanel`) previously called `.slice()` on a missing `runId` from lax API payloads, which surfaced as the generic **Something went wrong** error boundary. Rows are now keyed and shortened defensively.

## Policy pack routes

`/governance/policy-packs/[id]` with `id === "undefined"` (string) redirects to `/governance` via a server wrapper page; debug `policyPackId:` copy was removed from the UI.
