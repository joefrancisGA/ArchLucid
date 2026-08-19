> **Scope:** Copy-paste Composer/agent prompts for expanding ArchLucid’s provider-neutral architecture-quality baseline, policy-pack selection, platform overlays, contextual recommendations, generation/review integration, and auditability. Run **one phase at a time**; review the diff and test results after each step before starting the next.
>
> **Do not begin by creating four new policy-pack files.** This change crosses the policy engine, persistence, applicability logic, architecture generation, reviews, scope disclosure, audit history, and UI. Coding the packs first could leave ArchLucid with two competing concepts of “default coverage.”
>
> **Revised 2026-07-12:** the original Prompts 1–12 below have been replaced by a seven-phase sequence (Phase 1–Phase 7), incorporating the completed Prompt‑0 assessment (`docs/architecture/architecture_quality_policy_engine_assessment.md`) and two rounds of owner decisions recorded there (§C.19a, §C.19b), including an external (OpenAI) review of the assessment. Prompt 0 itself already ran and is kept below as a historical record — do not re-run it.

# Policy pack optimization — implementation prompts

You have enough product direction for implementation, but **I would not begin by creating four new policy-pack files**. This change crosses the policy engine, persistence, applicability logic, architecture generation, reviews, scope disclosure, audit history, and UI. Coding the packs first could leave ArchLucid with two competing concepts of “default coverage.”

## Model recommendation

Use **Sonnet 5 for the assessment and each focused implementation step**. Anthropic currently prices Sonnet 5 at $2 per million input tokens and $10 per million output tokens through August 31, 2026, rising to $3 and $15 afterward. Fable 5 is $10 and $50 and is intended for unusually ambitious, long-running work. Fable also requires 30-day data retention. ([Anthropic][1])

At current introductory pricing, Fable is five times Sonnet’s token price. Its autonomy could still save money when solving one deeply coupled architectural problem, but these tasks are safer and cheaper when divided into bounded changes with tests. Cursor includes some model usage with plans and permits on-demand usage after that allowance is consumed, so your exact charge depends on your plan and usage settings. ([Cursor][2])

My recommendation:

* Use **Sonnet 5** for Prompt 0 and Phases 1 through 6.
* Use **Fable 5 once**, for Phase 7's final architecture audit, or earlier if a phase reveals unresolved architectural risk.
* Run one phase at a time, preferably one branch or commit per phase.

---

## Prompt 0 — Assess the policy engine and recommend the architecture

**Status: completed.** The assessment is at `docs/architecture/architecture_quality_policy_engine_assessment.md`, including the recommended architecture (Option B), the current-state findings, the full deliverable set, two rounds of recorded owner decisions (§C.19a, §C.19b), and the phase sequence below. Kept here only as a historical record of the original prompt — do not re-run it.

Use **Sonnet 5**. This prompt must not change code.

