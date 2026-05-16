> **Scope:** Cursor prompts for the 8 actionable improvements from the 2026-04-26 independent quality assessment (60.18%). Each prompt is self-contained and ready to paste into a Cursor agent session.

# Cursor Prompts — Quality Assessment 2026-04-26

**Source:** [QUALITY_ASSESSMENT_2026_04_26_INDEPENDENT_60_18.md](QUALITY_ASSESSMENT_2026_04_26_INDEPENDENT_60_18.md)

---

## Improvement 1: Create an Anonymous Hosted Demo Experience

**Impact:** Directly improves Time-to-Value (+10–12 pts), Adoption Friction (+5–7 pts), Marketability (+6–8 pts), Decision Velocity (+10–12 pts). Weighted readiness impact: +1.5–2.0%.

```text
In `ArchLucid.Api`, create an anonymous demo viewer mode that exposes pre-seeded demo data without authentication.

What to build:
1. Add a new configuration section `Demo:AnonymousViewer:Enabled` (default `false`) in `appsettings.json`
2. Create a new controller `DemoViewerController` at route prefix `/v1/demo/viewer/` that serves read-only endpoints for: runs list, run detail (with pipeline timeline, findings, manifest), comparison view, and graph view — all reading from the existing demo seed data (Contoso Retail baseline + hardened runs)
3. These endpoints should bypass authentication when `Demo:AnonymousViewer:Enabled` is `true` but enforce `ReadAuthority` equivalent read-only access — no mutations allowed
4. Add rate limiting using the existing `fixed` policy to prevent abuse
5. Add a health check tag so `/health/ready` reports whether the demo viewer data exists
6. Add an integration test class `DemoViewerControllerTests` in `ArchLucid.Api.Tests` with `[Trait("Suite", "Core")]` that validates: anonymous access works when enabled, returns 401 when disabled, returns demo data shape, and mutation endpoints are not exposed

Constraints:
- Do NOT modify existing authentication middleware or policies
- Do NOT expose any mutation endpoints (POST/PUT/DELETE for runs, commits, governance)
- Do NOT add new dependencies
- Reuse existing `DemoSeedService` and query services — do not duplicate data access
- Follow the existing controller patterns in `ArchLucid.Api/Controllers/`
- Each class in its own file

Acceptance criteria:
- `GET /v1/demo/viewer/runs` returns the seeded Contoso runs without authentication when enabled
- `GET /v1/demo/viewer/runs/{runId}` returns run detail including findings and manifest references
- `POST /v1/demo/viewer/*` returns 405 Method Not Allowed
- All endpoints return 401 when `Demo:AnonymousViewer:Enabled` is `false`
- Integration tests pass in the Core suite

Do not change: Existing demo seed logic, existing auth middleware, existing controller routes
```

---

## Improvement 2: Create a Synthetic ROI Case Study with Automated Generation

**Impact:** Directly improves Proof-of-ROI Readiness (+8–10 pts), Marketability (+3–5 pts), Executive Value Visibility (+3–5 pts). Weighted readiness impact: +0.7–1.0%.

```text
Create a synthetic but realistic ROI case study document and wire it into the demo flow.

What to build:
1. In `docs/go-to-market/`, create `SYNTHETIC_CASE_STUDY_CONTOSO_RETAIL.md` — a realistic (but clearly labeled synthetic) case study for the Contoso Retail demo tenant showing: baseline metrics (manual review cycle hours, number of review iterations, evidence assembly time), post-ArchLucid metrics (committed manifest time, artifact generation, governance evidence), calculated ROI (hours saved per review, annualized value, payback period). Use the measurement framework from `PILOT_ROI_MODEL.md` with realistic numbers (e.g., baseline 40 hours per review cycle → 12 hours with ArchLucid, 3 review iterations → 1.5, evidence assembly from 8 hours → 2 hours).
2. In `ArchLucid.Application/Marketing/`, add a `SyntheticCaseStudyDataProvider` that returns the same metrics as a structured object matching the existing `ValueReportMetrics` shape, so the value report DOCX renderer can produce a populated example.
3. Add a unit test `SyntheticCaseStudyDataProviderTests` verifying the metrics are internally consistent (e.g., ROI percentage = (baseline - post) / baseline * 100).
4. Update `docs/go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md` if it exists to reference this case study.

Constraints:
- Clearly label the case study as SYNTHETIC in the title, header, and a disclaimer paragraph
- Use realistic but conservative numbers (do not overclaim)
- Follow the ROI model structure from `PILOT_ROI_MODEL.md`
- Do NOT modify the value report renderer itself
- Each class in its own file

Acceptance criteria:
- Case study markdown exists with complete before/after metrics
- `SyntheticCaseStudyDataProvider` returns consistent metrics
- Unit test passes
- All numbers are internally consistent and the document is clearly labeled as synthetic

Do not change: `PILOT_ROI_MODEL.md`, existing value report rendering logic, existing demo seed data
```

---

## Improvement 3: Simplify First-Run Wizard to 3 Steps

**Impact:** Directly improves Adoption Friction (+5–7 pts), Usability (+5–7 pts), Cognitive Load (+6–8 pts). Weighted readiness impact: +0.5–0.7%.

```text
In the `archlucid-ui` operator UI, create a "Quick Start" wizard variant that reduces the 7-step new-run wizard to 3 steps for first-time users.

What to build:
1. In `archlucid-ui/src/app/(operator)/runs/new/`, add a `QuickStartWizard` component that presents only 3 steps: (a) System name + environment preset selection (from existing presets like "Greenfield web app"), (b) Architecture brief (text input, min 10 chars), (c) Review and submit. All other fields (constraints, cloud provider details, advanced inputs) should use sensible defaults from the selected preset.
2. Add a toggle at the top of the `/runs/new` page: "Quick Start (3 steps)" vs "Full Wizard (7 steps)" — default to Quick Start for new tenants (tenants with zero committed runs), Full Wizard for returning users. Store preference in localStorage.
3. The Quick Start wizard should POST the same `ArchitectureRequest` shape to `POST /v1/architecture/request` with default values for omitted fields.
4. Add Vitest tests for the QuickStartWizard component verifying: renders 3 steps, submits valid request body, toggle switches between modes, preset selection populates defaults.

Constraints:
- Do NOT modify the existing 7-step wizard — it must remain available
- Do NOT change the API contract — use the same POST body with defaults for omitted fields
- Use existing UI components (from the component reference in `archlucid-ui/docs/COMPONENT_REFERENCE.md`)
- Follow the existing page patterns in `archlucid-ui/src/app/(operator)/`
- Ensure accessibility: proper aria labels, keyboard navigation, focus management

Acceptance criteria:
- `/runs/new` shows 3-step wizard by default for first-time users
- Quick Start produces a valid architecture request
- Toggle between Quick Start and Full Wizard works
- Vitest tests pass
- Existing 7-step wizard is unchanged

Do not change: Existing wizard steps, API contracts, nav configuration, authority/packaging seams
```

---

## Improvement 4: Add End-to-End Real Azure OpenAI Integration Test Suite

**Impact:** Directly improves Correctness (+4–6 pts), AI/Agent Readiness (+6–8 pts), Trustworthiness (+3–5 pts). Weighted readiness impact: +0.4–0.6%.

```text
In `ArchLucid.AgentRuntime.Tests`, create an integration test class that validates the full agent pipeline with a real Azure OpenAI backend.

What to build:
1. Create `RealAzureOpenAIEndToEndTests.cs` with `[Trait("Suite", "Core")]`, `[Trait("Category", "Integration")]`, `[Trait("Category", "Slow")]` — these tests are expensive and should only run when `ARCHLUCID_REAL_AOAI_TEST_ENDPOINT` and `ARCHLUCID_REAL_AOAI_TEST_KEY` environment variables are set.
2. Add tests that: (a) Submit a simple architecture brief ("Design a 3-tier web application on Azure with SQL backend, Redis cache, and App Service frontend"), (b) Execute the topology, cost, and compliance agents against real Azure OpenAI, (c) Validate that the returned `AgentResult` objects have structurally valid JSON (non-null, parseable, matching expected schemas), (d) Validate that the manifest merge produces a valid `GoldenManifest` with at least one decision, one finding, and non-empty topology, (e) Validate that the explainability trace has at least one citation that references a real artifact.
3. The tests should NOT assert on specific content (LLM outputs are non-deterministic) but SHOULD assert on structure, schema compliance, and non-emptiness.
4. Add a skip condition: `[SkippableFact]` or equivalent that skips when the environment variables are not set.
5. Add a timeout of 120 seconds per test (real LLM calls are slow).

Constraints:
- Do NOT commit API keys or endpoints in code — use environment variables only
- Do NOT modify existing simulator tests
- Do NOT assert on specific LLM content — only structure and schema
- Follow existing test patterns in `ArchLucid.AgentRuntime.Tests`
- Each test class in its own file

Acceptance criteria:
- Tests skip cleanly when environment variables are not set
- Tests pass when pointed at a real Azure OpenAI deployment
- Structural validation catches obviously broken LLM outputs (empty, null, malformed JSON)
- No secrets committed to source

Do not change: Existing test files, agent runtime implementation, simulator behavior
```

---

## Improvement 5: Automate Product Screenshot Capture for Marketing

**Impact:** Directly improves Marketability (+3–5 pts), Executive Value Visibility (+2–4 pts). Weighted readiness impact: +0.3–0.5%.

```text
Create a Playwright script that captures product screenshots from the running demo stack for use on the marketing site.

What to build:
1. In `archlucid-ui/e2e/`, create `capture-marketing-screenshots.spec.ts` — a Playwright test that navigates through key product surfaces and captures full-page screenshots
2. Screenshots to capture (save to `archlucid-ui/public/marketing/screenshots/`): (a) Home/dashboard with seeded runs visible, (b) New run wizard step 1 (system identity), (c) Run detail page showing pipeline timeline in progress, (d) Run detail showing committed manifest with findings, (e) Compare view showing two-run deltas, (f) Graph view showing provenance, (g) Audit log view, (h) Governance approval workflow
3. Use the demo seed data (Contoso Retail) — the test should run against the demo Docker stack or a running API with demo data seeded
4. Set viewport to 1440x900 for consistent output
5. Add a script entry in `archlucid-ui/package.json`: `"screenshots": "playwright test --config playwright.mock.config.ts capture-marketing-screenshots.spec.ts"`

Constraints:
- Use the mock config (not live API) so screenshots can be captured without SQL
- Do NOT modify existing Playwright tests or configs
- Screenshots should be high-quality (no compression artifacts)
- Use deterministic mock data so screenshots are reproducible

Acceptance criteria:
- Running `npm run screenshots` produces 8+ PNG files in the screenshots directory
- Screenshots show realistic product content (not empty states)
- Screenshots are reproducible (same output on repeated runs)

Do not change: Existing Playwright tests, mock configurations, UI components
```

---

## Improvement 6: Add In-Product Documentation Search

**Impact:** Directly improves Cognitive Load (+5–7 pts), Adoption Friction (+3–5 pts), Customer Self-Sufficiency (+5–7 pts). Weighted readiness impact: +0.3–0.4%.

```text
In the `archlucid-ui` operator UI, add a documentation search panel accessible from the sidebar.

What to build:
1. Create a new page at `archlucid-ui/src/app/(operator)/help/page.tsx` that renders a searchable index of key documentation
2. Create a static JSON index file `archlucid-ui/public/doc-index.json` containing: title, summary (first 2 sentences), category (Getting Started / Architecture / Operations / Security / API / Go-to-Market), and relative URL for the top 40–50 most important docs (curated from `NAVIGATOR.md`, `ARCHITECTURE_INDEX.md`, and the spine documents)
3. The help page should: load the JSON index, provide a text search input that filters by title and summary, group results by category, and link to the GitHub raw file or a rendered view
4. Add a "Help" link in the sidebar nav config (`nav-config.ts`) at the bottom of the sidebar, visible to all tiers and authorities
5. Add Vitest tests: index loads, search filters correctly, categories render, empty state shows "No results"

Constraints:
- Do NOT build a full-text search engine — client-side filtering of a curated index is sufficient for V1
- Do NOT modify existing nav seam tests unless adding the Help link requires it (if so, update `authority-seam-regression.test.ts` to include the new link)
- Keep the JSON index manually curated for now (40–50 entries)
- Follow existing page patterns

Acceptance criteria:
- `/help` renders a searchable doc index
- Search filters by title and summary text
- Results are grouped by category
- Sidebar shows "Help" link for all users
- Vitest tests pass

Do not change: Existing nav links, existing pages, authority seam logic (unless adding the link requires updating seam tests)
```

---

## Improvement 7: Complete and Test ITSM Webhook Bridge Recipes

**Impact:** Directly improves Workflow Embeddedness (+4–6 pts), Interoperability (+3–5 pts). Weighted readiness impact: +0.2–0.3%.

```text
Validate and complete the ITSM webhook bridge recipes under `templates/integrations/`.

What to build:
1. Read `templates/integrations/jira/jira-webhook-bridge-recipe.md` and `templates/integrations/servicenow/servicenow-incident-recipe.md`
2. For each recipe, create a companion test script (`validate-jira-bridge.ps1` and `validate-servicenow-bridge.ps1`) under `templates/integrations/` that: (a) Constructs a sample CloudEvents payload matching `com.archlucid.authority.run.completed` from `schemas/integration-events/catalog.json`, (b) Validates HMAC signature generation matches the recipe's documented algorithm, (c) Validates the Jira/ServiceNow REST API request body construction produces valid JSON matching the documented schema, (d) Does NOT call external APIs — validates payload construction only
3. Review each recipe for completeness: ensure all required fields are documented, error handling is described, and the Logic App / Azure Function outline includes all necessary configuration
4. Add a `templates/integrations/README.md` that indexes both recipes and links to the integration events catalog

Constraints:
- Do NOT build actual Azure Functions or Logic Apps — keep as documentation + validation scripts
- Do NOT call external Jira/ServiceNow APIs in the validation scripts
- Follow the existing event schema from `schemas/integration-events/`
- Keep the scripts self-contained (no external dependencies beyond PowerShell)

Acceptance criteria:
- Both validation scripts pass when run from repo root
- Recipes include complete field mappings, error handling, and configuration
- README indexes both recipes
- HMAC validation matches the documented algorithm

Do not change: Integration event schemas, existing webhook/Service Bus infrastructure, existing template content beyond completing gaps
```

---

## Improvement 8: Create Production Deployment Validation Script

**Impact:** Directly improves Azure Compatibility (+3–5 pts), Deployability (+4–6 pts), Reliability (+2–4 pts). Weighted readiness impact: +0.2–0.3%.

```text
Create a production deployment validation script that verifies a deployed ArchLucid environment is healthy and functional.

What to build:
1. Create `scripts/validate-deployment.ps1` that accepts parameters: `-BaseUrl` (required), `-ApiKey` (optional), `-Verbose` (switch)
2. The script should perform these checks in order: (a) `GET /health/live` returns 200, (b) `GET /health/ready` returns 200, (c) `GET /health` returns 200 with all checks healthy, (d) `GET /version` returns a valid version object, (e) `GET /openapi/v1.json` returns valid JSON with paths, (f) `GET /v1/architecture/runs` returns 200 (may be empty list), (g) Response headers include `X-Correlation-ID`, (h) CORS headers are present when `Origin` header is sent, (i) Rate limiting headers are present (`X-RateLimit-*`), (j) HTTPS redirect works if base URL is HTTP
3. Each check should output: check name, status (PASS/FAIL/SKIP), response time in ms, and any error details
4. Exit with code 0 if all required checks pass, 1 if any fail
5. Add a `--json` flag that outputs results as JSON for CI consumption
6. Add companion script `scripts/validate-deployment.sh` for Linux/macOS with equivalent functionality using `curl`

Constraints:
- Do NOT perform any mutations (no POST/PUT/DELETE)
- Do NOT require SQL access — validate through HTTP only
- Do NOT hardcode any URLs or keys
- Keep the script self-contained (PowerShell 7+ / bash + curl)
- Follow the existing script patterns in `scripts/`

Acceptance criteria:
- Script passes against a locally running API (`http://localhost:5128`)
- Script correctly reports failures when checks fail
- `--json` output is valid JSON
- Exit codes are correct (0 = all pass, 1 = any fail)
- Works on Windows (PowerShell) and Linux (bash)

Do not change: Existing health check implementations, API routes, existing scripts
```
