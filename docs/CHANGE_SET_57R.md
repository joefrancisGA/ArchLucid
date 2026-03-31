# Change Set 57R — operator-journey E2E (Playwright)

## Prompt 1 — deterministic fixtures + proxy route interception

**Scope:** `archiforge-ui` only. No production behavior changes.

**Delivered:**

- `e2e/fixtures/` — typed JSON-shaped payloads aligned with `coerceRunDetail`, `coerceManifestSummary`, `coerceArtifactDescriptorList`, `coerceRunComparison`, `coerceGoldenManifestComparison`, `coerceComparisonExplanation`.
- `e2e/helpers/route-match.ts` — centralized pathname + query matching for `/api/proxy/...` → backend paths (avoids brittle full-URL string equality).
- `e2e/helpers/register-operator-api-routes.ts` — single `page.route('**/*')` dispatcher with `registerOperatorJourneyApiRoutes(page, config)`; presets `registerCompareAndExplainRoutes`, `registerDefaultRunManifestArtifactRoutes`; optional artifact bundle GET/HEAD.
- `e2e/compare-proxy-mock.spec.ts` — exercises **client** compare flow (browser → `/api/proxy`) with mocks.
- `e2e/smoke.spec.ts` — assertions updated to match the current home page (`ArchiForge` **h1** in layout, **Start here** **h2** on `/`).

**Note:** Run and manifest **RSC** pages call the API from the Next server (`getServerApiBaseUrl`); they are **not** covered by `page.route` interception. Prompt 2 adds a **loopback mock HTTP server** started alongside Next for Playwright so RSC receives the same fixture payloads.

---

## Prompt 2 — run detail → manifest → back (E2E)

**Delivered:**

- `e2e/mock-archiforge-api-server.ts` — serves `GET /health`, run detail, manifest summary, and artifact list for fixture IDs (imports `e2e/fixtures`).
- `e2e/start-e2e-with-mock.ts` — Playwright `webServer` entry: starts mock on **127.0.0.1:18765** (override with `E2E_MOCK_API_PORT`), sets **`ARCHIFORGE_API_BASE_URL`**, then `next start -p 3000`.
- `e2e/run-manifest-journey.spec.ts` — linear journey with role/text assertions (no snapshots).
- `playwright.config.ts` — `webServer` runs **build** then **start-e2e-with-mock** (not `npm run start` alone).
- **`tsx`** devDependency — runs the TypeScript mock + launcher.
- Root `tsconfig.json` **`exclude`: `e2e`** so Next build does not typecheck E2E-only files; **`e2e/tsconfig.json`** + **`npm run typecheck:e2e`** cover them.

**Caveat:** `reuseExistingServer: true` with a hand-started `npm run start` that does **not** point at the mock will fail this journey until you use the Playwright-managed stack or set **`ARCHIFORGE_API_BASE_URL=http://127.0.0.1:18765`** and run the mock separately.

---

## Prompt 3 — compare journey (query prefill + review order)

**Delivered:**

- `e2e/compare-journey.spec.ts` — opens `/compare?leftRunId&rightRunId` with fixture IDs; asserts placeholder inputs prefilled; **`registerOperatorJourneyApiRoutes`** with legacy + structured fixtures only (no AI); clicks **Compare**; asserts **Compare runs** heading, 55R-style guidance (**structured first** / **legacy flat diff**), **`#compare-structured`** and **`#compare-legacy`**, **Review order** nav (structured link before legacy), **Last compare request** region with both outcomes **OK**; uses fixture-backed rows (**topology** / **serviceCount**) for legacy visibility. Waits on visible content only (no fixed sleeps).

---

## Prompt 4 — compare stale input warning

**Delivered:**

- `e2e/compare-stale-input-warning.spec.ts` — self-contained flow: mock legacy + structured, compare, change base run ID, assert **`OperatorWarningCallout`** copy (**Run IDs no longer match the results below.**, **Content below still reflects**, prior pair in **`code`**, **restore the previous values**); then restore the original left ID and assert the warning copy is gone.

---

## Prompt 5 — manifest empty artifact list vs bundle affordance

**Delivered:**

- **`FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID`** + **`fixtureManifestSummaryEmptyArtifacts()`** — same coercion contract as other manifest summaries; artifact list stub returns **`[]`** for that id only.
- **`e2e/mock-archiforge-api-server.ts`** — routes summary + artifact list for the new manifest id (empty array).
- **`e2e/manifest-empty-artifacts.spec.ts`** — RSC load of `/manifests/...`; asserts **no** artifact-list **failure/malformed** callouts; **`OperatorEmptyState`** (**No artifacts listed for this manifest**) with **valid empty result** + **Bundle ZIP may return 404** copy; **Download bundle (ZIP)** link present with **`href`** containing manifest id and **`bundle`**; **no** artifact table headers. File-level comment documents distinction vs request failures and bundle semantics.

**Out of scope (per prompt):** no simulated bundle download / `page.route` click-through — keeps the spec stable; operator copy already separates empty list from ZIP availability.
