> **Scope:** Engineering backlog deferred past V1 UI contract work; aligns with migration of core authority types to OpenAPI-backed aliases and `/api/proxy` verb parity. Not a buyer document.

# Operator UI architecture — deferred to V1.1

Baseline V1 commitments already shipped:

- **`/api/proxy` verb parity:** `PUT` and `DELETE` forwarded to upstream (alongside existing `GET` / `POST`) so browser calls to `src/lib/api/http.ts` (`apiPutNoContent`, `apiDelete`) succeed.
- **Contract-aligned authority facade:** `types/authority.ts` combines **OpenAPI** `components` (e.g. `RunSummaryResponse`, `RunDetailDto`, `ArtifactDescriptorResponse` with null-stripped optional ids where JSX requires `string | undefined`) with **manual** shapes where the snapshot is ambiguous (`ManifestSummary`) or comparisons/trust payloads are UI-scoped literals.

The items below remain **out of scope for V1** and are intentionally deferred to **V1.1** (or later as noted).

## 1. Client data-fetching layer (TanStack Query / SWR)

**Status:** **Partially shipped** (2026-07-01, **TB-562**). Operator shell high-traffic reads (home runs list, pilot recent deltas, executive ROI summary, core-pilot commit context) use TanStack Query via `OperatorQueryProvider`, shared keys in `operator-query-keys.ts`, and `use-*-query.ts` hooks with 60s stale / 5min GC defaults. Governance queue, alerts inbox, and billing banners remain on imperative fetch until follow-on batches.

**Why deferred (remainder):** Pilot-scale usage tolerates imperative `fetch` + local `useState` for low-traffic surfaces; full-shell migration is incremental.

**V1.1 intent:** Continue migrating remaining `useEffect`+`fetch` reads with dedupe, stale-while-revalidate, mutation invalidation keys aligned to tenant/run scope headers, without moving business rules client-side.

## 2. Global client state beyond current Context scopes

**Why deferred:** Today’s shells (`WorkspaceActiveRunContext`, `OperatorNavAuthorityProvider`, chrome presets) suffice; expanding to Zustand/Jotai is unnecessary until real-time subscriptions span many routes.

**V1.1 intent:** Revisit only if alerts inbox, pipeline streams, or ITSM sync badges need coordinated cross-route updates without prop drilling.

## 3. Deeper consolidation of manual `types/*` with OpenAPI

**Why deferred:** Authority/run/manifest/compare/replay/provenance aliases now track the snapshot; advisory, alerts, governance, and marketing-specific DTOs still use hand-authored types where UI-only shaping dominates.

**V1.1 intent:** Migrate remaining `types/*.ts` files module-by-module, using `paths[route][verb].responses[status].content` helpers where schemas are stable.

## 4. Operator route caching (`force-dynamic` nuance)

**Why deferred:** The `(operator)` layout correctly opts out of static prerender across authenticated product chrome; narrowing `force-dynamic` per route is risky before traffic and observability targets are pinned.

**V1.1 intent:** Optionally mark stable help/marketing-adjacent operator pages for caching or partial prerender after security review.

## 5. `SidebarNav` decomposition

**Why deferred:** The component is large but covered by visibility/preset Vitest anchors; refactoring during V1 churn risks regressions to progressive disclosure.

**V1.1 intent:** Extract filter chains (demo / buyer-polished / preset / authority tier) into testable hooks or pure helpers while preserving `docs/../../archlucid-ui/docs/../../archlucid-ui/docs/../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md`.

## 6. Segment-level `not-found.tsx` for dynamic routes

**Why deferred:** Global and operator-root `not-found` plus API `404` handling cover pilots; richer contextual 404 copy can wait.

**V1.1 intent:** Add `not-found` per high-traffic segment (`reviews/[runId]`, manifests, policy packs) using `notFound()` from loaders.

## 7. Streaming and nested `Suspense` on heavy pages

**Why deferred:** `loading.tsx` exists for primary routes; further splitting is polish, not a gate for request → execute → commit.

**V1.1 intent:** Wrap independent sections on run detail and governance hubs for faster first paint on slow networks.

