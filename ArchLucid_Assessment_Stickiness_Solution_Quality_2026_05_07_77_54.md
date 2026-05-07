# ArchLucid Stickiness Solution Quality Assessment - 77.54%

**Assessment date:** 2026-05-07  
**Scope:** Stickiness solution quality only. This is not a full product-readiness, marketability, trust, procurement, or ROI assessment.  
**Score:** **77.54 / 100**  

## Executive Judgment

ArchLucid has a credible stickiness architecture: it does not rely only on "run an analysis once." The product has repeat-use loops around advisory scans, executive digests, alerts, governance approvals, audit, comparison/replay/graph inspection, product-learning feedback, and integrations into Teams, Slack, ServiceNow, Jira, Confluence, webhooks, Service Bus, CLI, and REST.

The blunt issue is concentration. The product has many surfaces that can create repeat usage, but the strongest customer habit is not yet forced into one obvious operating rhythm. A buyer can see how ArchLucid could become weekly architecture governance infrastructure; they may still need a sales engineer or founder to explain which loops matter first.

Deferred scope was not penalized. I did not deduct for MCP, SOC 2 CPA attestation, signed design partner, live commerce un-hold, third-party pen test publication, Redis graph cache, Container Apps Jobs / Durable Task Framework, or the deferred product-learning "brains" called out in `docs/library/V1_DEFERRED.md`.

## Scoring Model

| Area | Weight | Score | Weighted contribution | Weighted gap |
|---|---:|---:|---:|---:|
| Workflow embedding and downstream closure | 24% | 74 | 17.76 | 6.24 |
| Feedback-to-roadmap and customer-success loop | 18% | 68 | 12.24 | 5.76 |
| Recurring executive/advisory habit loop | 18% | 80 | 14.40 | 3.60 |
| Governance, audit, and alert operating loop | 16% | 82 | 13.12 | 2.88 |
| Core pilot to second-run activation | 14% | 83 | 11.62 | 2.38 |
| Evidence, export, and stakeholder shareability | 10% | 84 | 8.40 | 1.60 |
| **Total** | **100%** |  | **77.54** | **22.46** |

## 1. Workflow Embedding And Downstream Closure - 74 / 100

**Why this is first:** It has the largest weight and the largest weighted gap. Stickiness in enterprise software comes from becoming part of the customer's existing work queue. ArchLucid has the right targets, but the closure loop needs more proof and fewer manual seams.

**What is strong:**

- The integration catalog is directionally strong: REST, generated .NET client, CLI, webhooks, Service Bus, Teams, Slack, ServiceNow, Jira, Confluence, SCIM, and CI/CD paths are all represented.
- V1 committed connector scope is commercially relevant: ServiceNow incident creation with CMDB linkage, Jira issue creation with status sync, Confluence publish, and Slack alert/digest notification parity.
- The product models durable correlation rows and audit event types for integration outcomes, which is important because "we opened a ticket" is not sticky unless the ticket lifecycle comes back into the system of record.

**What holds the score down:**

- The stickiest workflows are not yet presented as one end-to-end operating loop: finding -> ticket/page/chat -> external status change -> ArchLucid state update -> digest/alert -> governance evidence.
- Connector smoke documentation exists, but the product would be more convincing with a single repeatable connector readiness dashboard or smoke runner that shows which tenant connectors are configured, last tested, and last succeeded.
- Some connector functionality is committed in docs and partially visible in code/tests, but a buyer evaluating stickiness will care less about catalog breadth and more about whether their ServiceNow/Jira/Confluence/Slack path is demonstrably alive.

**Tradeoff:** Keeping V1 connector MVPs narrow is the right call. App marketplace listings, Slack interactions, broad OAuth polish, and many import connectors would be scope creep. The risk is that narrow MVPs still need a strong "day-two loop" proof, or they look like export buttons rather than embedded workflow.

**Improvement direction:** Build one connector operations spine, not more connector marketing. Show configured connectors, last smoke status, last outbound attempt, last inbound sync, and last correlated ArchLucid object.

## 2. Feedback-To-Roadmap And Customer-Success Loop - 68 / 100

**Why this is second:** Stickiness improves when usage teaches the product and the customer sees that learning reflected back. ArchLucid has the raw ingredients, but the loop is not yet commercially sharp enough.

