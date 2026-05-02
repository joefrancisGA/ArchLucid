> **Scope:** ArchLucid stickiness solution quality assessment — independent V1-focused review of retention, repeated-use, embeddedness, and expansion mechanics; not a general product readiness, security, marketability, or procurement assessment.

# Stickiness Solution Quality Assessment — 69.96% Weighted

**Assessment date:** 2026-05-02  
**Assessment target:** Stickiness solution quality only  
**Scoring posture:** Blunt, commercially realistic, and V1-scope aware  

## Bottom Line

ArchLucid has a credible sticky core: it turns architecture reviews into committed manifests, artifacts, governance evidence, comparisons, replay, exports, and sponsor-ready proof. That is more defensible than a generic AI chat surface because the product creates durable work product and audit history that teams can return to.

The weakness is that the repeat-use loop is still more engineered than adopted. The system has strong artifacts and many operator surfaces, but it does not yet reliably pull a customer back every week with automatic next actions, real health scoring, in-product feedback capture, and low-friction workflow embedding. A motivated design partner can get value. A busy enterprise team can still drift back to Jira, Confluence, email, and review meetings unless ArchLucid becomes the place where review state, proof, and follow-up work live by default.

I located the deferred-scope markdown at `docs/library/V1_DEFERRED.md`. I did not penalize the score for V1.1/V2-deferred items such as first-party Jira, ServiceNow, Confluence, Slack, MCP, live commerce un-hold, PGP key drop, or third-party pen-test publication.

## Weighted Score

| Area | Weight | Score | Weighted Contribution |
|------|--------|-------|-----------------------|
| Workflow embeddedness and return paths | 20% | 62 | 12.40 |
| Adoption telemetry, health scoring, and learning loops | 18% | 58 | 10.44 |
| Activation and time-to-first-value | 18% | 78 | 14.04 |
| Recurring governance and review habit formation | 16% | 76 | 12.16 |
| Value proof and champion enablement | 14% | 74 | 10.36 |
| UX persistence and discoverability | 8% | 72 | 5.76 |
| Data gravity, exports, and switching resistance | 6% | 80 | 4.80 |
| **Total** | **100%** |  | **69.96** |

## 1. Workflow Embeddedness and Return Paths — 62/100, Weight 20%

**Why this needs the most improvement:** Stickiness is won where work already happens. ArchLucid has REST APIs, CloudEvents, Azure DevOps recipes, Microsoft Teams notifications, Service Bus/webhook surfaces, Logic Apps and Power Automate recipes, and PR decoration patterns. That is a serious V1 foundation, but it still asks the customer to operate the bridge for most enterprise systems.

The V1 posture is commercially honest: first-party Jira, ServiceNow, and Confluence connectors are explicitly V1.1, and Slack is V2. I am not charging the V1 score for that deferred scope. The remaining stickiness problem is that the V1 bridge story is still a recipe story. Recipes reduce integration risk, but they do not create the same product gravity as a managed connector, an in-product integration status page, or a generated deployment artifact that a platform team can apply without hand assembly.

**Evidence observed:**

- `docs/library/ITSM_BRIDGE_V1_RECIPES.md` gives a solid V1 bridge map for Azure DevOps, generic CloudEvents consumers, Logic Apps, and Power Automate.
- `docs/library/V1_SCOPE.md` correctly frames customer-owned bridges as V1 and first-party Jira/ServiceNow/Confluence as out of V1.
- The product has event and webhook concepts, but the strongest recurring-workflow destinations for architecture governance are still external systems.

**Tradeoffs:**

- Deferring first-party ITSM connectors is rational for V1. Building and supporting OAuth, ticket schema drift, marketplace listings, and two-way sync would distract from the core review product.
- The cost is adoption friction. Architecture teams already live in ticketing, docs, CI, and chat. If ArchLucid outputs do not automatically appear there, the product risks becoming a special-purpose review portal used only during demos or audits.