## 8. Next.js major upgrade (`15.5.x` → `16.x`) — **Done (2026-07-05, TB-641)**

**Promotion:** This item was originally deferred to **V1.1** (see superseded rationale below). During a V1.1/V2 backlog review, the owner promoted it to **active V1 engineering scope** — see `docs/assessments/LATEST_GPT55.md` §17 "Promoted to V1" for the original Cursor prompt and acceptance criteria.

**Shipped (2026-07-05, TB-641):** Bumped **`next`**, **`eslint-config-next`**, and **`@next/bundle-analyzer`** to **`^16.2.10`**; floated **React 19** to **`^19.2.0`**. Replaced **`next lint`** with direct **`eslint .`** using Next 16 native flat config (`eslint.config.mjs`). Removed the Windows **`experimental.webpackBuildWorker`** workaround (Turbopack is now the default production bundler). Inlined **`export const dynamic = "force-static"`** in `auth/layout.tsx` and `help/layout.tsx` (Next 16 Turbopack rejects re-exported route segment config). TB-573 **`check:first-load-js`** now **skips** when Next 16+ build logs omit per-route First Load JS columns (gate deferred until analyze-based capture ships). Verified: **`npm run lint`**, **`npm run typecheck`**, **`npm run build`** (standalone on Windows), Docker smoke build, and scoped Vitest.

**Why originally deferred (superseded):** V1 pinned **`next@^15.5.18`** with **React 19** and **Turbopack** in dev (`next dev --turbopack`). A major bump touches `next`, `eslint-config-next`, `next.config.ts` (standalone output, CSP, font-manifest workaround), the `/api/proxy` BFF route, and every merge-blocking UI gate. It did not unblock the V1 operator happy path or buyer-contract integrations — this reasoning is why it was V1.1, but the owner decided the framework-currency risk outweighed waiting.

## 9. Buyer-facing route aliases (manifest terminology in URLs) — **Done (2026-07-05, TB-399)**

**Why originally deferred:** V1 manifest terminology work (**TB-355** / **TB-366**) scoped to **on-page copy** only — labels, help, compare strings, error headings — without changing App Router segments, API contracts, or persistence. Buyers used to see `/manifests/` and `/reviews/{runId}/manifest` in the address bar, bookmarks, and shared links.

**Shipped (2026-07-05):**

- **Canonical alias paths** (`/signed-records`, `/signed-records/{id}`, `/reviews/{runId}/signed-record`) with **permanent redirects** from legacy manifest segments already existed in `next.config.ts` (same pattern as `/runs` → `/reviews`), plus a canonical helper module `archlucid-ui/src/lib/signed-records-paths.ts`.
- **Closed this pass:** the one remaining internal hand-rolled hardcoded builder — `manifestHref()` in `archlucid-ui/src/app/(operator)/search/_sections/retrieval-hit-display.ts` — now calls `signedRecordDetailPath()` instead of building `/manifests/${id}` directly. Two stale live-API E2E selectors (`live-api-trial-signup.spec.ts`, `live-api-trial-end-to-end.spec.ts`) asserting the legacy `a[href^="/manifests/"]` prefix were updated to `a[href^="/signed-records/"]` to match already-shipped production behavior elsewhere (e.g. `RunDetailAuthorityChainSection.tsx` already emitted the canonical path). Robots-disallow (`public-marketing-seo-paths.ts`) and the CTO demo valid-route allowlist (`buyer-cto-demo-cto-questions.ts`) were extended to include `/signed-records/` alongside the legacy `/manifests/` entries.
- Backend `/v1/authority/manifests/*` routes, `manifestId` fields, internal component/type names, and `/manifest.webmanifest` were **not** touched, per the original scope boundary.

**Verification:** `retrieval-hit-display.test.ts` and `src/lib/marketing` Vitest suites pass (39/39, 14 files) against the updated paths.

---

**Related:** `archlucid-ui/AGENTS.md`, `docs/library/V1_SCOPE.md` §3 (UI E2E scope), `docs/library/API_CONTRACTS.md`.
