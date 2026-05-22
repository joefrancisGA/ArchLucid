> **Scope:** One sentence: audience, intent, and what this doc is not.

# ArchLucid Assessment – (A) Headline Readiness: 80.47%
This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, scoring **in-contract V1 GA only**. Out-of-scope commitments in [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) are **excluded** and **must not** reduce this headline.

## Executive Summary
**`(A)` Overall Headline Readiness:** ArchLucid V1 is a technically robust, highly capable architecture review engine. It scores well on AI/Agent Readiness, Proof-of-ROI, and Supportability. However, its operator-heavy UX and manual data ingestion (PowerShell script to ZIP) drag down its Time-to-Value and Adoption Friction scores. It is functionally complete for its V1 scope but requires a highly technical user to extract that value.

**`(B)` Procurement/Market-Motion Realism:** The lack of a SOC 2 CPA attestation (currently relying on a self-assessment) will introduce significant friction in enterprise procurement. While the Trust Center is transparent, large enterprises often treat a formal SOC 2 Type II report as a hard gate. The manual Azure extraction script, while avoiding credential sharing, may face pushback from enterprise IT teams who prefer automated, role-based, continuous ingestion.

**Commercial Picture:** The pricing model (platform fee + seats + review overage) is well-aligned with the value delivered. **Cross-run executive ROI** (`GET /v1/roi/executive-summary` + Home dashboard panel) is **in V1 contract** ([V1_SCOPE.md](../library/V1_SCOPE.md) §2.8). Remaining CFO narrative gaps are export discoverability and optional **`FindingId`** dedup hardening—not a missing portfolio rollup API. The hard stops on LLM costs ($75/month) during trials could inadvertently cut off users before they experience the "aha" moment.

**Enterprise Picture:** The product is built for the Enterprise Architect (Persona 1) and Platform Engineering Lead (Persona 2). The deep integration with Azure, Entra ID, and explicit tenant isolation (database-per-tenant) are strong enterprise selling points. The buyer-default operator shell (`NEXT_PUBLIC_OPERATOR_EXPERIENCE` unset), progressive sidebar disclosure, and existing `OptInTour` / `GlossaryTooltip` infrastructure reduce—but do not eliminate—first-run friction; a focused V1 mitigation program (live sample seed + tour copy + empty-state polish) is the highest-leverage fix before broader UX investment.

**Engineering Picture:** The architecture is clean, utilizing CQRS-like patterns and explicit persistence abstractions. The custom orchestration for long-running tasks is a slight risk compared to using a proven framework like Durable Task Framework (deferred to V2). Supportability is a strong point, with excellent diagnostics and audit logging.

## Weighted Quality Assessment
*Ordered from most urgent to least urgent based on weighted deficiency.*

1. **AI/Agent Readiness**
   - Score: 80 | Weight: 8 | Weighted Deficiency: 160
   - Justification: Strong foundation with `ArchLucid.Worker` and `AuthorityRunOrchestrator`. However, it relies on custom orchestration instead of the Durable Task Framework (deferred to V2), and LLM cost management relies on hard stops ($75/month) which could abruptly halt critical pilot runs.
   - Tradeoffs: Custom orchestration avoids DTF dependency but risks state machine fragility during complex, long-running agent tasks.
   - Improvement recommendations: Implement robust retry/resume mechanics for the custom orchestrator. Improve LLM cost estimation accuracy and add soft-warning notifications before hard stops.
   - Status: Fixable in V1.