**Improvement recommendation:** Turn the V1 bridge recipes into deployable, testable bridge packages with in-product verification. Keep first-party connectors deferred, but make customer-owned automation feel like a supported path rather than a documentation exercise.

## 2. Adoption Telemetry, Health Scoring, and Learning Loops — 58/100, Weight 18%

**Why this is weak:** The repository contains the right concepts: tenant health scoring, product feedback storage, product-learning signals, improvement opportunities, and planning services. The implementation is still too shallow to drive retention behavior.

The health scoring worker currently computes engagement from recent run count and defaults breadth, quality, governance, and support to neutral values. That is fine as a Phase 1 scaffold, but it is not enough to tell customer success which tenants are sticky, which are quietly failing, or which workflows are expanding. Product learning is also partly disconnected: `PRODUCT_LEARNING.md` says the shipped product-learning API focuses on read/dashboard/export and that first-party HTTP POST for pilots may come later. There is a separate `ProductFeedback` insert path, but the feedback and product-learning loops are not yet a single obvious in-product behavior.

**Evidence observed:**

- `docs/go-to-market/CUSTOMER_HEALTH_SCORING.md` defines useful health dimensions: engagement, breadth, quality, governance adoption, and support.
- `ArchLucid.Persistence.CustomerSuccess.SqlTenantCustomerSuccessRepository` computes engagement from `Runs` in the last seven days and assigns neutral `3.0` scores for other dimensions.
- `docs/library/PRODUCT_LEARNING.md` states pilot feedback rows exist and dashboards/exports exist, but first-party HTTP POST is not the main shipped pilot path.
- `ProductLearningImprovementOpportunityService` and `ImprovementPlanningService` show ranking and planning logic, but they rely on signals existing.

**Tradeoffs:**

- Starting with a simple score avoids fake precision before pilots generate real behavior.
- But weak measurement delays product learning. If customers do not return, the product may not know whether the cause is onboarding, output quality, missing integrations, governance friction, or lack of sponsor proof.

**Improvement recommendation:** Make health scoring real using data already in the system: run frequency, committed manifests, exports, comparisons, governance approvals, feedback dispositions, and sponsor package generation. Add first-party capture points for feedback on findings, artifacts, and review packages.

## 3. Activation and Time-to-First-Value — 78/100, Weight 18%

**What is strong:** The activation story is one of the better parts of the solution. The trial design targets active trial in under five minutes, includes pre-seeded sample data, and maps the funnel from signup to sample run, first commit, Day-N badge, before-vs-measured panel, and sponsor package. The operator home has a welcome banner, guided checklist, tour launcher, completed example, and a four-step core pilot path.

**What still hurts stickiness:** The activation path is still cognitively heavy. The user must understand architecture review requests, runs, finalization/commit, manifests, artifacts, findings, scorecards, and exports. That is unavoidable to some extent because the product is not a toy, but stickiness depends on compressing the first win into a crisp habit: "new review → finalize → share proof → track follow-up."

**Evidence observed:**

- `docs/go-to-market/TRIAL_AND_SIGNUP.md` defines pre-seeded sample project, sample run, guided tour, trial duration, run limits, and conversion triggers.
- `docs/runbooks/TRIAL_FUNNEL_END_TO_END.md` maps signup, tenant provisioning, sample run, first commit, sponsor banner, Day-N badge, and before-vs-measured panel.
- `docs/library/FIRST_RUN_WIZARD.md` documents the seven-step wizard and live pipeline tracking.
- `OperatorFirstRunWorkflowPanel`, `WelcomeBanner`, and `EmailRunToSponsorBanner` provide concrete UI surfaces for first value and post-commit sponsor proof.

**Tradeoffs:**

- A detailed wizard improves input quality and downstream agent output.
- A detailed wizard also slows low-intent evaluators. If the product cannot quickly show a completed, relevant example, users may leave before they understand the durable value.

**Improvement recommendation:** Keep the structured wizard, but make the default path feel more like a guided review package generator than a data-entry flow. Use sample runs, next-best actions, and auto-filled sponsor proof to make the first session decisive.

