> **ARCHIVED 2026-04-22 — Superseded by** [`CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`](CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md). Historical prompts preserved for traceability.

> **Scope:** Cursor prompts for the eight largest weighted improvements from [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_67_61.md`](QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_67_61.md). Each prompt is self-contained and assumes the assistant is starting from a clean session with no memory of the assessment.

> **Spine doc:** [Five-document onboarding spine](../../../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Cursor prompts — top-8 improvements after the 67.61% assessment (2026-04-21)

Use one prompt per session. Each one is written to be **executable** by an agent: it points to the files to read, the gates to satisfy, and the exit criteria.

---

## Prompt 1 — Publish the first reference customer (PLG case study)

```
Goal: graduate the "First paying tenant (PLG)" row in
docs/go-to-market/reference-customers/README.md from Placeholder to Published
without producing fake content.

Read first:
- docs/go-to-market/reference-customers/README.md
- docs/go-to-market/reference-customers/TRIAL_FIRST_REFERENCE_CASE_STUDY.md
- docs/go-to-market/reference-customers/REFERENCE_PUBLICATION_RUNBOOK.md
- docs/go-to-market/reference-customers/REFERENCE_EVIDENCE_PACK_TEMPLATE.md
- docs/go-to-market/PRICING_PHILOSOPHY.md (sections 5.1, 5.3, 5.4)
- scripts/ci/check_reference_customer_status.py
- .github/workflows/ci.yml (the auto-flip block for the reference-customer guard)

Do this:
1. Identify every <<...>> placeholder in TRIAL_FIRST_REFERENCE_CASE_STUDY.md
   and list what real values are needed. Do NOT invent any.
2. Build a one-page evidence-pack scaffold using
   REFERENCE_EVIDENCE_PACK_TEMPLATE.md tied to a real pilot-run-deltas.json
   sample committed by an existing pilot tenant (use repo seed data only as
   a placeholder; mark every value with a TODO referencing the customer).
3. Add a CHANGELOG.md entry recording the row state transition Drafting ->
   Customer review (do not jump straight to Published — that is an owner act).
4. Verify scripts/ci/check_reference_customer_status.py still passes locally
   and that the auto-flip block in ci.yml will become merge-blocking on the
   first Published row without further file edits.

Stop and ask the user before:
- Filling any <<CUSTOMER_NAME>> with a real value
- Setting Status: Published

Exit criteria: PR opens with the row in Customer review, the case study
populated where placeholders allow, the evidence-pack scaffold present,
and a CHANGELOG entry with the date. No CI gate breaks.
```

---

## Prompt 2 — Execute and publish the awarded pen test summary + PGP key

```
Goal: turn the awarded Aeronova pen test SoW into a published, redacted
customer-shareable summary, and stand up the security@archlucid.dev PGP key
so the Trust Center scores cleanly.

Read first:
- docs/security/pen-test-summaries/2026-Q2-SOW.md
- docs/security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md
- docs/security/PEN_TEST_REDACTED_SUMMARY_TEMPLATE.md
- docs/go-to-market/TRUST_CENTER.md
- docs/PENDING_QUESTIONS.md (items 2 and 10)
- archlucid-ui/public/.well-known/  (check whether pgp-key.txt already exists)
- ArchLucid.Api/Controllers/  (find the security-trust publications endpoint
  POST /v1/admin/security-trust/publications)

Do this:
1. Build a redacted-summary skeleton inside 2026-Q2-REDACTED-SUMMARY.md that
   matches PEN_TEST_REDACTED_SUMMARY_TEMPLATE.md exactly, with TODO markers
   for the assessor narrative tables. Do not invent findings.
2. Wire the Trust Center page so the SecurityAssessmentPublished badge will
   render automatically once POST /v1/admin/security-trust/publications is
   called with the published date. Add a CLI subcommand
   `archlucid security-trust publish` that calls the endpoint and prints the
   resulting badge URL.
3. Add a CI guard scripts/ci/assert_pgp_key_present.py that fails if
   archlucid-ui/public/.well-known/pgp-key.txt is missing AND the Trust
   Center references PGP. Mark it continue-on-error: true today.
4. Update docs/SECURITY.md to remove the PGP TODO once the file is in place.

Stop and ask the user before:
- Marking the redacted summary as published (requires assessor delivery)
- Generating the PGP key pair (must be done by the security custodian)

Exit criteria: scaffolds in place; CI guard added (advisory); CLI command
implemented and unit-tested; trust-center page reads cleanly even before
publication.
```

---

## Prompt 3 — Ship the Azure Marketplace transactable SaaS offer + Stripe live readiness

```
Goal: get the commercial rails out of "designed" and into "transactable",
without flipping a live key the assistant cannot legally hold.

Read first:
- docs/go-to-market/MARKETPLACE_PUBLICATION.md
- docs/AZURE_MARKETPLACE_SAAS_OFFER.md
- docs/BILLING.md
- docs/go-to-market/STRIPE_CHECKOUT.md
- docs/go-to-market/PRICING_PHILOSOPHY.md
- docs/runbooks/MARKETING_STRIPE_GA.md
- docs/PENDING_QUESTIONS.md (items 8 and 9)
- ArchLucid.Api/  (search for billing/webhooks/marketplace and stripe webhook handlers)
- infra/terraform-edge/  (Front Door routes — confirm the marketplace landing page is reachable)

Do this:
1. Verify alignment between PRICING_PHILOSOPHY tiers (Team / Professional /
   Enterprise) and the Marketplace plan SKUs called out in
   MARKETPLACE_PUBLICATION.md and AZURE_MARKETPLACE_SAAS_OFFER.md. If any
   drift, reconcile in PRICING_PHILOSOPHY.md (single source of truth) and add
   a CI guard scripts/ci/assert_marketplace_pricing_alignment.py.
2. Add a startup-safety check `BillingProductionSafetyRules` that fails
   ASPNETCORE_ENVIRONMENT=Production startup when:
   - Stripe live key prefix `sk_live_` is configured without a Stripe webhook
     secret, OR
   - Marketplace landing page URL is empty / contains a localhost host.
   Pattern: same shape as ArchLucidConfigurationRules.CollectProductionSafetyErrors.
3. Add a Marketplace publication preflight CLI command:
   `archlucid marketplace preflight` that runs the Partner Center checklist
   from MARKETPLACE_PUBLICATION.md and prints PASS/FAIL per item.
4. Document a feature-flag staging path in
   docs/go-to-market/STRIPE_CHECKOUT.md so staging.archlucid.com/signup can
   transact in Stripe TEST mode before live keys arrive.

Stop and ask the user before:
- Setting any live Stripe key, Marketplace publisher ID, or production
  webhook secret
- Pressing "Go live" in Partner Center

Exit criteria: pricing alignment guard in CI; production-safety guard in
startup; preflight CLI implemented + unit-tested; staging Stripe TEST flow
documented end-to-end.
```

---

## Prompt 4 — Build the public `/why-archlucid` differentiation page

```
Goal: surface the unique value (AI orchestration + governance + provenance)
above the fold, anchored on a real cached anonymous-commit demo, so a
prospect can self-disqualify or self-qualify in under 2 minutes.

Read first:
- docs/go-to-market/COMPETITIVE_LANDSCAPE.md
- docs/go-to-market/POSITIONING.md
- docs/EXECUTIVE_SPONSOR_BRIEF.md
- docs/adr/0027-demo-preview-cached-anonymous-commit-page.md
- docs/DEMO_PREVIEW.md
- archlucid-ui/src/app/(operator)/why-archlucid/page.tsx
- archlucid-ui/src/app/(marketing)/  (find the marketing route group)

Do this:
1. Add a NEW marketing route at archlucid-ui/src/app/(marketing)/why/page.tsx
   that uses the existing operator why-archlucid copy as a starting point but
   targets a non-authenticated prospect.
2. Embed an iframe / image strip showing the cached demo committed manifest
   from the ADR-0027 cached anonymous commit page. Link directly to the
   demo URL.
3. Add a side-by-side capability comparison table (ArchLucid vs LeanIX vs
   Ardoq vs MEGA HOPEX) sourced from COMPETITIVE_LANDSCAPE.md. Each row must
   cite the repo file or feature that backs the ArchLucid claim. No
   aspirational claims.
4. Add a Vitest seam test that fails if any row in the comparison table
   loses its citation footnote (so we cannot quietly inflate later).
5. Make the page a target of the existing axe Playwright a11y gate.

Exit criteria: marketing page renders standalone, axe-clean, citation test
green, links to the live demo URL, no auth required.
```

---

## Prompt 5 — Live trial signup funnel end-to-end (Stripe TEST mode)

```
Goal: take docs/go-to-market/TRIAL_AND_SIGNUP.md from design to a working
funnel on staging.archlucid.com, end-to-end, in Stripe TEST mode.

Read first:
- docs/go-to-market/TRIAL_AND_SIGNUP.md
- docs/runbooks/TRIAL_END_TO_END.md
- docs/runbooks/TRIAL_FUNNEL.md
- docs/runbooks/TRIAL_LIFECYCLE.md
- docs/security/TRIAL_AUTH.md
- docs/security/TRIAL_LIMITS.md
- ArchLucid.Api/  (POST /v1/register, trial seat reservation, tenant provision endpoints)
- archlucid-ui/src/app/(marketing)/signup/page.tsx
- archlucid-ui/src/components/marketing/SignupForm.tsx
- ArchLucid.Application/  (search for TrialSeatReservationService and tenant provisioning)

Do this:
1. Trace the existing happy path: signup form -> POST /v1/register ->
   trial seat reservation -> tenant + workspace provision -> sample-run seed
   -> first-run wizard. Document each step in a new file
   docs/runbooks/TRIAL_FUNNEL_END_TO_END.md with the file-paths and
   endpoints touched at each step.
2. For each step that has a TODO / placeholder / feature flag, either
   implement the missing piece or call it out as an owner-only blocker
   (Stripe live key, DNS, Front Door custom domain).
3. Add a Playwright test playwright/tests/trial-funnel.spec.ts that runs
   the entire happy path against the deterministic mocks already used in
   the operator-journey smoke (see
   archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md section 8).
4. Wire baselineReviewCycleHours capture from the signup form into the
   tenant row and surface a "before vs measured" panel in the operator
   dashboard once one run has committed (existing
   ValueReportReviewCycleSectionFormatter pattern).
5. Add an `archlucid trial smoke` CLI command that runs the funnel end to
   end in dev and prints PASS/FAIL per step.

Stop and ask the user before:
- Switching the funnel from Stripe TEST to live mode
- Turning off the trial signup feature flag in production

Exit criteria: end-to-end funnel works against staging in TEST mode;
Playwright spec green; CLI command shipped + tested; runbook reflects
the real flow.
```

---

## Prompt 6 — Microsoft Teams notification connector

```
Goal: ship the next workflow-embeddedness anchor after the GitHub Action
and the Azure DevOps task. Target: Teams notification on run commit,
governance approval requested, alert raised.

Read first:
- docs/INTEGRATION_EVENTS_AND_WEBHOOKS.md
- schemas/integration-events/catalog.json
- docs/adr/0019-logic-apps-standard-edge-orchestration.md
- infra/terraform-logicapps/  (existing five workflow templates)
- integrations/github-action-manifest-delta/  (mirror the layout)
- integrations/azure-devops-task-manifest-delta/
- docs/PENDING_QUESTIONS.md (item 11)

Do this:
1. Add a new Logic Apps Standard workflow template under
   infra/terraform-logicapps/workflows/teams-notifications/ that subscribes
   to Service Bus topics for run.committed, governance.approval.requested,
   and alert.raised. Render to a Teams adaptive card via Incoming Webhook.
2. Add a per-tenant configuration surface
   archlucid-ui/src/app/(operator)/integrations/teams/page.tsx and a
   POST /v1/integrations/teams/connections endpoint that stores the webhook
   URL in Key Vault references (do not store raw URLs in SQL). Encryption
   posture: same as existing webhook delivery secrets.
3. Add operator UI shaping: the integrations page is in Enterprise Controls
   tier; gate behind ExecuteAuthority for write, ReadAuthority for view.
   Add to nav-config.ts and the cross-module Vitest seam tests.
4. Add a Schemathesis contract test for the new endpoints.
5. Document the connector in docs/go-to-market/INTEGRATION_CATALOG.md and
   add a row to the public integration catalog page (Prompt 4 may have
   created it; if not, add a TODO).

Stop and ask the user before:
- Choosing notification-only vs two-way (approve governance from Teams)
- Adding any per-channel configuration that requires a Teams app manifest
  (registered in Microsoft 365 admin)

Exit criteria: Logic Apps workflow Terraform applies in pilot stack;
operator UI page shaped and tested; endpoints contract-tested;
integration catalog updated.
```

---

## Prompt 7 — Complete the ADR 0021 coordinator strangler

```
Goal: finish the work named in ADR 0021 (coordinator pipeline strangler) and
ADR 0022 (coordinator Phase 3 deferred) so the dual interface families
collapse, and add a CI guard against accidental regression.

Read first:
- docs/adr/0021-coordinator-pipeline-strangler-plan.md
- docs/adr/0022-coordinator-phase3-deferred.md
- docs/adr/0010-dual-manifest-trace-repository-contracts.md
- docs/adr/0002-dual-persistence-architecture-runs-and-runs.md
- docs/PERSISTENCE_SPLIT.md
- docs/runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md
- ArchLucid.Persistence/Data/Repositories/ICoordinatorGoldenManifestRepository.cs
- ArchLucid.Persistence/Data/Repositories/ICoordinatorDecisionTraceRepository.cs
- ArchLucid.Coordinator/Services/CoordinatorService.cs
- ArchLucid.Application/Runs/Orchestration/CoordinatorRunCatalogDurableDualWrite.cs
- ArchLucid.Application/Runs/IRunCommitOrchestrator.cs (RunCommitOrchestratorFacade)

Do this:
1. Inventory every call-site of the Coordinator-flavoured interfaces and
   produce docs/COORDINATOR_STRANGLER_INVENTORY.md listing each one with
   "keep / migrate / delete" labelled.
2. For every "migrate" call-site, redirect through
   IRunCommitOrchestrator / RunCommitOrchestratorFacade so the call-site
   no longer references the Coordinator interface family directly.
3. Add a CI guard scripts/ci/assert_coordinator_strangler_progress.py that
   counts references to ICoordinatorGoldenManifestRepository and
   ICoordinatorDecisionTraceRepository in non-test code, fails the build if
   the count goes UP from a checked-in baseline, and prints the new count.
4. Add a follow-up ADR 0028 ("coordinator strangler completion target")
   that names a date and a quantitative exit criterion (e.g.
   "non-test references == 0 by 2026-Q3").

Stop and ask the user before:
- Deleting either Coordinator interface (terminal step — ADR 0028 should
  carry that decision)
- Renaming any historical SQL migration filenames (Resolved: do not).

Exit criteria: inventory file in place; CI guard catching regression;
references demonstrably down vs the baseline; ADR 0028 drafted.
```

---

## Prompt 8 — Golden-cohort drift detection + per-finding "explain this" panel

```
Goal: convert structural test correctness into engine-quality correctness
by running a fixed corpus through the agents nightly, and let operators see
WHY the engine made each finding.

Read first:
- docs/STRYKER_RATchet_TARGET_72.md
- docs/MUTATION_TESTING_STRYKER.md
- docs/RUNBOOK_REPLAY_DRIFT.md
- docs/adr/0005-llm-completion-pipeline.md
- docs/runbooks/LLM_PROMPT_REDACTION.md
- ArchLucid.AgentRuntime/  (RealAgentExecutor, agent simulator)
- ArchLucid.Decisioning/Validation/SchemaValidationService.cs
- ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs (AgentLlmCompletion ActivitySource)
- ArchLucid.Application/  (search for finding generation and explanation)
- archlucid-ui/src/components/RunAgentForensicsSection.tsx
- archlucid-ui/src/components/RunTraceViewerLink.tsx
- docs/PENDING_QUESTIONS.md (item 15 — owner-only LLM budget)

Do this:
1. Add a fixed "golden cohort" of N=20 representative architecture requests
   under tests/golden-cohort/ with expected committed-manifest SHAs and
   expected finding categories. Document the cohort selection rationale.
2. Add a nightly GitHub Action that runs the cohort against the
   simulator-agent path AND optionally against a dedicated Azure OpenAI
   deployment when ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true. Diff the
   resulting manifests against the expected SHAs and the finding categories
   against the expected sets. Publish a Markdown drift report to
   docs/quality/golden-cohort-drift-latest.md (overwriting; the previous
   report goes to a dated archive).
3. Add an "Explain this finding" panel in the operator UI that shows
   - the agent prompt
   - the LLM completion (already redacted via LlmPromptRedaction)
   - the supporting evidence pieces from the decision trace
   Component: archlucid-ui/src/components/FindingExplainPanel.tsx with
   Vitest tests; gated behind ReadAuthority.
4. Add a thumbs-up/down feedback affordance per finding, persisted to
   dbo.FindingFeedback (new table — add migration), with aggregate score
   surfaced in the value-report DOCX.

Stop and ask the user before:
- Provisioning the dedicated Azure OpenAI deployment used by the nightly
  real-LLM run (budget approval — pending question 15)
- Publishing per-tenant feedback aggregates externally (privacy review)

Exit criteria: golden-cohort tests run in simulator mode in CI; explain
panel rendered + tested; feedback table migration applied; drift report
published as a regular artefact.
```

---

## How to use these prompts

- One prompt per session. Paste the whole block into a fresh Cursor agent.
- Each prompt names its **stop-and-ask** boundaries — the assistant should not cross those without owner input.
- Track resolution of pending questions in `docs/PENDING_QUESTIONS.md` as each prompt completes.