2. **Adoption Friction**
   - Score: 75 | Weight: 6 | Weighted Deficiency: 150
   - Justification: The Tier 1 Azure Extractor requires running a local PowerShell script and uploading a ZIP. While this avoids credential sharing, it introduces significant workflow friction. The UI is an "operator shell", requiring technical proficiency.
   - Tradeoffs: Zero-credential ingestion (high trust) vs. automated continuous ingestion (low friction).
   - Improvement recommendations: Execute **V1 Operator Shell Mitigation Program** (#1–#4): live sample seed, hosted-SaaS tour copy, prominent tour launcher, buyer empty states + glossary. Do not add a new tour library—extend `OptInTour` and `GlossaryTooltip`.
   - Status: Fixable in V1.

3. **Time-to-Value**
   - Score: 82 | Weight: 7 | Weighted Deficiency: 126
   - Justification: Once the ZIP is uploaded, value generation is fast. However, the initial setup and the manual extraction step delay the initial "aha" moment for new pilots.
   - Tradeoffs: Security/Trust vs. Speed of onboarding.
   - Improvement recommendations: **OS-1** live sample seed (#1) removes the empty-state cliff; extractor ZIP upload polish remains a separate follow-on.
   - Status: Fixable in V1 (OS program); automated continuous ingestion is outside `(A)` V1 scope.

4. **Executive Value Visibility**
   - Score: 82 | Weight: 4 | Weighted Deficiency: 72
   - Justification: **V1 ships** tenant-scoped cross-run executive ROI via **`GET /v1/roi/executive-summary`** and the Home **`ExecutiveRoiSummarySection`** panel, plus per-run ROI, pilot scorecard, value report, and DOCX/PDF exports. Portfolio rollups use latest committed run per system with pinned **`FindingId`** dedup semantics ([V1_SCOPE.md](../library/V1_SCOPE.md) §2.8).
   - Tradeoffs: Interactive drill-down dashboards are lighter than static board-pack exports; dedup logic should stay aligned with scorecard math.
   - Improvement recommendations: Harden **`FindingId`** deduplication in **`ExecutiveRoiSummaryService`** (#5, batch **ROI-1**); improve sponsor export discoverability from the dashboard panel.
   - Status: Fixable in V1.

5. **Usability**
   - Score: 65 | Weight: 3 | Weighted Deficiency: 105
   - Justification: The UI is explicitly described as an "operator shell". It is built for technical users and lacks the polish expected of modern SaaS applications.
   - Tradeoffs: Functionality and technical depth over UX polish for V1.
   - Improvement recommendations: **OS-2** and **OS-3** (#2–#4). Improve ZIP upload error messaging separately.
   - Status: Fixable in V1.

6. **Proof-of-ROI Readiness**
   - Score: 88 | Weight: 5 | Weighted Deficiency: 60
   - Justification: Very strong artifacts, including DOCX/PDF exports, pilot scorecards, and value reports.
   - Tradeoffs: Heavy reliance on static document exports rather than interactive, drill-down dashboards in the UI.
   - Improvement recommendations: Ensure the exported documents have a highly polished, executive-ready cover page and summary section.
   - Status: Fixable in V1.

7. **Reliability**
   - Score: 90 | Weight: 2 | Weighted Deficiency: 20
   - Justification: Solid V1 baseline: SQL Server persistence, health/live/ready probes, resilient SQL connection factory, and append-only audit. Custom orchestration for long-running tasks is the main in-scope reliability concern (stall risk on transient failures).
   - Tradeoffs: Custom orchestration vs. Durable Task Framework (out of `(A)` V1 scope).
   - Improvement recommendations: Ensure the custom orchestrator handles transient database failures gracefully with exponential backoff.
   - Status: Fixable in V1.

8. **Maintainability**
   - Score: 82 | Weight: 2 | Weighted Deficiency: 36
   - Justification: Modular assembly layout, contract tests on persistence ports, and CI guardrails on API contracts. The main ongoing cost is keeping operator-facing copy and architecture docs aligned as the UI evolves.
   - Tradeoffs: Depth of surface area vs. documentation freshness.
   - Improvement recommendations: When touching persistence or commit paths, update `ARCHITECTURE_COMPONENTS.md` and related flow docs in the same PR.
   - Status: Fixable in V1.

9. **Supportability**
   - Score: 85 | Weight: 1 | Weighted Deficiency: 15
   - Justification: Excellent diagnostics, correlation IDs, health checks, and append-only audit logs.
   - Tradeoffs: None significant.
   - Improvement recommendations: Ensure correlation IDs are prominently surfaced in the UI for easy copy-pasting by users when reporting issues.
   - Status: Fixable in V1.

## Top 12 Most Important Weaknesses
1. Manual PowerShell script execution for Azure extraction introduces a high-friction first step.
2. Custom orchestration for long-running agent tasks risks state machine fragility compared to standard frameworks.
3. First-run empty-state cliff: static showcase reviews are read-only; live tenants with zero reviews cannot seed interactive sample data without Development-only `DemoController`.
4. Opt-in tour Step 2 still references API-key / Azure OpenAI setup—misleading on hosted SaaS where LLM is platform-provisioned.
5. Hard stops on LLM costs ($75/month) could abruptly halt pilot runs, causing frustration and lost momentum.
6. Heavy reliance on static document exports (DOCX/PDF) rather than interactive, drill-down dashboards.
7. No built-in cross-tenant analytics limits ArchLucid's own ability to understand usage patterns.
8. Lack of a public extension SDK prevents community-driven integrations and ecosystem growth.
9. Cross-run ROI **`FindingId`** dedup may need hardening/tests beyond latest-run-per-system savings rollup.
10. Server-side idempotency for run creation remains advisory rather than strictly enforced under retry storms.
11. Sample-data **`IsSample`** marking and auto-purge hook not yet implemented (designed in OS-1b).
12. Orchestrator stall detection is not yet exposed via a dedicated `/health` check (improvement #18).

## Top 6 Monetization Blockers
1. Manual Azure extraction script creates a hurdle for quick, self-serve Team-tier trials.
2. Hard stops on LLM costs during trials could prevent users from seeing the full value before they are asked to pay.
3. First-run activation gap (empty tenant + misleading tour copy)—addressed by V1 Operator Shell program #1–#4, not generic “training.”
4. Absence of a SOC 2 CPA attestation (currently self-assessment) will block procurement at large enterprises.
5. Uneven discoverability of sponsor exports (scorecard, value report, executive ROI panel) from operator surfaces.
6. Team-tier self-serve trials depend on technical comfort with PowerShell + ZIP upload before value proof.

## Top 6 Enterprise Adoption Blockers
1. Absence of SOC 2 CPA attestation (Type I/II).
2. Manual Azure extraction script (enterprises prefer automated, continuous, role-based ingestion).
3. Mid-depth operator pages still surface internal terms (`runId`, `manifest`) without inline glossary on every surface—buyer-default mode helps at the shell level but not uniformly.
4. Hard LLM budget caps during pilots can stall reviews before sponsors see committed manifests.
5. Uneven paths from operator UI to sponsor-ready exports (scorecard, value report, executive ROI panel).
6. Operate-mode IAM and governance enablement still require deliberate tenant configuration beyond the Pilot wedge.

## Top 5 Engineering Risks
1. Custom orchestration for long-running tasks (fragile state transitions, lack of built-in replayability).
2. LLM cost estimation inaccuracies leading to unexpected hard stops or budget overruns.
3. Sample-data purge and `IsSample` marking not yet implemented (designed in OS-1b, pending execution).
4. Idempotency relies on retry-safe client behavior rather than a strict server-side store, risking duplicate runs under heavy load.
5. High memory usage during large ZIP extraction and parsing (max 52 MiB zipped payload).

## Most Important Truth
ArchLucid V1 is a highly capable, technically sound product with strong Pilot-layer infrastructure already in the repo (`OptInTour`, `GlossaryTooltip`, buyer-default shell, progressive nav). The remaining adoption gap is not “missing UX entirely”—it is **first-run activation**: zero-review tenants cannot seed live sample data in production, and a few tour/empty-state surfaces still assume self-hosted API-key setup.

## V1 Operator Shell Mitigation Program

**Owner decisions (2026-05-22):** Sample seed available to **all** tenants when review count = 0 (not trial-only). Sample data auto-purges on **first real review commit** or **7 days**, whichever is sooner. Glossary uses existing **`GlossaryTooltip`** (hover desktop / tap mobile on first occurrence per page)—no new library.

**Owner decision — tenant hard purge (2026-05-22):** On erasure/offboarding, **hard-purge all tenant-identifiable data** (per-tenant SQL catalog, tenant-scoped blobs, control-plane bindings, subject-linked audit). **Retain anonymized aggregates only** — irreversible anonymization, no tenant id or re-link keys, **`k ≥ 5`** for any published cross-tenant statistical surfaces — consistent with GDPR erasure obligations when data are truly anonymous (Art. 4(1) / Recital 26). Default **30-day quarantine** before purge unless legal hold. V1 ships operator-led purge via **`TenantDeletionService`**; fully automated quarantine pipeline is **V2** ([`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6m) — **not** an `(A)` V1 deduction.

**Existing assets this program extends (do not rebuild):** `DemoSeedService`, `OptInTour` / `OptInTourLauncher`, `SampleFirstReviewPackageCard` (static showcase), `GlossaryTooltip` + `glossary-terms.ts`, `EmptyState` + `empty-state-presets.ts`, `WelcomeBanner`, `COMPARE_WAITING_BUYER`.

**Execution order:** Batch **OS-1** → **OS-2** → **OS-3**, then **ROI-1** (#5). See Prompt Batching Guidance.

## Top Improvement Opportunities

1. **Live sample review seed in production SaaS (V1 Operator Shell — OS-1)**
   - Why it matters: `DemoController` returns 404 outside Development; static showcase is read-only. Zero-review tenants hit an empty-state cliff before any “aha” moment.
   - Expected impact: Time-to-Value (+6-10 pts), Adoption Friction (+5-8 pts), Usability (+3-5 pts). Weighted readiness impact: +0.7-1.2%.
   - Affected qualities: Time-to-Value, Adoption Friction, Usability
   - Actionable: Yes — Batch **OS-1**
   - Prompt:
     ```text
     You are working in the ArchLucid monorepo. Enable production-hosted SaaS tenants with zero real reviews to seed interactive sample data via the existing DemoSeedService.

     BACKEND
     1. In DemoOptions (ArchLucid.Core/Configuration), add: public bool SaaSGuestSeedEnabled { get; init; } = false;
     2. In ArchLucid.Api/Controllers/Admin/DemoController.cs, replace the IsDevelopment()-only guard with:
        isDevOrSaaSEnabled = environment.IsDevelopment() || demoOptions.Value.SaaSGuestSeedEnabled;
        Keep Demo:Enabled check unchanged. Do not change DemoSeedService or seed SQL.
     3. In appsettings.SaaS.json set Demo:Enabled=true and Demo:SaaSGuestSeedEnabled=true.
        In appsettings.json keep both false as safe defaults.

     FRONTEND
     4. Create archlucid-ui/src/app/api/seed-sample/route.ts — POST to /api/proxy/v1/demo/seed; on 204 return { redirectTo: "/reviews" }.
     5. Create archlucid-ui/src/components/SeedSampleReviewButton.tsx ("use client"): loading state, fetch POST /api/seed-sample, router.push on success, toast on error.
     6. Wire into Reviews empty state (RunsPageView.tsx): when buyer-polished and zero reviews, render SeedSampleReviewButton alongside existing EmptyState actions. Update RUNS_EMPTY title to "No reviews yet" if not already.

     ACCEPTANCE
     - Dev: POST /v1/demo/seed unchanged.
     - Prod with SaaSGuestSeedEnabled=true: returns 204.
     - Prod default: returns 404.
     - Do not change SampleFirstReviewPackageCard or static showcase flows.
     ```

2. **Update opt-in tour copy for hosted SaaS (V1 Operator Shell — OS-2a)**
   - Why it matters: Step 2 tells users to configure Azure OpenAI API keys—wrong on hosted SaaS (V1_SCOPE §2.4).
   - Expected impact: Adoption Friction (+2-4 pts), Usability (+2-3 pts). Weighted readiness impact: +0.2-0.4%.
   - Affected qualities: Adoption Friction, Usability
   - Actionable: Yes — Batch **OS-2**
   - Prompt:
     ```text
     In archlucid-ui/src/components/tour/OptInTour.tsx, update DRAFT_TOUR_STEPS (keep exactly 6 steps):

     STEP 2 — replace entirely:
       title: "2. Upload your architecture context"
       body: "ArchLucid needs to know about your Azure environment. Run Get-ArchLucidAzurePackage.ps1 from Settings → Extract & Upload, then upload the ZIP — or seed a sample review from the Reviews page to explore without setup."

     STEP 4 — body only: replace "Finalize manifest to produce the versioned manifest" with "Finalize to produce your architecture snapshot — the reviewed package".

     STEP 6 — append: " The How it works button on Home re-opens this tour anytime."

     Update OptInTour.test.tsx assertions to match. Do not change OptInTourLauncher or auto-launch behavior (owner Q9: never auto-launch).
     ```

3. **Prominent tour launcher for zero-review tenants (V1 Operator Shell — OS-2b)**
   - Why it matters: OptInTourLauncher exists but is easy to miss; owner banned auto-launch so visibility is the mitigation.
   - Expected impact: Usability (+3-5 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.2-0.4%.
   - Affected qualities: Usability, Time-to-Value
   - Actionable: Yes — Batch **OS-2**
   - Prompt:
     ```text
     In archlucid-ui/src/components/WelcomeBanner.tsx, when buyerPolishedShell && runsPresenceResolved && !hasExistingRuns, render a "New here?" callout:

     - Heading: "New here?"
     - Sentence: "Take a quick 6-step tour to see how a review goes from upload to architecture snapshot."
     - <OptInTourLauncher buttonVariant="outline" /> (already imported — move here if duplicated elsewhere in the same branch)

     Style: rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/30

     Do NOT auto-launch the tour. Do NOT change behavior when hasExistingRuns === true or in operator shell mode.
     Add WelcomeBanner.test.tsx coverage for the callout when buyer-polished and zero reviews.
     ```

4. **Buyer-default empty states and glossary on mid-depth pages (V1 Operator Shell — OS-3)**
   - Why it matters: `GRAPH_IDLE` and some Compare/Runs copy still use internal terms; `GlossaryTooltip` exists but is not applied uniformly.
   - Expected impact: Usability (+4-6 pts), Adoption Friction (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
   - Affected qualities: Usability, Adoption Friction
   - Actionable: Yes — Batch **OS-3**
   - Prompt:
     ```text
     PART A — archlucid-ui/src/lib/empty-state-presets.ts
     Add GRAPH_IDLE_BUYER (title: "No evidence graph loaded"; buyer-friendly description; actions: View reviews only).
     In the graph page view, use isBuyerPolishedOperatorShellEnv() ? GRAPH_IDLE_BUYER : GRAPH_IDLE.

     PART B — RunsPageView.tsx (operator mode branch only)
     Wrap first "Review ID" with <GlossaryTooltip termKey="run">Review ID</GlossaryTooltip>.

     PART C — ComparePageIntro.tsx (or compare intro copy)
     Wrap first occurrence of "architecture snapshot" with termKey="architecture_manifest" and "manifest diff" with termKey="manifest_diff" if present and not already wrapped.

     CONSTRAINTS: Do not change GRAPH_IDLE operator preset. Add Vitest: graph page shows buyer title in buyer-polished mode.
     ```

5. **Cross-run ROI: unique-finding identity dedup (V1 — ROI-1)**
   - Why it matters: Cross-run executive ROI is **in V1 contract** ([V1_SCOPE.md](../library/V1_SCOPE.md) §2.8). **`GET /v1/roi/executive-summary`** and the Home dashboard panel ship today; **`FindingId`** dedup before portfolio counts must match the pinned owner rule (not raw sum across CI reruns).
   - Expected impact: Executive Value Visibility (+3-5 pts), Proof-of-ROI Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.4%.
   - Affected qualities: Executive Value Visibility, Proof-of-ROI Readiness
   - Actionable: Yes — Batch **ROI-1** (after **OS-3** — no file overlap with operator-shell batches)
   - Prompt:
     ```text
     In ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs, harden AggregateTopSystemicIssues (and any savings attribution helpers) for V1 §2.8 semantics:

     1. When flattening findings from latest committed runs, deduplicate by stable FindingId (case-insensitive) before grouping by (Category, Severity).
     2. Keep latest-run-per-system selection unchanged for savings sums.
     3. Add ExecutiveRoiSummaryServiceTests: two runs with the same FindingId must contribute count 1 to TopSystemicIssues, not 2.
     4. Document aggregation rules in docs/library/PILOT_SCORECARD_API.md (executive-summary row).

     Do not add new routes — extend the existing GET /v1/roi/executive-summary contract only if response fields are required for deduped counts.
     ```

6. **Improve custom orchestrator retry logic for transient DB errors**
   - Why it matters: Prevents long-running agent tasks from failing due to brief database blips.
   - Expected impact: Directly improves Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.3%.
   - Prompt:
     ```text
     In `ArchLucid.Persistence/AuthorityRunOrchestrator.cs` (or the relevant orchestrator file), wrap the state transition and database commit calls in a Polly `AsyncRetryPolicy`. The policy should handle `SqlException` (specifically transient error numbers like 1205, 4060) and `TimeoutException`. Use exponential backoff (e.g., 3 retries: 2s, 4s, 8s). Do not change the overall state machine logic. Acceptance criteria: Transient DB errors during orchestration are retried automatically.
     ```

7. **Surface correlation IDs clearly in the UI**
   - Why it matters: Drastically improves supportability when users encounter errors.
   - Expected impact: Supportability (+5-10 pts). Weighted readiness impact: +0.1-0.3%.
   - Affected qualities: Supportability
   - Actionable: Yes — Batch **UI-A**
   - Prompt:
     ```text
     In the `archlucid-ui` project, update the global error boundary and API error interceptor. Whenever an API request fails and returns a Problem Details JSON containing a correlation ID (or `X-Correlation-ID` header), display this ID prominently in the error toast/modal with a "Copy to Clipboard" button. Do not change the backend error formatting. Acceptance criteria: Users can easily copy correlation IDs from the UI.
     ```

8. **Add a warning banner in the UI when LLM budget approaches 75%**
   - Why it matters: Prevents pilot runs from abruptly failing due to the $75/month hard stop.
   - Expected impact: AI/Agent Readiness (+3-5 pts), Usability (+2-4 pts). Weighted readiness impact: +0.3-0.5%.
   - Affected qualities: AI/Agent Readiness, Usability
   - Actionable: Yes — Batch **UI-A**
   - Prompt:
     ```text
     In the `archlucid-ui` project, create a global banner component that fetches the tenant's current LLM budget usage (if exposed via an existing endpoint). If the usage exceeds 75% of the limit (e.g., $56.25 of $75), display a warning banner: "Approaching monthly LLM budget limit. Runs may be paused soon." Make it dismissible for the current session. Do not change backend billing logic. Acceptance criteria: Users are warned before hitting the hard stop.
     ```

9. **Implement strict server-side idempotency keys for run creation**
   - Why it matters: Prevents duplicate runs and wasted LLM tokens during network retries.
   - Expected impact: Directly improves Reliability (+4-6 pts), AI/Agent Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.5%.
   - Prompt:
     ```text
     In `ArchLucid.Api.Controllers.Authority.ArchitectureController` (or `RunsController`), enhance the `POST /v1/architecture/request` endpoint. Use `IMemoryCache` (or a similar existing caching mechanism) to store the `Idempotency-Key` header value combined with the tenant/workspace ID for 24 hours. If a request arrives with an existing key, compare the SHA-256 hash of the request body. If it matches, return the cached `runId` (200 OK). If it differs, return 409 Conflict. Do not introduce new database tables for this yet. Acceptance criteria: Duplicate requests with the same key are handled safely.
     ```

10. **Optimize ZIP extraction memory usage (streaming)**
    - Why it matters: Prevents OutOfMemory exceptions when processing large (52 MiB) Azure extractor ZIPs.
    - Expected impact: Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.3%.
    - Affected qualities: Reliability
    - Actionable: Yes — Batch **ZIP**
    - Prompt:
      ```text
      In the service handling POST /v1/azure-extractor/upload, ensure ZIP extraction uses ZipArchiveMode.Read and streams entries to the parser without loading full uncompressed contents into memory. Acceptance criteria: Memory usage stays flat during large uploads.
      ```

11. **Enhance DOCX/PDF export cover pages for executive polish**
    - Why it matters: Improves perceived value for executive sponsors.
    - Expected impact: Proof-of-ROI Readiness (+3-5 pts), Executive Value Visibility (+2-4 pts). Weighted readiness impact: +0.2-0.4%.
    - Affected qualities: Proof-of-ROI Readiness, Executive Value Visibility
    - Actionable: Yes — Batch **DOCS-EXPORT**
    - Prompt:
      ```text
      In ArchLucid.Application/ArchitectureReviewDocxBuilder.cs (and PDF equivalent), enhance cover page: bold centered title, Generated on [Date], Prepared for [Tenant Name], scaled logo. Do not change section bodies.
      ```

12. **Implement a "dry run" mode for the Azure extractor script**
    - Why it matters: Builds trust with enterprise security teams before they run the actual extraction.
    - Expected impact: Directly improves Adoption Friction (+4-6 pts). Weighted readiness impact: +0.2-0.4%.
    - Prompt:
      ```text
      In `scripts/azure/Get-ArchLucidAzurePackage.ps1`, add a `-DryRun` switch. When specified, the script should only list the Azure resources and API calls it *would* make, outputting them to the console, without actually fetching the deep configuration data or creating a ZIP file. Do not change the default execution behavior. Acceptance criteria: Security teams can audit the script's intended actions easily.
      ```

13. **Add explicit logging for LLM cost estimation discrepancies**
    - Why it matters: Helps engineering tune the cost estimation models to prevent budget overruns.
    - Expected impact: Directly improves AI/Agent Readiness (+2-4 pts), Maintainability (+2-3 pts). Weighted readiness impact: +0.2-0.4%.
    - Prompt:
      ```text
      In the component that handles LLM completions (e.g., `LlmCostEstimator` or the OpenAI client wrapper), add a structured log event (`LogInformation` or `LogWarning`) that compares the *estimated* token count/cost before the call with the *actual* token count returned by the Azure OpenAI API. Include the `runId` and `agentType`. Do not change the billing logic. Acceptance criteria: Discrepancies between estimated and actual LLM costs are easily queryable in the logs.
      ```

14. **Create a dedicated "Pilot Status" dashboard in the UI**
    - Why it matters: Gives operators a clear view of their progress through the 6-week pilot.
    - Expected impact: Directly improves Time-to-Value (+3-5 pts), Usability (+3-4 pts). Weighted readiness impact: +0.3-0.5%.
    - Prompt:
      ```text
      In the `archlucid-ui` project, create a new "Pilot Status" component on the Home page. It should display a simple checklist based on the `CORE_PILOT.md` steps: 1. Configure Storage, 2. Create Review, 3. Execute Review, 4. Commit Manifest. Check off items based on the existence of runs/manifests in the API responses. Do not create new backend endpoints for this. Acceptance criteria: Users can see their pilot progress at a glance.
      ```

15. **Enforce strict validation on uploaded ZIP manifest schemas**
    - Why it matters: Prevents downstream pipeline failures caused by malformed extractor data.
    - Expected impact: Directly improves Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.3%.
    - Prompt:
      ```text
      In `AzureExtractorUploadController.cs` (or the parsing service), add strict JSON schema validation for the `manifest.json` inside the uploaded ZIP. If the `schemaVersion` is missing or not exactly `1`, immediately return a 422 Unprocessable Entity with a Problem Details response explaining the required schema version. Do not process the rest of the ZIP if the manifest is invalid. Acceptance criteria: Malformed ZIPs are rejected fast and loud.
      ```

16. **Automated tenant erasure pipeline with anonymized retention (V2 — PRIV-1)**
    - Why it matters: Owner policy (2026-05-22): hard purge identifiable tenant data; retain only irreversibly anonymized aggregates. V1 has **`TenantDeletionService`** for operator-led purge — automation is V2, not an `(A)` V1 gap.
    - Expected impact: Supports procurement `(B)` privacy narrative; zero `(A)` V1 impact when documented.
    - Actionable: Yes — **V2** (out of `(A)` batching)
    - Prompt:
      ```text
      Design and implement the V2 automated tenant erasure pipeline per V1_DEFERRED.md §6m and owner decision 2026-05-22:

      1. verified erasure request → quarantine flag → default 30-day delay (legal hold gate)
      2. hard purge: drop per-tenant SQL catalog, tenant blobs, control-plane bindings, subject-identifiable audit rows
      3. retain ONLY anonymized aggregate rows with no tenant id, no re-link keys, k≥5 for any cross-tenant stats
      4. durable PlatformAuditEvents for purge completion; document in trust center / DPA template

      Do not block V1 GA on this — extend TenantDeletionService patterns.
      ```

17. **Add a "copy to clipboard" button for all error correlation IDs**
    - Why it matters: Reduces friction when users need to contact support.
    - Expected impact: Directly improves Supportability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - Prompt:
      ```text
      In the `archlucid-ui` project, locate the shared Error/Problem Details display component. Add a small clipboard icon button next to the `traceId` or `correlationId`. Use the standard browser clipboard API to copy the ID when clicked, and show a brief "Copied!" tooltip. Do not change the error layout significantly. Acceptance criteria: Users can copy correlation IDs with one click.
      ```

18. **Implement a health check specifically for the custom orchestrator state**
    - Why it matters: Allows operators to detect if the background orchestrator has stalled.
    - Expected impact: Directly improves Supportability (+4-6 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.1-0.3%.
    - Prompt:
      ```text
      In `ArchLucid.Api` or `ArchLucid.Worker`, add a new `IHealthCheck` implementation named `OrchestratorHealthCheck`. It should query the database (or a singleton state tracker) to check if there are any runs in the `Executing` state that haven't been updated in over 2 hours. If so, return `HealthCheckResult.Degraded`. Register this check in `Program.cs`. Do not change the orchestrator logic. Acceptance criteria: Stalled orchestrations are visible in the `/health` endpoint.
      ```

19. **Add a telemetry event for manual ZIP upload duration/size**
    - Why it matters: Provides data to prioritize future automated ingestion investments.
    - Expected impact: Directly improves Maintainability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.
    - Prompt:
      ```text
      In `AzureExtractorUploadController.cs`, wrap the ZIP extraction and storage process in a standard `System.Diagnostics.Activity`. Add tags for the `FileSizeInBytes` and `NumberOfFilesExtracted`. Do not log any sensitive file names or contents. Acceptance criteria: Upload performance and size metrics are available in OpenTelemetry traces.
      ```

20. **Create a CLI command to validate the extractor ZIP locally before upload**
    - Why it matters: Saves time and bandwidth by catching errors before uploading a 50MB file.
    - Expected impact: Directly improves Adoption Friction (+3-5 pts), Usability (+2-4 pts). Weighted readiness impact: +0.2-0.4%.
    - Prompt:
      ```text
      In the `ArchLucid.Cli` project, add a new command: `archlucid azure validate-zip --path <file>`. This command should open the ZIP locally, verify that `manifest.json` exists, check that `schemaVersion` is 1, and ensure the basic folder structure is correct. It should output a success or error message to the console. Do not upload the file. Acceptance criteria: Operators can validate ZIPs locally.
      ```

21. **Add a visual indicator in the UI for "Idempotency-Replayed" responses**
    - Why it matters: Helps users understand when a request was safely retried vs newly created.
    - Expected impact: Directly improves Usability (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - Prompt:
      ```text
      In the `archlucid-ui` project, when an API response includes the `Idempotency-Replayed: true` header or a similar flag in the JSON, display a small, non-intrusive badge or toast saying "Replayed from previous request". Do not block the user flow. Acceptance criteria: Users are informed when idempotency kicks in.
      ```

22. **Standardize error messages for rate-limiting across all controllers**
    - Why it matters: Provides a consistent experience when users hit API limits.
    - Expected impact: Directly improves Supportability (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - Prompt:
      ```text
      In `ArchLucid.Api/Startup/RateLimitingExtensions.cs` (or where rate limiting is configured), configure the `OnRejected` callback to return a standard RFC 9457 Problem Details JSON response (e.g., `type: "#rate-limit-exceeded"`, status 429). Include the `Retry-After` header value in the JSON body if available. Do not change the actual rate limits. Acceptance criteria: 429 responses use the standard Problem Details format.
      ```

23. **Add a configuration flag to simulate LLM hard stops in staging**
    - Why it matters: Allows developers and QA to test the UI and orchestrator behavior when the budget is exhausted.
    - Expected impact: Directly improves Maintainability (+3-4 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.
    - Prompt:
      ```text
      In the LLM cost estimation/quota service, add a configuration flag `ArchLucid:Testing:SimulateLlmBudgetExhausted`. When set to true, the service should immediately throw the budget exhausted exception or return the quota exceeded result, regardless of actual usage. Ensure this flag is ignored if `IWebHostEnvironment.IsProduction()` is true. Acceptance criteria: QA can easily test budget exhaustion flows.
      ```

24. **Document the exact retry policy for the custom orchestrator**
    - Why it matters: Helps operators and support teams understand how the system recovers from failures.
    - Expected impact: Supportability (+4-6 pts). Weighted readiness impact: +0.1-0.2%.
    - Affected qualities: Supportability
    - Actionable: Yes — Batch **DOCS-EXPORT**
    - Prompt:
      ```text
      In docs/library/ARCHITECTURE_FLOWS.md (or ORCHESTRATOR_RETRIES.md), document AuthorityRunOrchestrator retry behavior: transient DB retries, LLM timeout handling, manual resume of Failed runs. Docs only.
      ```

26. **Document the exact retry policy for the custom orchestrator**
    - Why it matters: Helps operators and support teams understand how the system recovers from failures.
    - Expected impact: Supportability (+4-6 pts). Weighted readiness impact: +0.1-0.2%.
    - Affected qualities: Supportability
    - Actionable: Yes — Batch **DOCS-EXPORT**
    - Prompt:
      ```text
      In docs/library/ARCHITECTURE_FLOWS.md (or ORCHESTRATOR_RETRIES.md), document AuthorityRunOrchestrator retry behavior: transient DB retries, LLM timeout handling, manual resume of Failed runs. Docs only.
      ```

## Prompt Batching Guidance

Run batches in this order. **Operator Shell (OS)** batches are highest leverage for V1 adoption; complete **OS-1** before **OS-2**/**OS-3**, then **ROI-1**.

| Batch | Improvement IDs | Scope | Notes |
|-------|-----------------|-------|-------|
| **OS-1** | #1 | Backend `DemoController` + `DemoOptions` + `appsettings.SaaS.json`; UI `seed-sample` route + `SeedSampleReviewButton` + `RunsPageView` empty state | Run alone first — highest blast radius; verify CI before dependent UI batches |
| **OS-1b** | #25 | `dbo.Runs`, `DemoSeedService`, `SampleRunPurgeService` | Sample data lifecycle; run after OS-1 |
| **OS-1b** | #25 | `dbo.Runs`, `DemoSeedService`, `SampleRunPurgeService` | Sample data lifecycle; run after OS-1 |
| **OS-2** | #2, #3 | `OptInTour.tsx`, `WelcomeBanner.tsx` | Tour copy + launcher visibility; no overlap with OS-1 files except shared test fixtures |
| **OS-3** | #4 | `empty-state-presets.ts`, graph page, `RunsPageView`, `ComparePageIntro` | Buyer-default glossary + empty states; safe after OS-2 |
| **ROI-1** | #5 | `ExecutiveRoiSummaryService` + tests + `PILOT_SCORECARD_API.md` | V1 contract hardening; no overlap with OS batches — run immediately after OS-3 |
| **UI-A** | #7, #8, #17 | Global error boundary, LLM budget banner, correlation copy (merge #7+#17 if same component) | General UI polish unrelated to OS program |
| **API-A** | #6, #9, #18 | Orchestrator retry, idempotency cache, orchestrator health check | `ArchLucid.Api` / `ArchLucid.Persistence` |
| **ZIP** | #10, #12, #15, #19, #20 | Extractor upload, PowerShell dry-run, CLI validate, telemetry | Azure ingest path |
| **DOCS-EXPORT** | #11, #26 | DOCX cover, orchestrator retry docs | Low coupling |

**V2 only (not `(A)`):** #16 PRIV-1 tenant erasure automation. **Superseded:** old generic “guided tour / react-joyride” prompt — replaced by #2–#4 using existing `OptInTour` / `GlossaryTooltip`. **Resolved (2026-05-22):** cross-run ROI aggregation semantics — **unique `FindingId` dedup**; promoted to V1 ([V1_SCOPE.md](../library/V1_SCOPE.md) §2.8), improvement **#5** / batch **ROI-1**. **Resolved (2026-05-22):** tenant hard purge — purge identifiable data; **retain irreversibly anonymized aggregates only**; 30-day quarantine default ([`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6m). **Resolved (2026-05-22):** `IsSample` marker lives on `dbo.Runs`; purge uses dedicated `SampleRunPurgeService` (improvement **#25** / batch **OS-1b**).

## Pending Questions for Later

*(None at this time)*