## 4. Recurring Governance and Review Habit Formation — 76/100, Weight 16%

**What is strong:** Governance workflows, policy packs, pre-commit gates, audit logs, alerts, comparisons, replay, and graph views can create repeated use after the first review. These are meaningful sticky mechanics because they attach ArchLucid to recurring architecture governance rather than one-off documentation generation.

**What is missing:** The product has the ingredients of a habit loop but not enough orchestration of the loop. It can support weekly review operations, but it does not yet appear to automatically say: "these three reviews need attention, this policy has drifted, this approval is aging, this exported package should go to the sponsor, this comparison should be run now." Without those prompts, the product relies on disciplined operators.

**Evidence observed:**

- `docs/library/V1_SCOPE.md` lists compare, replay, graph, ask, advisory scans, pilot feedback, recommendation learning, governance workflow, policy packs, audit, and alerts as V1 Operate surfaces.
- `docs/go-to-market/PILOT_SUCCESS_SCORECARD.md` recommends a six-week pilot cadence with repeated runs, governance gate adoption, comparisons, exports, and approval workflow usage.
- `docs/go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md` defines weekly onboarding phases and health signals.

**Tradeoffs:**

- Leaving advanced surfaces optional prevents overwhelming a first pilot.
- But hidden optional surfaces do not become habits by themselves. Stickiness needs staged surfacing based on user state.

**Improvement recommendation:** Add lifecycle-aware nudges and review queues that graduate the customer from first review to recurring governance operations.

## 5. Value Proof and Champion Enablement — 74/100, Weight 14%

**What is strong:** ArchLucid understands that sticky enterprise products need internal champions. The pilot success scorecard, ROI model, sponsor package, first-value report, Day-N badge, before-vs-measured panel, DOCX export, ZIP bundles, and audit CSV all support a champion trying to justify continued use.

**What is weak:** Too much of the value proof is still manually assembled or dependent on the customer filling baseline numbers and qualitative feedback. The sponsor package is a good artifact, but the system should progressively auto-fill the scorecard from actual product usage and make the champion's leadership narrative nearly effortless.

**Evidence observed:**

- `docs/go-to-market/PILOT_SUCCESS_SCORECARD.md` defines efficiency, quality, governance, operational, and qualitative measures.
- `EmailRunToSponsorBanner` exposes first-value report, architecture package DOCX, manifest bundle, run export, and in-product pilot scorecard links.
- `docs/runbooks/TRIAL_FUNNEL_END_TO_END.md` ties the sponsor banner to first-commit timing and before-vs-measured review-cycle deltas.

**Tradeoffs:**

- Manual scorecards are flexible and credible early, especially before enough telemetry exists.
- But manual scorecards create friction exactly when the champion needs speed. A sticky product should do the evidence assembly automatically.

**Improvement recommendation:** Auto-populate pilot scorecards and sponsor narratives from persisted run, manifest, export, governance, and feedback data.

## 6. UX Persistence and Discoverability — 72/100, Weight 8%

**What is strong:** The UI remembers checklist state locally, distinguishes first-time and returning users, shows a completed example, offers an opt-in tour, includes shortcut guidance, and gives post-completion links to compare/replay/graph. This helps users resume where they left off.

**What is weak:** Local browser persistence is not the same as account-level workflow memory. A user can minimize or complete a checklist, but the product's sticky memory should live at the tenant/workspace level and be visible to the team. Also, several surfaces use broad navigation rather than role-specific next actions.

**Evidence observed:**

- `OperatorFirstRunWorkflowPanel` persists minimized, graduated, and completed checklist state in local storage.
- `WelcomeBanner` changes copy and CTAs based on existing runs and trial status.
- `core-pilot-steps.ts` defines a simple four-step first review path.

**Tradeoffs:**

- Local storage avoids backend schema and privacy complexity.
- Tenant-level onboarding state is more useful for team adoption because architecture reviews involve multiple participants.