**What is strong:**

- Product-learning APIs collect scoped pilot signals with dispositions such as trusted, rejected, revised, and needs-follow-up.
- Dashboard, triage, improvement opportunities, artifact trend, and report endpoints exist.
- Planning read APIs expose themes, improvement plans, priority score, evidence counts, and bounded report exports.
- `SqlOperatorStickinessSnapshotReader` captures useful funnel and habit signals: total runs, committed runs, latest run, comparisons in 30 days, pending governance, first run, first manifest, first comparison, first download, first replay, and 90-day product-learning signal count.

**What holds the score down:**

- The most valuable customer-success view is present as signals, but not yet packaged into an obvious "stickiness cockpit" for operators or customer success.
- Deferred product-learning planning automation should not be scored against V1, but without it the loop is still more telemetry/reporting than productized retention engine.
- The signals emphasize internal learning; the buyer-facing "what changed because your team used ArchLucid" narrative is less obvious than the backend capability.

**Tradeoff:** Avoiding premature ML/AI "brains" is good. Deterministic, auditable learning is the right enterprise posture. But the product should still turn existing signals into a simple recurring customer-success artifact.

**Improvement direction:** Package existing metrics into a tenant-level stickiness and expansion snapshot: first value achieved, weekly repeat usage, governance adoption, connector adoption, and learning feedback volume.

## 3. Recurring Executive / Advisory Habit Loop - 80 / 100

**Why this is third:** Scheduled advisory scans and digests are one of the best repeat-use mechanisms in the codebase. They are commercially meaningful because they can pull executives and operators back without requiring a new run every time.

**What is strong:**

- Advisory schedules support cron-style recurring scans, on-demand run-now behavior, execution history, and persisted architecture digests.
- Digest subscriptions support scoped delivery, enabled/disabled state, delivery attempts, audit events, and channel abstraction.
- Weekly executive digest jobs and hosted services provide a repeatable background loop.
- The UI has dedicated routes for advisory, advisory scheduling, digests, digest subscriptions, and executive digest settings.

**What holds the score down:**

- The digest/advisory loop needs a sharper buyer promise. "You will get a weekly executive architecture risk digest with changes, stale decisions, governance blockers, and top actions" is stickier than a generic digest subscription.
- Delivery observability exists at the attempt level, but the operator experience should make digest health and subscription coverage obvious.
- The current loop is strong for operators; the executive sponsor loop could be made more explicit and harder to miss.

**Tradeoff:** A narrow weekly digest is better than an overbuilt notification platform. The product should resist custom newsletter sprawl and instead standardize one high-quality executive operating cadence.

**Improvement direction:** Define the weekly executive digest as the primary habit: what it contains, who gets it, how failures surface, and how it links back to runs/findings/governance.

## 4. Governance, Audit, And Alert Operating Loop - 82 / 100

**Why this is fourth:** This is a strong stickiness pillar because governance workflows create organizational switching costs. The product is close here.

**What is strong:**

- Governance workflows include approvals, segregation of duties, SLA tracking, policy packs, pre-commit governance gate, and dashboards.
- Alerts include rules, routing, composite rules, simulation, tuning, inbox, delivery attempts, and severity matching.
- Audit has typed durable events and export paths.
- UI progressive disclosure is thoughtful: Core Pilot stays narrow, while governance and alert operations are revealed when the operator is ready.

**What holds the score down:**

- Governance and alerts are powerful but may feel like separate modules rather than one "architecture control room."
- Alerts are sticky only if they reliably lead to action. The strongest commercial loop is alert -> owner -> ticket/chat -> resolution -> audit evidence, and that is not yet the default story.
- The product has enough knobs that a first enterprise operator may need guidance to avoid configuring a noisy governance system.

**Tradeoff:** The separation between Pilot and Operate is correct. Pulling governance into the first run would hurt activation. The improvement is not to expose governance earlier; it is to make the post-pilot upgrade path more prescriptive.

**Improvement direction:** Add a governance operating preset: a minimal default pack, alert route, approval SLA, and dashboard narrative for the first 30 days after pilot success.

## 5. Core Pilot To Second-Run Activation - 83 / 100

**Why this is fifth:** The first run is well controlled; stickiness depends on the second and third runs. ArchLucid has solid activation design, but repeat usage should be made even more deliberate.