```text
Perform a repository-grounded architecture assessment of ArchLucid’s policy-pack, architecture-generation, and architecture-review engines.

Do not implement anything during this task.

Write the completed assessment to:

.local/owner/architecture_quality_policy_engine_assessment.md

Background:

ArchLucid currently defaults Security and Cost policy packs when generating or reviewing architectures.

That default coverage is too narrow.

The intended provider-neutral architecture-quality baseline is:

1. Security
2. Reliability and resilience
3. Cost effectiveness
4. Performance and scalability
5. Operational excellence
6. Sustainability and resource efficiency

Security and Cost already have policy packs.

ArchLucid does not currently have a Sustainability and Resource Efficiency policy pack. Reliability, Performance, and Operational Excellence packs may also be absent or incomplete. Inspect the repository and determine the actual state rather than assuming.

The desired long-term behavior is:

- Every architecture receives a provider-neutral quality baseline.
- The baseline is not presented as six casually removable policy checkboxes.
- When a cloud platform is known, ArchLucid recommends the applicable provider-specific guidance overlays.
- Azure, AWS, and Google Cloud must remain peers. Do not make Azure the underlying canonical model.
- When project context indicates additional concerns, ArchLucid recommends appropriate contextual policy packs.
- High-confidence contextual recommendations may be selected by default, but the user can exclude them unless they are required by the organization.
- Exclusions must be visible, deliberate, persisted, and reflected in the final scope statement.
- Organization-required packs are locked.
- Additional optional packs remain unselected.
- Selected packs must affect both architecture generation and architecture review.
- A selected pack must not cause every rule in the pack to apply blindly.
- Rule applicability must consider workload context.
- Reviews must distinguish missing evidence, failed requirements, accepted risks, not-applicable requirements, and excluded or unassessed coverage.
- Conflicts among cost, reliability, security, performance, operations, and sustainability must be surfaced as tradeoffs rather than silently resolved.
- Historical reviews must never be retroactively represented as having assessed policy packs that did not exist when those reviews were performed.

Inspect and document:

1. Current policy-pack definitions and storage.
2. Current default-pack selection behavior.
3. Existing Security and Cost packs.
4. Any existing Reliability, Performance, Operational Excellence, or Sustainability content.
5. Policy-pack versioning.
6. Rule applicability logic.
7. Organization-required policy support.
8. Architecture-creation policy selection.
9. Review policy selection.
10. Persistence of selected packs.
11. Persistence of excluded packs and exclusion reasons.
12. Cloud-platform detection and selection.
13. Project-context extraction.
14. Current recommendation logic.
15. Architecture-generation integration.
16. Architecture-review integration.
17. Finding and evidence status models.
18. Review-package scope disclosure.
19. Audit history.
20. Existing database migrations.
21. Relevant APIs and DTOs.
22. Relevant UI routes and components.
23. Existing automated tests.
24. Existing documentation and terminology.

Compare at least these architecture options:

Option A:
Extend the current policy-pack engine incrementally.

Option B:
Create a separate provider-neutral architecture-quality baseline engine and retain policy packs as overlays.

Option C:
Create a unified assurance engine in which quality dimensions, organizational policies, provider overlays, and contextual packs share a common rule model but retain distinct selection behavior.

For each option assess:

- fit with the existing repository;
- implementation complexity;
- migration risk;
- risk of duplicate concepts;
- ability to support generation and review;
- explainability;
- auditability;
- cross-cloud neutrality;
- performance;
- testing burden;
- and long-term extensibility.

Recommend the least disruptive design that still supports the complete intended behavior.

Be adversarial.

Explicitly identify risks such as:

- creating a second parallel policy engine;
- treating all architecture quality dimensions as ordinary optional packs;
- hidden default selections;
- retrospective distortion of historical reviews;
- excessive policy questions;
- overapplication of generic rules;
- provider-specific standards replacing the neutral baseline;
- untraceable AI recommendations;
- users removing important packs without understanding the consequences;
- favorable review summaries despite intentionally narrow scope;
- duplicated cost and sustainability findings;
- and policy-version drift.

Required deliverables:

1. Sponsor recommendation.
2. Current-state architecture map.
3. Relevant file and component inventory.
4. Current capability and gap matrix.
5. Recommended domain model.
6. Recommended selection-state model.
7. Recommended rule-applicability model.
8. Recommended provider-overlay model.
9. Recommended contextual-recommendation engine.
10. Recommended generation integration.
11. Recommended review integration.
12. Recommended historical-data treatment.
13. Recommended API changes.
14. Recommended UI behavior.
15. Recommended migration sequence.
16. Required tests.
17. Implementation sequence divided into small independently testable changes.
18. Explicit features not to build yet.
19. Questions or repository ambiguities that require an owner decision.

Do not modify production code, tests, configuration, migrations, or documentation.

Stop after writing the assessment and summarize the recommendation.
```

---

## Optional Fable gate — Review the Sonnet assessment

**Status: superseded for the original Prompt‑0 assessment** — an external model review already happened informally and its accepted/rejected points are recorded in the assessment's §C.19b. Keep this prompt template for a future phase (e.g. Phase 7's final audit, or re-running against a specific phase's diff) if one more expensive second opinion is wanted before merging.

```text
Adversarially review:

docs/architecture/architecture_quality_policy_engine_assessment.md

Inspect the relevant ArchLucid repository code needed to validate or challenge the assessment.

Do not modify code.

Determine whether the assessment recommends the correct minimum-disruption architecture for adding:

- a six-dimension provider-neutral architecture-quality baseline;
- organization-required packs;
- platform-specific overlays;
- contextual policy recommendations;
- explicit exclusions;
- rule-level applicability;
- architecture-generation integration;
- architecture-review integration;
- tradeoff reasoning;
- and defensible historical scope.

Look specifically for:

- unnecessary new abstractions;
- duplicated policy engines;
- domain-model mistakes;
- weak migration treatment;
- hidden coupling;
- unhandled historical reviews;
- incorrect assumptions about generation or review behavior;
- inability to explain recommendations;
- overreliance on AI;
- policy-selection dark patterns;
- cross-cloud bias;
- and changes likely to create substantial later rework.

Write the review to:

.local/owner/architecture_quality_policy_engine_fable_review.md

Provide:

1. Findings ranked by severity.
2. Areas where the Sonnet assessment is correct.
3. Areas requiring modification.
4. A revised architecture only where necessary.
5. A final recommendation: proceed, revise before proceeding, or reject the design.

Do not implement anything.
```