**Improvement recommendation:** Promote key onboarding and recurring-use state from local-only UI state to tenant/workspace-scoped progress records where it affects customer success, team handoff, and health scoring.

## 7. Data Gravity, Exports, and Switching Resistance — 80/100, Weight 6%

**What is strong:** This is the strongest stickiness dimension. Committed manifests, artifacts, run exports, DOCX packages, bundles, audit events, comparison records, provenance, and governance approvals create durable data gravity. Once a team uses ArchLucid for several reviews, it accumulates evidence that is painful to recreate manually.

**What limits the score:** Data gravity is not the same as daily-use gravity. Exports are valuable, but if the exported artifacts become the system of record in Confluence, SharePoint, Jira, or email, ArchLucid loses the loop. The product needs to be the source for current state and follow-up, not just the generator of packages.

**Evidence observed:**

- `docs/library/V1_SCOPE.md` covers manifest/artifact review, ZIP and DOCX exports, replay, comparison, audit, and governance.
- `docs/go-to-market/PILOT_SUCCESS_SCORECARD.md` and `EmailRunToSponsorBanner` both lean on durable artifacts for champion proof.

**Tradeoffs:**

- Rich exports reduce buyer fear of lock-in.
- Too much reliance on exports can reduce stickiness if customers export and leave.

**Improvement recommendation:** Keep exports strong, but add return links, correlation IDs, follow-up states, and integration callbacks so exported artifacts point users back into ArchLucid.

## Key Commercial Risks

1. **Portal risk:** ArchLucid may become a place people visit only for formal architecture reviews, not the place they manage ongoing architecture risk.
2. **Recipe risk:** V1 integrations are good enough for technical design partners but may be too much work for teams that expect managed Jira/ServiceNow/Confluence behavior.
3. **Measurement risk:** Health scoring and product learning exist conceptually, but weak first-party capture means churn reasons may show up late.
4. **Champion burden:** The product gives champions materials, but still asks them to assemble parts of the business case manually.
5. **Cognitive-load risk:** The product has many valuable surfaces. Stickiness will suffer if users cannot tell what to do next after the first run.

## Deferred Scope Confirmation

I found the deferred markdown at `docs/library/V1_DEFERRED.md`.

Items explicitly not charged against this V1 stickiness score:

- V1.1: Jira, ServiceNow, Confluence first-party connectors.
- V2: Slack first-party connector.
- V1.1: MCP membrane.
- V1.1: Stripe live keys, Marketplace publication, and production signup DNS cutover.
- V1.1: PGP key drop.
- V2: third-party pen-test execution and redacted summary publication.
- V1.1: first named public reference customer.

## Pending Questions to Save for Later

I am not asking these now, per instruction, but these are the owner-input questions I would keep ready:

1. Which V1 bridge should get the most support polish first: ServiceNow via Logic Apps, Jira via Power Automate, Azure DevOps PR decoration, or generic CloudEvents worker?
2. What customer-success thresholds should count as red/yellow/green for a real tenant: weekly runs, committed manifests, active operators, exports, governance approvals, and feedback scores?
3. Should pilot feedback capture be anonymous within a tenant, attributed to signed-in users, or configurable by tenant policy?
4. Which customer support system will own support-score data before a real integration exists?
5. Which sponsor artifact should be the canonical executive artifact: PDF first-value report, DOCX architecture package, Markdown report, or in-product scorecard?

## Eight Best Improvements

### 1. Add First-Party Feedback Capture on Findings, Artifacts, and Review Packages

**Why it matters:** The product cannot improve stickiness if feedback capture is not part of the work surface. Product learning currently has useful aggregation and export ideas, but signal capture is not yet prominent enough in the operator workflow.

**Expected impact:** Raises adoption telemetry, learning loops, output quality, and customer success triage. This is the highest-leverage improvement because it turns every review into product evidence.

**Cursor prompt:**