**What is strong:**

- Core Pilot is intentionally narrow: create request, execute, commit, review package.
- The UI has checklist, onboarding, sample review, progressive disclosure, run detail next steps, and second-run paths.
- The docs correctly tell operators to ignore advanced surfaces until the first package is done.
- The `SECOND_RUN` path and starter proof packs are strong because they lower the jump from demo to customer-specific data.

**What holds the score down:**

- The product could more aggressively convert first value into a named second action: compare against second run, schedule advisory scan, create one digest subscription, or connect one downstream tool.
- The Core Pilot checklist has telemetry, but the customer does not yet get a visible "you are now ready for weekly operation" transition.
- There is a risk that users finish the package, export it, and leave unless the next habit is explicit.

**Tradeoff:** The product should not overwhelm first-time users. The right move is a post-commit "next best operating loop" choice, not a bigger first-run wizard.

**Improvement direction:** Add a post-commit retention rail with three concrete choices: "Run it again with your data," "Schedule weekly advisory," or "Send findings to your workflow."

## 6. Evidence, Export, And Stakeholder Shareability - 84 / 100

**Why this is last:** It has the smallest weighted gap. The evidence/export layer is one of the stronger stickiness assets because it creates artifacts that circulate outside the product.

**What is strong:**

- Golden manifests, artifact review, ZIP bundles, run export ZIP, DOCX architecture packages, first-value report, value report, ROI pages, board packs, and procurement pack all reinforce shareability.
- The product has buyer-safe gate language and redaction profiles, which matter commercially because executives and procurement teams need evidence they can forward.
- Deterministic artifact ordering and stable export behavior help screenshots, reviews, and audits.

**What holds the score down:**

- Exporting can reduce in-product stickiness if the next action is not linked back to ArchLucid.
- Stakeholder shareability is strongest when every shared artifact has a clear "return path" to the live run, finding, ticket, governance state, or digest subscription.
- The product should bias shared outputs toward re-entry, not just download completion.

**Tradeoff:** Offline artifacts are necessary for enterprise review. The goal is not to trap users in the app; it is to make exported evidence a gateway into the next review cycle.

**Improvement direction:** Add consistent "next review cycle" links and status references to shareable artifacts where safe.

## Deferred Or Out-Of-Scope Items Not Penalized

- **MCP server:** V1.1 candidate, not a V1 stickiness defect.
- **Signed design partner / public reference customer:** commercial V1.1 motion, not a product stickiness score deduction.
- **SOC 2 CPA attestation / ISO / third-party pen-test publication:** procurement realism, not stickiness solution quality.
- **Redis graph projection cache:** V2 platform scale enhancement, not required for current stickiness.
- **Container Apps Jobs / Durable Task Framework:** V2 situational orchestration option, not needed for current pipeline complexity.
- **First-tenant funnel retention / purge:** V1.1 owner decision area; not penalized here.
- **Product-learning deterministic planning bridge:** explicitly deferred; the score only reflects the currently shipped signal/reporting loop.

## Eight Best Improvements

### 1. Build A Connector Operations Dashboard

**Why it matters:** This is the highest-leverage stickiness improvement. It turns integrations from a checklist into an operational control plane.

**Expected impact:** Higher enterprise confidence, faster connector validation, clearer day-two adoption, less founder-led explanation.

**Cursor prompt:**

```text
Assess and implement a V1-safe Connector Operations Dashboard for ArchLucid.

Goal:
- Create an operator-visible dashboard that shows per-tenant connector readiness and recent activity for Teams, Slack, ServiceNow, Jira, Confluence, webhooks, and Service Bus where data already exists.

Constraints:
- Do not add new external dependencies.
- Do not require live third-party credentials for tests.
- Reuse existing repositories, audit events, delivery attempt tables, connector settings, and smoke docs.
- Keep secrets out of API responses; show Key Vault secret names or configured/unconfigured status only.
- Respect existing tenant/workspace/project scoping and commercial tier filters.

Implementation steps:
- Search existing connector controllers, repositories, delivery attempts, audit event types, and UI integration routes.
- Add a read-only API DTO/service that returns connector type, configured status, enabled status, last delivery/sync attempt, last success/failure, and last correlated object when available.
- Add an operator UI page or integrations hub panel that renders the summary and links to existing configuration pages.
- Add unit tests for DTO mapping, scope filtering, and no-secret response guarantees.
- Add UI tests for configured, unconfigured, failing, and no-data states.
```