---

## Phase 1 — Coverage foundation

Run after reviewing and accepting Prompt 0's assessment (including §C.19a, §C.19b owner decisions).

```text
Implement only the domain model, persistence model, and API contracts needed to represent architecture assurance coverage.

Read first:

docs/architecture/architecture_quality_policy_engine_assessment.md, including §C.19a and §C.19b (recorded owner decisions).

Follow its approved architecture unless repository evidence clearly contradicts it. Stop and report the contradiction rather than silently inventing another design.

Do not create policy content or redesign the UI in this task.

The model must represent:

Coverage types:

- Provider-neutral architecture quality baseline
- Organization-required policy pack
- Platform-specific guidance overlay
- Contextually recommended policy pack
- Additional optional policy pack

Selection states or equivalent behavior:

- Always active
- Required and locked
- Recommended and selected
- Recommended but excluded
- Optional and selected
- Optional and not selected
- Not applicable
- Unavailable or retired where necessary

Add a nullable QualityDimension column on the policy-pack entity itself — Security, Reliability and resilience, Cost effectiveness, Performance and scalability, Operational excellence, Sustainability and resource efficiency. Populate it on exactly the six canonical baseline packs (Security, Cost, and the four packs Phase 2 introduces). Leave it null on every other pack, including platform-overlay packs (Azure/AWS/GCP WAF-style, Resiliency-DR) — do not attempt to populate a multi-dimension mapping for those packs in this phase; that is explicitly deferred until a demonstrated product need exists.

Persist enough information to explain each selection:

- policy-pack identifier;
- policy-pack version;
- coverage type;
- selection source;
- selected state;
- whether selection is locked;
- recommendation confidence where applicable;
- recommendation rationale;
- triggering project evidence or context;
- exclusion reason;
- actor;
- timestamp;
- and evaluation or generation version.

Important constraints:

1. Do not retroactively claim that historical reviews assessed new quality dimensions.
2. Existing historical reviews must retain their original policy scope.
3. New defaults apply only to newly created architecture generations and reviews after the effective migration.
4. A rerun of an older review must create or record a new evaluation scope rather than rewriting the historical scope.
5. Preserve existing Security and Cost selections and data.
6. Avoid breaking existing APIs unless a compatible migration is impossible.
7. Do not expose internal implementation terminology unnecessarily in customer-facing DTOs.
8. Do not use Azure-specific concepts in the provider-neutral domain model.
9. Support multiple platform overlays for multicloud projects.
10. Support versioned recommendations and exclusions.

Implement:

- domain entities or value objects;
- enums only where stable and justified;
- persistence changes;
- database migration;
- repository methods;
- service contracts;
- API DTO changes;
- serialization behavior;
- validation;
- backward compatibility;
- and focused automated tests.

Adversarial requirements:

- Do not create separate duplicate models for generation and review unless genuinely necessary.
- Do not make a nullable boolean carry multiple semantic states.
- Do not overwrite historical scope during migration.
- Do not default unknown historical data to “fully assessed.”
- Do not introduce a design that cannot explain why a pack was recommended.
- Do not add speculative fields without a demonstrated use.
- Do not add a "which dimensions does this pack touch" list field to every pack — the QualityDimension column is single-valued and populated only on the six canonical baseline packs (owner decision, §C.19b).

Run relevant targeted tests.

Report:

- files changed;
- migration behavior;
- compatibility decisions;
- tests run;
- test results;
- and unresolved risks.

Stop after this domain and persistence change.
```

---

## Phase 2 — Six-dimension neutral baseline