```text
Implement first-party in-product feedback capture for ArchLucid review outputs.

Goal:
Add lightweight feedback controls to the operator UI for findings, artifacts, and finalized review packages so pilot users can mark an output as trusted, needs revision, rejected, or needs follow-up with an optional short comment.

Context to inspect first:
- docs/library/PRODUCT_LEARNING.md
- docs/go-to-market/CUSTOMER_HEALTH_SCORING.md
- ArchLucid.Persistence/Migrations/083_TenantHealthScores_ProductFeedback.sql
- ArchLucid.Persistence.CustomerSuccess/SqlTenantCustomerSuccessRepository.cs
- ArchLucid.Persistence.Coordination/ProductLearning/*
- archlucid-ui/src/app/(operator)/reviews/[runId]/*
- archlucid-ui/src/components/RunFindingExplainabilityTable.tsx

Requirements:
- Reuse existing ProductFeedback or ProductLearning concepts where possible; do not create a parallel feedback model unless the existing schema is insufficient.
- Add a small API endpoint for authenticated feedback submission if one does not already exist.
- Capture tenant/workspace/project scope using existing scope mechanisms.
- Enforce score/disposition bounds server-side.
- Keep comment text optional and capped.
- Do not store secrets or credentials in comments.
- Add UI controls near the output being judged, not on a separate feedback page.
- Add tests for validation, persistence call behavior, and UI rendering.
- Update PRODUCT_LEARNING.md and CUSTOMER_HEALTH_SCORING.md to explain the capture path.
```

### 2. Replace Neutral Tenant Health Defaults with Real Stickiness Signals

**Why it matters:** Current health scoring has the right dimensions but only engagement is meaningfully computed. Neutral defaults hide churn risk.

**Expected impact:** Improves retention operations, customer success prioritization, and expansion readiness.

**Cursor prompt:**

```text
Upgrade ArchLucid tenant health scoring from run-count-only Phase 1 scoring to real V1 stickiness signals.

Context to inspect first:
- docs/go-to-market/CUSTOMER_HEALTH_SCORING.md
- ArchLucid.Host.Core/Hosted/TenantHealthScoringHostedService.cs
- ArchLucid.Persistence.CustomerSuccess/SqlTenantCustomerSuccessRepository.cs
- ArchLucid.Persistence/Migrations/083_TenantHealthScores_ProductFeedback.sql
- docs/go-to-market/PILOT_SUCCESS_SCORECARD.md
- docs/library/DATA_MODEL.md

Requirements:
- Keep the existing TenantHealthScores table unless a schema change is clearly required.
- Compute Engagement from recent runs, committed manifests, and active operators if actor data is available.
- Compute Breadth from comparisons, exports, artifact review, graph/replay usage, or equivalent persisted signals.
- Compute Quality from product feedback scores/dispositions and available output-quality metrics when persisted.
- Compute Governance from approval requests, policy pack usage, governance gate outcomes, and audit events.
- Keep Support neutral only if no support data exists; document the limitation.
- Preserve RLS and the leader-elected worker pattern.
- Add focused tests around scoring functions using deterministic input.
- Update CUSTOMER_HEALTH_SCORING.md with the implemented formulas and known gaps.
```

### 3. Add a Tenant-Scoped Next-Best-Action Engine for the Operator Home

**Why it matters:** Stickiness improves when the product tells users what to do next. The current checklist is useful, but it is local and generic.

**Expected impact:** Converts first-run guidance into recurring product behavior: finalize, review, export, compare, govern, invite, and follow up.

**Cursor prompt:**

```text
Build a tenant-scoped next-best-action system for ArchLucid operator home.

Context to inspect first:
- archlucid-ui/src/components/OperatorFirstRunWorkflowPanel.tsx
- archlucid-ui/src/lib/core-pilot-steps.ts
- archlucid-ui/src/components/WelcomeBanner.tsx
- docs/library/V1_SCOPE.md
- docs/go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md
- docs/go-to-market/PILOT_SUCCESS_SCORECARD.md

Requirements:
- Create a small backend read endpoint that returns the top next actions for the current tenant/workspace/project.
- Use existing persisted signals: runs, committed manifests, artifacts, exports if tracked, comparisons, governance approvals, trial status, and health score.
- Return actions such as create first review, finalize latest review, review findings, generate sponsor package, run comparison, configure governance, invite operators, or export evidence.
- Add reason text for each action so users understand why it appears.
- Keep the UI compact and actionable on the operator home.
- Preserve existing local checklist behavior for purely client-side convenience, but do not rely on localStorage for team-level progress.
- Add tests for action selection order and UI rendering.
```