### 2. Productize The Operator Stickiness Snapshot

**Why it matters:** Existing stickiness signals are useful but buried. A customer-success view can turn raw telemetry into renewal and expansion evidence.

**Expected impact:** Better pilot follow-up, clearer expansion signals, stronger "weekly operating system" narrative.

**Cursor prompt:**

```text
Create a V1-safe Operator Stickiness Snapshot surface using existing ArchLucid signals.

Goal:
- Expose a scoped customer-success snapshot showing first value, repeat usage, comparison/replay adoption, governance adoption, product-learning feedback, and recent activity.

Constraints:
- Reuse IOperatorStickinessSnapshotReader and related domain models where possible.
- Do not create cross-tenant analytics.
- Do not implement deferred automatic product-learning planning brains.
- Use deterministic calculations only.
- Preserve tenant/workspace/project scope boundaries.

Implementation steps:
- Locate existing customer-success controllers, DTOs, and UI value/customer-success pages.
- Add or extend a read API that returns: total runs, committed runs, latest run id, first run/manifest/download/comparison/replay timestamps, comparisons in 30 days, pending governance approvals, and product-learning signals in 90 days.
- Add concise UI cards with empty-state guidance and links to the next best action.
- Add tests for SQL reader mapping if covered through contract tests, plus controller authorization/scope tests and UI rendering tests.
```

### 3. Make The Weekly Executive Digest The Primary Habit

**Why it matters:** Scheduled digests are one of the strongest existing retention loops. They need sharper default packaging and operational visibility.

**Expected impact:** More recurring executive engagement, fewer one-off exports, clearer buyer value after first pilot.

**Cursor prompt:**

```text
Strengthen ArchLucid's weekly executive digest as the primary post-pilot habit loop.

Goal:
- Make digest setup, coverage, last delivery, next run, and failure state obvious to operators after the first committed run.

Constraints:
- Reuse existing advisory schedule, architecture digest, digest subscription, delivery attempt, and exec digest preference services.
- Do not add new notification providers.
- Do not require live email/Slack/Teams credentials for tests.
- Keep the Core Pilot path uncluttered; surface this after commit or in Operate.

Implementation steps:
- Inspect existing digest settings, advisory scheduling, digest subscription APIs, and UI pages.
- Add a compact "Weekly digest health" component showing configured recipients/channels, next scheduled run, last digest, last delivery attempt, and setup gaps.
- Link from run detail after commit and from the Digests hub.
- Add tests for no schedule, schedule but no subscription, failed delivery, and healthy delivery states.
```

### 4. Add A Post-Commit Retention Rail

**Why it matters:** The product should not let users finish a package and drift away. The next action should be obvious at the moment value is proven.

**Expected impact:** More second runs, more advisory schedules, more connector setup, better pilot-to-operate conversion.

**Cursor prompt:**

```text
Add a post-commit retention rail to the ArchLucid run detail experience.

Goal:
- After a run is committed, show a focused next-step rail with three choices: run again with customer data, schedule weekly advisory, or connect findings to workflow.

Constraints:
- Do not expand the first-run wizard.
- Do not expose advanced/governance links before the existing progressive disclosure rules allow them.
- Reuse existing route readiness, layer guidance, and nav authority helpers.
- Keep API authorization authoritative; UI is guidance only.

Implementation steps:
- Inspect RunDetail components, LayerHeader, CorePilotNextStepsCard, AfterCorePilotChecklistHint, and nav disclosure helpers.
- Add a post-commit component that appears only after a golden manifest exists.
- Wire CTAs to SECOND_RUN flow/new run, advisory scheduling/digests, and integrations/connector dashboard or existing integration pages.
- Add Vitest coverage for committed vs uncommitted state, reader vs execute authority, and disclosure-safe links.
```

### 5. Create A First-30-Days Governance Operating Preset

**Why it matters:** Governance is sticky, but only if it is easy to adopt without designing a control program from scratch.

**Expected impact:** Faster governance adoption after pilot success, reduced alert/policy noise, better enterprise expansion path.

**Cursor prompt:**