```text
Implement the four provider-neutral baseline policy packs that complete ArchLucid's six-dimension architecture-quality baseline, bringing the bundled catalog from 41 to 45 packs:

1. Reliability and resilience
2. Performance and scalability
3. Operational excellence
4. Sustainability and resource efficiency

Read:

docs/architecture/architecture_quality_policy_engine_assessment.md, including §C.8 and §C.19b (owner decisions from the external review round).

Inspect the existing Security and Cost policy packs and follow the repository’s established schema and conventions where they remain appropriate.

Requirements:

- These are provider-neutral architecture-quality packs. Do not make Azure, AWS, or Google Cloud the canonical standard.
- For Reliability, Performance, and Operational Excellence: extract and generalize provider-neutral content that already exists inside the Azure/AWS/GCP Well-Architected/CIS/Resiliency-DR packs. This is content reuse, not net-new authoring. Do not copy provider framework language wholesale, and do not create cloud-service-specific requirements in these three new packs.
- For Sustainability and Resource Efficiency: ArchLucid has no existing content for this dimension — author it as genuinely new content.
- Required correction (owner decision, §C.19b): because a project will typically have both a baseline dimension pack and a matching platform overlay pack active at the same time (e.g. an Azure project with both the new neutral Reliability pack and the existing Azure Resiliency-DR pack), trim the source Azure/AWS/GCP WAF/Resiliency-DR packs as part of this same task — remove rules that are now duplicated in the new neutral packs, keeping only genuinely provider-specific requirements. This is a one-time corrective edit to the existing packs, not a runtime deduplication mechanism.
- Tag exactly six packs (Security, Cost, and the four new/extracted packs) with the `QualityDimension` column from Phase 1. Do not populate it on the trimmed overlay packs.
- Register existing Security and Cost packs as members of the provider-neutral baseline without rewriting valid content unnecessarily.
- New generations and reviews must include all six dimensions:
  - Security
  - Reliability and resilience
  - Cost effectiveness
  - Performance and scalability
  - Operational excellence
  - Sustainability and resource efficiency
- The baseline must not appear as ordinary removable policy checkboxes.
- Each requirement must support context-sensitive applicability.

Each requirement should contain or map to:

- stable identifier;
- title;
- concise requirement;
- rationale;
- architecture-quality dimension;
- applicability conditions;
- expected evidence;
- severity or materiality guidance;
- finding guidance;
- generation guidance;
- relevant tradeoff dimensions;
- policy version;
- and source or provenance metadata where appropriate.

Cover a minimum credible set of concerns.

Reliability and resilience should include areas such as:

- failure-mode identification;
- redundancy proportional to criticality;
- recovery objectives;
- backup and restoration;
- dependency failure;
- graceful degradation;
- retry and timeout behavior;
- data durability;
- regional or zonal strategy where relevant;
- capacity during failure;
- testing recovery procedures;
- and business-continuity ownership.

Performance and scalability should include:

- workload and usage assumptions;
- latency and throughput objectives;
- scaling approach;
- capacity planning;
- contention;
- caching;
- data-access patterns;
- load testing;
- performance observability;
- bottleneck identification;
- and degradation under peak demand.

Operational excellence should include:

- ownership;
- deployment and rollback;
- infrastructure automation;
- observability;
- alerting;
- runbooks;
- incident response;
- change management;
- configuration management;
- operational readiness;
- support model;
- maintenance;
- and post-incident learning.

Sustainability and resource efficiency design principles:

1. Every new architecture receives a lightweight sustainability and resource-efficiency screening.
2. Deeper analysis is activated when the workload context makes sustainability materially relevant.
3. Do not manufacture environmental precision.
4. Do not make numerical carbon-emissions claims without validated measurements, assumptions, methodology, and data sources.
5. Do not duplicate Cost findings merely by changing their label.
6. Preserve distinct cost and sustainability reasoning where their effects or tradeoffs differ.
7. Treat sustainability as an architecture concern, not merely corporate reporting.
8. Avoid ideological or promotional language.
9. Recommendations must remain technically and economically proportional.

Sustainability should include baseline requirements or screening for:

- workload utilization assumptions;
- right-sizing;
- autoscaling or scheduling;
- idle-resource management;
- software and algorithm efficiency;
- compute and accelerator proportionality;
- data-retention discipline;
- storage lifecycle;
- unnecessary replication;
- unnecessary data movement;
- recomputation versus caching;
- managed-service utilization where appropriate;
- observability of consumption;
- resource disposal or retirement;
- and explicit resource-efficiency tradeoffs.

Add deeper sustainability applicability triggers for contexts such as generative AI, machine learning, GPUs or other accelerators, large-model inference, large-scale data processing, high storage volume, long retention periods, global or multiregion architecture, high-volume event processing, continuous low-utilization workloads, substantial network transfer, repeated batch processing, and explicit organizational sustainability commitments. For AI workloads specifically, consider model-size justification, use of the smallest model that credibly meets the requirement, inference frequency, batching, caching, repeated prompt or context processing, accelerator utilization, scheduled versus always-on capacity, unnecessary retraining or fine-tuning, and evaluation of quality/latency/cost/resource tradeoffs.

Sustainability output behavior must distinguish design deficiency, optimization opportunity, missing evidence, accepted tradeoff, and not applicable.

Example acceptable finding: "The proposal does not provide utilization assumptions or an idle-capacity strategy for its continuously allocated accelerator resources. Comparative utilization and latency evidence is required."

Example prohibited behavior: "This design will reduce carbon emissions by 37%." — unless ArchLucid actually possesses validated data and methodology supporting that number.

Be proportional across all four packs. Do not apply the same rigor to a prototype, an internal low-risk tool, a regulated production service, and a life-critical workload. Create applicability conditions that allow the engine to select appropriate requirements based on lifecycle stage, criticality, scale, availability needs, data sensitivity, and operational impact.

Do not integrate these packs deeply into generation or review beyond the minimum needed to register and retrieve them — Phase 6 handles that.

Add focused unit and integration tests for:

- pack loading;
- stable identifiers;
- versioning;
- baseline registration;
- applicability metadata;
- duplicate detection;
- existing Security and Cost compatibility;
- the overlay-pack trimming (assert no rule ID that now exists in a neutral pack still exists, unmodified, in the corresponding trimmed overlay pack); and
- that ordinary low-scale applications receive proportionate baseline screening while resource-intensive AI/data workloads trigger deeper Sustainability coverage.

Report changed files and tests, then stop.
```

