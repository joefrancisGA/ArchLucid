> **Scope:** Engineering backlog deferred past V1 UI contract work; aligns with migration of core authority types to OpenAPI-backed aliases and `/api/proxy` verb parity. Not a buyer document.

# Operator UI architecture — deferred to V1.1

Baseline V1 commitments already shipped:

- **`/api/proxy` verb parity:** `PUT` and `DELETE` forwarded to upstream (alongside existing `GET` / `POST`) so browser calls to `src/lib/api/http.ts` (`apiPutNoContent`, `apiDelete`) succeed.
- **Contract-aligned authority facade:** `types/authority.ts` combines **OpenAPI** `components` (e.g. `RunSummaryResponse`, `RunDetailDto`, `ArtifactDescriptorResponse` with null-stripped optional ids where JSX requires `string | undefined`) with **manual** shapes where the snapshot is ambiguous (`ManifestSummary`) or comparisons/trust payloads are UI-scoped literals.

The items below remain **out of scope for V1** and are intentionally deferred to **V1.1** (or later as noted).

## 1. Client data-fetching layer (TanStack Query / SWR)

**Why deferred:** Pilot-scale usage tolerates imperative `fetch` + local `useState`; no cross-tab cache or automatic dedupe is a V1 contract requirement.

**V1.1 intent:** Introduce a shared fetching layer with dedupe, stale-while-revalidate, mutation invalidation keys aligned to tenant/run scope headers, without moving business rules client-side.

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

## 8. Next.js major upgrade (`15.5.x` → `16.x`)

**Why deferred:** V1 pins **`next@^15.5.18`** with **React 19** and **Turbopack** in dev (`next dev --turbopack`). A major bump touches `next`, `eslint-config-next`, `next.config.ts` (standalone output, CSP, font-manifest workaround), the `/api/proxy` BFF route, and every merge-blocking UI gate. It does not unblock the V1 operator happy path or buyer-contract integrations.

**V1.1 intent:** Land as a **standalone PR** (no feature coupling), after V1 GA is stable:

- Bump **`next`** and **`eslint-config-next`** to the current **16.2.x** line (Dependabot branches already exist under `dependabot/npm_and_yarn/archlucid-ui/next-16.2.*`).
- Run **`npx @next/codemod@latest upgrade`** (or equivalent) and fix deprecations in `archlucid-ui/next.config.ts` and App Router surfaces.
- Re-verify: **`npm run lint`**, **`npm run typecheck`**, **`npm run test`**, Playwright **mock + operator-shell + visual + a11y** projects, and the **standalone** production build path used by live E2E (`ARCHLUCID_SKIP_STANDALONE_OUTPUT` / CI `npm run build`).
- Let **React 19** float to latest patch on the same PR or immediately after (patch-only, lower risk than the Next major).

**Acceptance:** Dev overlay no longer labels the stack “outdated” relative to npm latest; no regressions in operator shell smoke or screenshot baselines.

---

**Related:** `archlucid-ui/AGENTS.md`, `docs/library/V1_SCOPE.md` §3 (UI E2E scope), `docs/library/API_CONTRACTS.md`.