```text
Design and implement a minimal First-30-Days Governance Operating Preset for ArchLucid.

Goal:
- Provide a V1-safe preset that helps an operator start governance after Core Pilot: one policy pack baseline, one approval SLA pattern, one alert route, and one dashboard explanation.

Constraints:
- Reuse existing policy pack, governance workflow, pre-commit simulation, alert routing, and dashboard surfaces.
- Do not make governance part of the first Core Pilot requirement.
- Do not add new policy semantics unless existing models already support them.
- Keep all changes tenant-scoped and auditable.

Implementation steps:
- Inspect existing policy pack templates, governance pages, alert routing pages, and governance empty-state guidance.
- Add a preset or guided setup page using existing APIs and templates.
- Include an inspect-first preview before mutation.
- Add tests for reader mode, execute/admin mode, preset preview, and audit event expectations for applied changes.
```

### 6. Add Connector Smoke Status Without Live Credentials

**Why it matters:** Buyers need confidence that connector paths are testable before real credentials are available.

**Expected impact:** Shorter technical validation cycle, better implementation confidence, less manual smoke coordination.

**Cursor prompt:**

```text
Add non-live connector smoke status support for ArchLucid first-party connectors.

Goal:
- Provide deterministic smoke-readiness checks for Slack, ServiceNow, Jira, Confluence, and Teams that can run without live third-party credentials.

Constraints:
- Do not call external services in unit tests.
- Reuse fake webhook posters, existing connector clients, smoke docs, and test fixtures.
- Do not persist or echo secrets.
- Align status language with existing docs under docs/integrations/smoke.

Implementation steps:
- Inventory existing connector smoke docs, fake clients/posters, and connector conformance tests.
- Add a smoke-readiness service that validates local configuration completeness and can optionally report last synthetic/local test result.
- Expose read-only API and UI summary states: not configured, locally valid, last synthetic pass, live smoke required, last live failure if already recorded.
- Add unit and UI tests for each status.
```

### 7. Close The Alert-To-Action Loop

**Why it matters:** Alerts create habit only when they route to accountable action and resolution evidence.

**Expected impact:** Stronger day-two usage, less alert fatigue, better governance/audit proof.

**Cursor prompt:**

```text
Improve ArchLucid's alert-to-action loop using existing alert, routing, ITSM, and audit surfaces.

Goal:
- Make it clear for each alert what action was taken, whether it was routed, whether a ticket/chat notification was created, and what resolution evidence exists.

Constraints:
- Reuse existing alert records, delivery attempts, routing subscriptions, ITSM correlations, and audit events.
- Do not add broad new workflow engines.
- Do not require Slack/Jira/ServiceNow live credentials for tests.
- Preserve tenant/workspace/project scope.

Implementation steps:
- Inspect AlertsController, alert delivery repositories, ITSM correlation repositories, and Alerts UI components.
- Add an alert detail/action summary DTO that joins alert state, delivery attempts, and any known external correlation.
- Render this in the Alerts inbox/detail experience with clear empty and failure states.
- Add tests for no route, routed success, routed failure, correlated ticket, and resolved/acknowledged states.
```

### 8. Add Re-Entry Links To Shared Evidence Artifacts

**Why it matters:** Exports are valuable, but sticky exports bring stakeholders back into the live review cycle.

**Expected impact:** More return visits from sponsors/operators, better handoff from static artifacts to governed action.

**Cursor prompt:**

```text
Add safe re-entry references to ArchLucid shared evidence artifacts.

Goal:
- Ensure exported/shareable artifacts consistently point back to the relevant run, manifest, finding, governance state, digest, or ticket correlation when safe.

Constraints:
- Do not expose tenant secrets or privileged deep links.
- Respect buyer-safe redaction profiles and demo-tenant warnings.
- Reuse existing export builders, artifact metadata, route helpers, and proof-pack/redaction guidance.
- Keep offline artifacts useful even when the hosted URL is unavailable.

Implementation steps:
- Inspect DOCX export, run export ZIP, first-value report, value report, board pack, and procurement pack generation code.
- Identify where run id, manifest id, finding id, correlation id, and safe operator URLs can be included.
- Add a small "Review continuity" section to eligible artifacts with safe identifiers and links where the existing route model supports them.
- Add snapshot/golden tests for generated artifact content and redaction-profile behavior.
```