---

## Phase 3 — Baseline and platform selection

```text
Implement the platform-specific guidance-overlay mechanism, fix the two known Azure-skew bugs, and retire the "Security and Cost only" framing of focused pilot mode in favor of full six-dimension breadth with reduced depth.

Read: docs/architecture/architecture_quality_policy_engine_assessment.md, including §C.8 and §C.19b.

Platform-overlay requirements:

- The provider-neutral six-dimension baseline always remains active.
- Platform overlays supplement the baseline; they never replace it.
- Supported first-class platforms must include Azure, AWS, and Google Cloud, with multicloud architectures able to activate more than one overlay.
- Platform selection may come from explicit user input or reliable existing project context. Do not infer a platform from a weak incidental reference.
- High-confidence platform overlays should be recommended and selected by default. Users may exclude an overlay unless it is required by their organization; a material exclusion requires a reason.
- The recommendation must explain which evidence triggered it. An excluded platform overlay must appear in the generation or review scope limitations.
- Provider-specific requirements must retain their provider identity and source (this is now easier since Phase 2 already trimmed the generic overlap out of the overlay packs). Conflicting provider guidance must not be silently merged.
- Azure, AWS, and Google Cloud must have equal capabilities in the mechanism — fix `RunStarterTaskFactory.BuildPolicyRefs`'s hardcoded Azure security-baseline reference so it selects the overlay pack matching the run's actual `CloudProvider`, and extend the "standard baseline" UI badge to recognize the existing AWS/GCP peer packs, not just Azure.

Focused-pilot-mode requirements (owner decision, §C.19a/§C.19b):

- Widen `FocusedPilotModePolicyPacks`' allow-list from Security + Cost to all six baseline dimensions, plus organization-required packs and the selected platform overlay when known.
- A focused-pilot run may still omit lower-confidence contextual and optional packs, and may apply a stricter priority floor (e.g. P0-only), reducing assessment depth rather than dimension count.
- Rewrite the pilot-mode toggle's user-facing name and description so it no longer implies "Security and Cost only" — the UI must never state something that is no longer true.

Do not build the platform-overlay selection UI in this task; that is Phase 5. Do not create new Azure/AWS/GCP overlay content in this task, since it already exists (Phase 2 already trimmed it) — only run a targeted Azure, AWS, or Google Cloud overlay-content refresh prompt if this phase's work surfaces a specific, named content gap beyond what already exists; do not refresh all three overlays speculatively.

Implement:

- provider identification model;
- provider-overlay metadata;
- recommendation and selection behavior;
- multicloud support;
- deduplication hooks;
- conflict hooks;
- persistence;
- API support;
- the two Azure-skew fixes;
- the focused-pilot-mode allow-list widening and copy rewrite;
- and tests.

Test:

- Azure-only project;
- AWS-only project;
- Google-Cloud-only project;
- multicloud project;
- provider not yet known;
- weak provider reference that must not trigger selection;
- excluded overlay;
- organization-required overlay;
- historical review behavior;
- `RunStarterTaskFactory` no longer hardcoding Azure;
- the "standard baseline" badge recognizing AWS/GCP; and
- a focused-pilot run showing all six dimensions at reduced depth, with updated toggle copy.

Report files and tests, then stop.
```

---

## Phase 4 — Rule applicability

