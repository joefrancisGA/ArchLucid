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