### 4. Turn V1 Integration Recipes into Deployable Bridge Packages

**Why it matters:** First-party ITSM connectors are deferred, but V1 can still be stickier if the customer-owned bridge is almost turnkey.

**Expected impact:** Reduces integration friction without violating V1 scope. Helps ArchLucid appear in the customer's actual workflow sooner.

**Cursor prompt:**

```text
Convert ArchLucid V1 ITSM bridge recipes into deployable, testable bridge packages.

Context to inspect first:
- docs/library/ITSM_BRIDGE_V1_RECIPES.md
- docs/integrations/recipes/README.md
- docs/integrations/recipes/SERVICENOW_INCIDENT_VIA_LOGIC_APPS.md
- docs/integrations/recipes/JIRA_ISSUE_VIA_POWER_AUTOMATE.md
- docs/integrations/recipes/SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md
- schemas/integration-events/catalog.json
- templates/integrations/

Requirements:
- Keep first-party Jira, ServiceNow, and Confluence connectors explicitly out of V1.
- Add a deployable bridge package for one priority V1 recipe using existing Azure-native components, preferably Logic Apps Standard or Azure Functions if templates already exist.
- Include Terraform or clearly parameterized IaC where practical; do not introduce public SMB/445 or public storage access.
- Add a dry-run or validation script that checks required settings, webhook secret presence, event schema mapping, and target endpoint placeholders.
- Add a short operator runbook that says how to deploy, test, rotate secrets, and rollback.
- Add sample payload tests against the integration event schemas.
```

### 5. Make Trial and Core-Pilot Funnel Telemetry Durable and Actionable

**Why it matters:** The trial funnel is well documented, but stickiness requires durable drop-off analytics and operational alerts, not just smoke tests.

**Expected impact:** Identifies whether users fail at signup, verification, first review, finalization, sponsor package generation, or return use.

**Cursor prompt:**

```text
Make ArchLucid trial and core-pilot funnel telemetry durable and actionable.

Context to inspect first:
- docs/runbooks/TRIAL_FUNNEL_END_TO_END.md
- docs/go-to-market/TRIAL_AND_SIGNUP.md
- archlucid-ui/src/lib/core-pilot-rail-telemetry.ts
- archlucid-ui/src/components/OperatorFirstRunWorkflowPanel.tsx
- archlucid-ui/src/components/EmailRunToSponsorBanner.tsx
- ArchLucid.Api/Controllers/Admin/ClientErrorTelemetryController.cs
- ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs

Requirements:
- Inventory existing funnel events and diagnostics endpoints before adding anything.
- Add durable or queryable telemetry for core milestones: signup attempted, tenant provisioned, sample run seeded, first operator visit, first review created, first finalization, first sponsor package generated, first return session.
- Avoid high-cardinality labels in metrics.
- Preserve privacy: do not emit raw email, company names, comments, or secrets in metrics.
- Add a small report or endpoint suitable for customer success to inspect funnel progress by tenant.
- Update TRIAL_FUNNEL_END_TO_END.md with the implemented event map and how to troubleshoot missing events.
```

### 6. Auto-Fill the Pilot Scorecard from Product Data

**Why it matters:** The pilot scorecard is commercially useful but too manual. The product should assemble the proof for the champion.

**Expected impact:** Improves conversion, executive sponsor communication, and perceived value after the first few reviews.

**Cursor prompt:**