```text
Implement the smallest deterministic rule-applicability model needed to prevent every baseline rule from applying to every project.

Read: docs/architecture/architecture_quality_policy_engine_assessment.md, §C.7.

Do not build a general rule language. Extend the existing curated-rule entry with an optional, additive applicability-conditions field, evaluated as a new filter stage inserted between the existing rule-key intersection filter and the existing priority-floor filter — so both existing stages remain unmodified, and a rule with no conditions behaves exactly as it does today.

Use a small, closed vocabulary of condition keys drawn from structured facts the repository can already reliably produce or will produce via explicit intake answers, such as:

- lifecycle stage (prototype, production, regulated, etc.);
- workload criticality;
- data sensitivity;
- expected scale;
- availability objective;
- production versus prototype; and
- use of AI or accelerators.

Do not retrofit this onto the existing graph-level, resource-category-based applicability engine — that engine answers a different question (topology-graph applicability) and should be left alone; this new model is about workload/project context.

Add tests for: zero-condition rules (must match today's behavior exactly, no regressions across the existing 45-pack catalog), matched conditions, unmatched conditions, and combined-condition cases across at least one rule from each of the six baseline dimensions.

Report files and tests, then stop.
```

---

## Phase 5 — Coverage UI

```text
Implement the user experience for reviewing assurance coverage before architecture generation or architecture review.

Use the existing ArchLucid design system and page patterns. Do not create a generic wall of checkboxes.

The UI must group coverage as follows:

1. Architecture quality baseline — show as always considered: Security, Reliability and resilience, Cost effectiveness, Performance and scalability, Operational excellence, Sustainability and resource efficiency. These should not be ordinary removable checkboxes.

2. Required by your organization — show selected and locked with a clear explanation.

3. Recommended for this architecture — show checkbox, pack name, concise rationale, triggering project context, recommendation confidence where useful, a "Why recommended?" detail, pack version where appropriate, and scope impact. High-confidence recommendations may be checked by default; do not hide that they were selected automatically. Include recommended platform overlays here, using the same pattern.

4. Additional policy packs — show available optional packs unselected.

5. Excluded coverage — when a user clears a materially relevant recommendation, explain the effect, require a concise exclusion reason where appropriate, record the exclusion, and state that the excluded area will appear as not assessed or limited in resulting outputs.

Add a clear summary such as: "This architecture will use 6 baseline quality dimensions, 2 organization-required packs, 1 platform overlay, and 3 project-specific packs."

Requirements:

- no dark-pattern selection;
- no hidden packs;
- no implication that more packs always means better architecture;
- no Azure preference;
- accessible keyboard and screen-reader behavior;
- responsive layout;
- clear loading and saving feedback;
- duplicate-action prevention;
- persistence;
- error handling;
- and restoration after navigation or refresh.

When context changes and recommendations change, show a calm notification such as: "ArchLucid found additional assurance coverage that may apply. Review the changes before continuing." Do not allow final generation or review to proceed with unacknowledged material recommendation changes.

Preserve existing generation and review navigation behavior.

Add component and interaction tests following the existing UI test strategy.

Report files, screenshots or test evidence where supported, and tests, then stop.
```

---

## Phase 6 — Generation and review integration

```text
Implement the contextual policy-pack recommendation engine, then integrate the resulting coverage — baseline, organization-required, platform overlay, and contextual — into both architecture generation and architecture review.

Read: docs/architecture/architecture_quality_policy_engine_assessment.md, §C.9, §C.10, §C.11.

Recommendation engine:

- Use deterministic and explainable recommendation rules for known triggers, consuming only facts the repository can already reliably produce (explicit cloud provider, explicit L0 intake answers). AI may assist in extracting structured context from free text, but the fact-to-recommendation mapping itself must remain deterministic and table-driven — an AI suggestion must not become a silently selected policy pack.
- Recommendation tiers: organization required (selected and locked); high-confidence contextual recommendation (selected by default, excludable unless required, exclusion reason required when materially important); medium-confidence suggestion (shown, not selected by default); low-confidence/speculative (do not interrupt the user; may sit in the optional catalog or be omitted).
- Do not recommend packs that do not exist. Every recommendation must retain pack identifier and version, trigger, supporting project evidence, confidence, rationale, selected state, and recommendation timestamp.
- When project context changes: reevaluate recommendations, preserve prior recommendation history, never silently remove previously selected coverage, explain changes, and require acknowledgement before final generation or review when the material coverage set has changed.
- Be adversarial about false positives — applying too many packs is a product failure.

Generation integration:

- The six-dimension baseline is always considered for newly generated architectures. Fixed initial questions remain deterministic and immediately available; selected packs may add applicable follow-up questions only after enough context exists, and any AI-generated follow-up question must be grounded in a specific rule, policy, requirement, or architecture concern.
- Do not ask questions whose answers already exist in project context or evidence. Do not recommend every possible high-availability, security, or sustainability control — apply rigor proportionate to lifecycle stage, criticality, scale, sensitivity, and stated objectives.
- Record the exact pack versions and applicable requirements used, requirements deemed not applicable, and unresolved evidence and decisions. Surface conflicts as tradeoffs rather than silently choosing (tradeoff detection itself remains deferred — see below).
- Saving a draft must never start a review. Preserve autosave, interruption recovery, Save draft, and Save and exit behavior. Existing generation without explicit project context must still function safely, and historical generated architectures must not be rewritten as though they used the new baseline.

Review integration:

- For each evaluated requirement, distinguish Satisfied, Partially satisfied (where supported by the existing model), Failed/unmet, Missing evidence, Unresolved decision, Accepted risk/approved exception, Not applicable, Excluded from scope, and Not assessed. Do not collapse missing evidence into failed compliance, and do not claim an excluded area passed.
- Coverage exclusion/not-assessed tracking is expressed primarily at the coverage-record level (§C.11, §C.19b) — do not build logic to synthesize finding rows for excluded rules purely to attach a disposition; a narrow, secondary finding-disposition value may exist for the rare case a finding already existed before its pack was excluded mid-run.
- New reviews consider all six baseline dimensions; organization-required packs are locked into scope; selected platform and contextual packs contribute requirements; rule-level applicability (Phase 4) is evaluated before findings are generated; findings retain evidence and policy traceability.
- Review outputs must disclose baseline dimensions considered, organization-required packs, provider overlays, contextual packs, exclusions, applicability decisions, pack versions, and material limitations. A narrow review must not appear comprehensive, and a favorable result must be qualified when material coverage was intentionally excluded.
- Re-running a review creates a new versioned scope; historical reviews retain their original scope; architecture packages and exports must use the same scope record as the underlying review. No user-visible internal API or engine language should appear.

Add tests for: high-confidence recommendation, medium-confidence suggestion, unsupported pack, ambiguous context, context removal, changed recommendation, organization-required override, exclusion, multiple applicable packs, no unnecessary recommendation, baseline influence on generation, contextual/overlay influence, proportional applicability, no duplicate questions, draft persistence, historical compatibility, satisfied/failed/missing-evidence/accepted-risk/not-applicable/excluded findings, historical review integrity, rerun with a new policy version, scope disclosure, and review-package consistency.

Report files and tests, then stop.
```

---

## Phase 7 — Reporting and final audit

```text
Implement assurance-coverage auditability and user-visible scope reporting, then perform a final adversarial audit of the complete implementation.

Part 1 — Auditability and reporting. Persist and expose: baseline dimensions, organization-required packs, platform overlays, contextual recommendations, optional selections, exclusions, exclusion reasons, recommendation triggers, recommendation confidence, pack versions, applicable and non-applicable requirements, actor, timestamps, changes between runs, and final acknowledged scope. Add a reusable coverage summary for architecture drafts, generated architectures, reviews, review details, finalized architecture packages, exports, audit views, and sponsor reporting, answering: what was considered, why, what was required, what was recommended, what was excluded, what was not applicable, what remains unassessed, which versions were used, and what changed since the prior evaluation. Extend `AuditEventTypes`/`AUDIT_COVERAGE_MATRIX.md` with the one real audit gap identified in the assessment (§A.19) — a durable "run's coverage was resolved" event. Historical records retain historical scope; new baseline packs must not be backfilled as completed assessments; sample/demo records must not contaminate real portfolio reporting; do not expose internal IDs or implementation language; do not imply regulatory certification; do not claim comprehensiveness when material areas were excluded; keep provider-neutral dimensions comparable across cloud platforms while keeping provider-specific overlays visibly distinct.

Add tests for history, reruns, exclusions, exports, review-package consistency, and tenant separation.

Part 2 — Final adversarial audit. Inspect the full diff across Phases 1–7 and the relevant surrounding architecture. Validate: the provider-neutral six-dimension baseline; existing Security and Cost compatibility; the new Reliability, Performance, Operational Excellence, and Sustainability packs; the trimmed Azure/AWS/GCP overlay packs; multicloud behavior; organization-required packs; contextual recommendations; the selection UI; explicit exclusions; rule applicability; architecture generation; architecture review; scope disclosure; historical-record integrity; versioning; auditability; tenant isolation; accessibility; performance; tests; and documentation.

Be adversarial about: duplicate engines; Azure bias; hidden auto-selection; checkbox dark patterns; unbounded policy recommendations; every rule applying to every project; unsupported sustainability claims; duplicated cost and sustainability findings (including any surviving overlap between a neutral pack and an insufficiently trimmed overlay pack); AI hallucinating policy applicability; historical reviews appearing to have assessed new packs; review scope changing without a new version; narrow reviews appearing comprehensive; repeated or contradictory questions; generation and review using inconsistent scopes; exports disagreeing with source records; excessive database queries; broken migrations; and missing tests.

Write findings to `docs/architecture/architecture_quality_policy_final_audit.md`, ranked Critical/High/Medium/Low, each with evidence, affected files, user or governance impact, recommended correction, and required test.

Fix only Critical and High findings clearly supported by repository evidence. Do not perform speculative redesign. Run targeted tests and the broadest relevant test suite that is economically practical. Update the audit with disposition and test results, then provide a final verdict: Ready, Ready with documented limitations, or Not ready.

Stop after the audit, supported fixes, and test report.
```