```text
Auto-fill ArchLucid pilot scorecard fields from persisted product data.

Context to inspect first:
- docs/go-to-market/PILOT_SUCCESS_SCORECARD.md
- docs/library/PILOT_ROI_MODEL.md
- archlucid-ui/src/components/EmailRunToSponsorBanner.tsx
- archlucid-ui/src/components/BeforeAfterDeltaPanel.tsx
- docs/runbooks/TRIAL_FUNNEL_END_TO_END.md
- ArchLucid.Api/Controllers/Pilots/*

Requirements:
- Find the existing in-product scorecard route and first-value report endpoints before adding new endpoints.
- Auto-fill metrics that can be computed from current data: run count, committed manifest count, run success rate, time to first committed manifest, export/package generation, governance approvals, and available feedback scores.
- Leave manually-entered fields for baseline hours and qualitative stakeholder answers where no reliable source exists.
- Clearly mark every field as measured, modeled, manually entered, or unavailable.
- Add tests for metric calculation and rendering.
- Update PILOT_SUCCESS_SCORECARD.md to distinguish auto-filled V1 fields from manual fields.
```

### 7. Persist Team-Level Onboarding and Checklist Progress

**Why it matters:** Local checklist state helps one browser. Stickiness in an enterprise pilot needs team-visible progress.

**Expected impact:** Improves handoff between champion, operators, and customer success; gives health scoring better adoption inputs.

**Cursor prompt:**

```text
Persist ArchLucid onboarding and core-pilot checklist progress at tenant/workspace/project scope.

Context to inspect first:
- archlucid-ui/src/components/OperatorFirstRunWorkflowPanel.tsx
- archlucid-ui/src/lib/core-pilot-checklist-storage.ts
- archlucid-ui/src/lib/core-pilot-steps.ts
- docs/go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md
- docs/library/ONBOARDING_WIZARD.md
- docs/library/V1_SCOPE.md

Requirements:
- Keep localStorage as a fast UI cache, but add backend persistence for team-visible milestone completion where it matters.
- Use existing tenant/workspace/project scoping patterns.
- Store milestone keys, completion state, completed timestamp, and actor if available.
- Expose a read endpoint for operator home and customer success surfaces.
- Avoid storing sensitive free-text.
- Add tests for persistence, RLS/scoping behavior, and UI hydration from server state.
- Update onboarding docs with the team-level progress model.
```

### 8. DEFERRED: Ship First-Party ServiceNow and Jira Connectors

**Reason deferred:** This is explicitly V1.1 scope in `docs/library/V1_DEFERRED.md`, with ServiceNow as the first sequencing priority. It needs product planning, connector auth decisions, external API test tenants, and support commitments. Do not generate the full implementation prompt under the user's rule.

### 9. Add Export-to-Return Links and Follow-Up State

**Why it matters:** Exports reduce lock-in fear, but they can also pull users away. Every exported artifact should point back to the authoritative ArchLucid state and the next follow-up action.

**Expected impact:** Makes DOCX, PDF, Markdown, ZIP, and external comments act as return paths instead of dead-end artifacts.

**Cursor prompt:**

```text
Add return links and follow-up state to ArchLucid exported review artifacts.

Context to inspect first:
- archlucid-ui/src/components/EmailRunToSponsorBanner.tsx
- docs/library/V1_SCOPE.md
- docs/library/API_CONTRACTS.md
- docs/go-to-market/PILOT_SUCCESS_SCORECARD.md
- artifact/export generation services in the API and application projects

Requirements:
- Inventory existing export generators before changing output formats.
- Add canonical return URLs, run IDs, manifest IDs, correlation IDs, and generated timestamps to exported sponsor/report artifacts where appropriate.
- Add a lightweight follow-up state model if none exists: open, in progress, accepted risk, remediated, deferred.
- Do not break deterministic replay or content hashing without documenting the intended hash boundary.
- Ensure exported links respect tenant access controls and do not expose secrets.
- Add tests for generated artifact metadata and docs explaining how exported artifacts point back into ArchLucid.
```