---

## Deferred — not part of this initiative's phases

Per the assessment's §C.18 and the external review's own endorsement of that deferral list, do not build these now:

- **A unified assurance engine (Option C).** Revisit only if, after Phases 1–6 ship, the coverage layer and the pack layer prove to genuinely need merging.
- **Cross-dimension tradeoff and policy-conflict detection** (cost vs. reliability, security vs. performance, etc.). This was originally sketched as its own prompt (kept below for reference); it depends on real coverage data existing first, and building it early risks excessive policy questions and overapplication of generic rules.
- **LLM-driven (non-deterministic) pack recommendation.** Start table-driven (Phase 6); revisit only with real usage evidence.
- **Numeric carbon/emissions estimation** in the Sustainability pack.
- **Broad new framework-pack creation** beyond the four dimension packs, and any change to `ComplianceRulePackGovernanceFilter`, `PolicyPackPriorityFloor`, `EffectiveGovernanceResolver`'s core merge algorithm, or `TenantCuratedComplianceRulePackMerger`.
- **A fully ambitious contextual-recommendation system.** The repository does not yet have a sufficiently rich, persistent project-context model; Phase 6's engine is deliberately narrow and deterministic, using only facts already reliably captured today.

<details>
<summary>Reference — deferred tradeoff/conflict-handling prompt (do not run without an explicit owner decision to pick this up)</summary>

```text
Implement architecture-quality tradeoff and policy-conflict handling.

Do not build a broad optimization engine.

The purpose is to prevent ArchLucid from silently preferring one valid concern over another.

Examples include:

- reliability requiring redundancy while cost favors fewer resources;
- security controls adding latency;
- performance caching increasing data-retention or privacy concerns;
- global availability conflicting with data residency;
- sustainability favoring reduced replication while resilience favors greater replication;
- small AI models reducing resource use but failing required quality;
- operational simplicity conflicting with specialized performance optimization.

Requirements:

- Allow rules or findings to declare affected quality dimensions.
- Detect when applicable recommendations materially conflict.
- Create a traceable tradeoff item or decision requirement.
- Explain both sides neutrally.
- Identify missing evidence needed to decide.
- Identify the accountable decision owner where available.
- Do not automatically choose a winner unless an organization-required rule establishes precedence.
- Preserve policy precedence: law or mandatory organization requirement; approved organizational policy; project requirement; provider guidance; optional optimization.
- Do not create a tradeoff for every trivial tension.
- Deduplicate repeated manifestations of the same underlying decision.
- Make tradeoffs available during generation and review.
- Include unresolved material tradeoffs in final outputs.

Example output: "Reliability guidance supports multiregion deployment, while the approved cost constraint currently supports a single-region design. Recovery objectives, outage tolerance, and incremental cost evidence are required before this decision can be resolved."

Add tests covering: cost versus reliability; security versus performance; sustainability versus reliability; mandatory-policy precedence; no meaningful conflict; duplicate conflicts; and resolved versus unresolved decisions.

Report files and tests, then stop.
```

</details>

---

## Recommended execution order

Run Prompt 0 and review the assessment (already done) before any implementation. Then run Phases 1 through 7 in order, one phase at a time, one branch or commit per phase. Run a Phase 3 Azure/AWS/GCP overlay-content refresh only if that phase's work surfaces a specific, named content gap.

The most important adversarial safeguard is **historical truthfulness**: old reviews cannot suddenly appear to have assessed reliability, performance, operations, or sustainability merely because those dimensions later became the default. The second is **proportional applicability**: a six-dimension baseline must not turn every architecture into an exhaustive enterprise certification exercise.

[1]: https://www.anthropic.com/claude/sonnet "Claude Sonnet \ Anthropic"
[2]: https://cursor.com/pricing "Cursor · Pricing"
