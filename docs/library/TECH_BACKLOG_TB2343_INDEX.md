> **Scope:** Contributor-reference ΓÇö strengthen-reviews residual quality cluster **TB-2343**ΓÇô**TB-2352**. Merge into `TECH_BACKLOG.md` summary table + detail sections when that file is stable. Not a buyer or operator document.

# Strengthen reviews residual quality ΓÇö TB-2343ΓÇôTB-2352

**Opened:** 2026-08-17. Owner ask: strengthen reviews and architectures ΓÇö residual artifact quality after Done **TB-2282**ΓÇô**TB-2300** (structured brief, L0 MUST interviewer, analyzable evidence, title/decision naming, triage, impact preview, second-review reuse).

**Thesis:** Done **TB-2282**ΓÇô**TB-2300** raised intake gates and evidence classes, but engines still receive thin or mis-grounded graph inputs: unknown sentinels count as confirmed facts, actors stay as assumption strings, quality attributes lack typed failure-mode nodes, cost engines cannot fire without projected spend on constraint nodes, agent post-processors only dedupe topology, prior-package evidence drops semantic objects, and manifest Mermaid omits actors/requirements/decisions. This cluster closes the loop from structured brief ΓåÆ context graph ΓåÆ deterministic engines ΓåÆ committed package ΓåÆ diagram export ΓÇö without reopening first-session or artifact-capture waves.

**Do not reopen (closed strengthen-reviews / first-session loops):** **TB-2282**ΓÇô**TB-2300** (strengthen-reviews items 1ΓÇô7 ΓÇö Done 2026-08-14); **TB-2130**ΓÇô**TB-2139** (first-session ΓÇö Quick start remains first-run primary); **TB-2177** (directional forecast ΓÇö do not re-gate as a new forecast product). Do **not** duplicate ease-of-use chrome (**TB-2353**ΓÇô**TB-2362**) or composition-root follow-on (**TB-2333**ΓÇô**TB-2342**). Do **not** reopen Done **TB-2223** structural post-processor framework ΓÇö **TB-2349** extends grounding only.

**Ship order:** **TB-2343** (unknown sentinel gate) ΓåÆ **TB-2348** (projected spend on cost nodes) ΓåÆ **TB-2344** / **TB-2345** / **TB-2347** (actors, QA/failure modes, assumptions graph) ΓåÆ **TB-2346** (capability coverage gate) ΓåÆ **TB-2349** (agent post-processor brief grounding) ΓåÆ **TB-2350** (prior-package semantics) ΓåÆ **TB-2351** / **TB-2352** (Mermaid richness + closed-loop default package).

| ID | Title | Quality | Pri | Window | Size |
| --- | --- | --- | --- | --- | --- |
| TB-2343 | Unknown sentinel must not unlock review or become Requirement nodes | Trustworthiness | P2 | V1 | S |
| TB-2344 | Actor / trust-boundary axes into deterministic security engines | AI/Agent readiness | P2 | V1 | M |
| TB-2345 | Quality attributes and failure modes as typed nodes; RTO/RPO in availability theme | AI/Agent readiness | P2 | V1 | M |
| TB-2346 | Required capabilities gated and scored as topology coverage | AI/Agent readiness | P2 | V1 | M |
| TB-2347 | Confirmed assumptions materialize onto the context graph | Traceability | P2 | V1 | M |
| TB-2348 | Write projected-spend onto cost-constraint nodes so `CostBreachFindingEngine` can fire | Cost-effectiveness | P2 | V1 | M |
| TB-2349 | Agent structural post-processor grounds proposals to the structured brief | AI/Agent readiness | P2 | V1 | M |
| TB-2350 | Prior-package evidence keeps decisions, requirements, assumptions, actors | Trustworthiness | P2 | V1 | M |
| TB-2351 | Manifest Mermaid includes actors, trust, requirements, decisions | Explainability | P3 | V1.1 | L |
| TB-2352 | Closed-loop architecture intelligence strengthens the default committed package | AI/Agent readiness | P3 | V1.1 | L |

---

## TB-2343 ΓÇö Unknown sentinel must not unlock review or become Requirement nodes (P2) ΓÇö **V1**

**Window:** V1 ΓÇö Trustworthiness (draft readiness honesty).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2282** structured brief; `ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview` still satisfies readiness checks.

**Problem:** `ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview` (`"Unknown ΓÇö confirm before review"`) is the default projector output from `UniversalIntakeAnswerProjector` and empty brief fields. `ArchitectureDraftReviewReadinessValidator` treats populated structured-brief lists as complete even when every entry is the unknown sentinel, so **Start architecture review** unlocks while engines receive pseudo-confirmed constraints, assumptions, and quality attributes. Downstream projection can promote unknowns into requirement-like graph nodes.

**Approach:**

1. Treat the unknown sentinel as *absent* in `ArchitectureDraftReviewReadinessValidator` and client `architecture-draft-readiness.ts` ΓÇö same as empty strings.
2. Block review start when any structured-brief slot is only the sentinel; surface explicit blocker copy ("confirm or remove unknown placeholders").
3. Ensure `DraftRequestProjector` / graph materialization does not emit Requirement or Constraint nodes from sentinel values.

**Acceptance:** Unit tests: sentinel-only brief fails readiness; mixed sentinel + real constraint fails; `EnsureReviewReady` throws; graph projection contains no nodes sourced from sentinel strings.

**Out of scope:** Reopening **TB-2282** panel UX. L0 MUST interviewer (**TB-2283** Done). New unknown taxonomy beyond the existing sentinel constant.

**Peers:** `ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview`, `UniversalIntakeAnswerProjector`, `ArchitectureDraftReviewReadinessValidator`, `architecture-draft-readiness.ts`.

**Size estimate:** S.

---

## TB-2344 ΓÇö Actor / trust-boundary axes into deterministic security engines (P2) ΓÇö **V1**

**Window:** V1 ΓÇö AI/Agent readiness (security engine inputs).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after **TB-2282** actor editor on draft; engines still consume assumption strings instead of typed actor/trust nodes.

**Problem:** Draft `ActorSet` captures label, `ActorKind`, `TrustOrigin`, `InteractionContract`, and confidence, but security and trust-boundary finding engines primarily read free-text assumptions and topology heuristics. External actors, cross-trust data flows, and privileged human operators do not deterministically drive `IFindingEngine` evaluations ΓÇö violating "LLM proposes, graph verifies."

**Approach:**

1. Materialize draft actors onto the context graph as typed Actor / TrustBoundary nodes with the same axes captured in `ActorDescriptor`.
2. Wire deterministic security engines (trust-boundary, privileged-access, external-exposure classes) to read graph actor/trust edges ΓÇö not parallel assumption strings.
3. Preserve Done **TB-2223** post-processor framework; engines consume graph facts only.

**Acceptance:** Golden or structural eval fixtures show security engines firing on external actor + cross-boundary edge cases when actors are present; engines ignore duplicate assumption-string-only inputs when graph actors exist.

**Out of scope:** New policy packs. Buyer trust-center claims. SSO / IdP configuration (**TB-2334** composition cluster).

**Peers:** `ActorSet`, `ActorDescriptor`, `TrustOrigin`, `AgentProposalStructuralPostProcessor`, security `IFindingEngine` implementations.

**Size estimate:** M.

---

## TB-2345 ΓÇö Quality attributes and failure modes as typed nodes; RTO/RPO in availability theme (P2) ΓÇö **V1**

**Window:** V1 ΓÇö AI/Agent readiness (quality-attribute graph).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after **TB-2282** `QualityAttribute` string on structured brief and **TB-2283** L0 reliability questions.

**Problem:** Reliability targets (RTO/RPO, uptime) and failure modes live as unstructured brief strings or intake answers. Availability and resilience engines cannot score RTO/RPO against topology redundancy themes because there are no typed QualityAttribute / FailureMode nodes with numeric targets and theme linkage.

**Approach:**

1. Project structured-brief quality attributes and L0 reliability answers into typed graph nodes (QualityAttribute, FailureMode) with parsed numeric targets where present.
2. Map RTO/RPO into the availability theme map used by resilience/availability engines.
3. Keep free-text brief fields for human readability; engines read typed nodes only.

**Acceptance:** Structural tests: RTO 4 hours on brief produces availability-theme node with parsed target; failure mode entries link to components; availability engines consume theme map without re-parsing brief strings.

**Out of scope:** Reopening **TB-2177** forecast product. Operational runbook generation. SLA billing.

**Peers:** `ArchitectureDraftStructuredBrief.QualityAttribute`, `DraftIntakeQuestionKeys` reliability keys, availability/resilience engines.

**Size estimate:** M.

---

## TB-2346 ΓÇö Required capabilities gated and scored as topology coverage (P2) ΓÇö **V1**

**Window:** V1 ΓÇö AI/Agent readiness (capability coverage).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. `ArchitectureRequest.RequiredCapabilities` exists but is not gated or scored against topology coverage.

**Problem:** Required capabilities listed on the request or draft are not enforced as coverage obligations on the context graph. Reviews can finalize with missing authentication, audit, encryption, or observability capabilities even when `RequiredCapabilities` was explicitly asserted ΓÇö engines lack a deterministic coverage gate and score.

**Approach:**

1. Treat each required capability as a coverage obligation linked to topology/service nodes.
2. Add a deterministic coverage scorer (and optional review-start or finalize gate) that reports missing capabilities vs graph evidence.
3. Surface coverage score in operator review workspace (minimal ΓÇö blocker list only for V1).

**Acceptance:** Tests: request with `RequiredCapabilities = ["encryption-at-rest"]` fails coverage when graph lacks matching capability nodes; satisfied topology produces passing score; gate blocks finalize when configured as blocking.

**Out of scope:** Policy pack capability catalogs. Auto-remediation. Buyer capability marketing lists.

**Peers:** `ArchitectureRequest.RequiredCapabilities`, `ArchitectureRequestDraftService` suggestions, topology coverage engines.

**Size estimate:** M.

---

## TB-2347 ΓÇö Confirmed assumptions materialize onto the context graph (P2) ΓÇö **V1**

**Window:** V1 ΓÇö Traceability (assumptions connector).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after **TB-2282** `ConfirmedAssumptions` on structured brief.

**Problem:** Confirmed assumptions are stored on the draft brief and `ArchitectureRequest.Assumptions` but often never become first-class Assumption nodes on the context graph with provenance and Assumptions-connector edges to decisions/requirements. Downstream traceability, prior-package reuse, and engines treat assumptions as orphaned strings.

**Approach:**

1. On review start / graph build, materialize each confirmed assumption as an Assumption node with source = structured brief.
2. Wire Assumptions connector edges to related decisions, requirements, and actors where matcher heuristics allow.
3. Exclude unknown sentinel values (**TB-2343**).

**Acceptance:** Graph export includes Assumption nodes for each confirmed brief assumption; connector edges present in golden fixture; assumptions visible in review traceability surfaces that already list request assumptions.

**Out of scope:** Assumption challenge / disposition UX (**TB-2179** class). New assumption taxonomy. GTM traceability claims.

**Peers:** `ConfirmedAssumptions`, `ArchitectureRequest.Assumptions`, context graph Assumptions connector, **TB-2350** prior-package semantics.

**Size estimate:** M.

---

## TB-2348 ΓÇö Write projected-spend onto cost-constraint nodes so `CostBreachFindingEngine` can fire (P2) ΓÇö **V1**

**Window:** V1 ΓÇö Cost-effectiveness (cost engine inputs).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Ship early in cluster so cost engines can fire once graph nodes carry spend projections.

**Problem:** `CostBreachFindingEngine` and `CostConstraintFindingEngine` read `projectedImpactUsdLowerBound` / `projectedImpactUsdUpperBound` from graph node properties, but cost-constraint materialization from intake/draft does not write `projectedImpactUsd` (or bounds) onto constraint nodes. Cost breach findings rarely fire; what-if UI reads finding JSON instead of graph facts.

**Approach:**

1. When structured brief or L0 cost answers include numeric spend bounds, write `projectedImpactUsd` (and lower/upper bounds where applicable) onto cost-constraint graph nodes at projection time.
2. Align with `findings-what-if-analysis.ts` and `CostBreachFindingEngine` property keys.
3. Do not change buyer-facing cost copy or ROI exports.

**Acceptance:** `CostBreachFindingEngineTests`-class fixtures pass with brief-sourced bounds on nodes; what-if panel reads graph-backed findings; no constraint node with spend answer lacks projected properties.

**Out of scope:** Sponsor ROI summary math (**TB-2178**). FinOps integrations. Pricing model changes.

**Peers:** `CostBreachFindingEngine`, `CostConstraintFindingEngine`, `findings-what-if-analysis.ts`, L0 cost intake keys.

**Size estimate:** M.

---

## TB-2349 ΓÇö Agent structural post-processor grounds proposals to the structured brief (P2) ΓÇö **V1**

**Window:** V1 ΓÇö AI/Agent readiness (post-processor grounding).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Done **TB-2223** added deterministic structural post-processors; residual is brief grounding.

**Problem:** `AgentProposalStructuralPostProcessor.ApplyToResults` dedupes topology relationships and normalizes structural shapes but does not reconcile agent proposals against the structured brief (constraints, assumptions, quality attributes, actors). Agents can propose nodes that contradict confirmed brief facts or omit brief-mandated objects ΓÇö post-processor does not ground or strip conflicts.

**Approach:**

1. Extend `AgentProposalStructuralPostProcessor` (via **TB-2223** enricher path) to validate proposals against structured-brief objects: drop or flag nodes that contradict confirmed constraints; prefer brief sourced labels for actors/requirements.
2. Keep deterministic-only transforms ΓÇö no new LLM calls.
3. Log structural grounding drops for replay/debug.

**Acceptance:** Structural eval pairs (**TB-2225**) include brief-conflict cases; post-processor removes contradicting proposal nodes; golden cohort does not regress.

**Out of scope:** Reopening **TB-2223** framework design. Policy-pack agents. Closed-loop intelligence (**TB-2352**).

**Peers:** `AgentProposalStructuralPostProcessorEnricher`, `AgentProposalStructuralPostProcessor`, `agent-structural-eval-pairs.json`, **TB-2225**.

**Size estimate:** M.

---

## TB-2350 ΓÇö Prior-package evidence keeps decisions, requirements, assumptions, actors (P2) ΓÇö **V1**

**Window:** V1 ΓÇö Trustworthiness (second-review reuse).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2299**ΓÇô**TB-2300** second-review reuse + compare; prior-package inheritance may drop semantic objects.

**Problem:** Starting a review from a prior package (`second-review-prior-package.ts`, `FirstPilotIntakeWizard` prior-package inherited path) carries evidence files and brief text but may not preserve decisions, requirements, assumptions, and actors as structured objects on the new request/graph. Second reviews lose traceability and force engines to re-infer semantics already finalized in the prior package.

**Approach:**

1. Define prior-package evidence merge rules: copy decision, requirement, assumption, and actor objects from committed prior manifest/request onto the new draft/request with `priorRunId` provenance.
2. UI: prior-package inherited strip shows which semantic objects carried forward (`first-pilot-prior-package-inherited`).
3. Compare link (`compareToPriorPackageHref`) remains distinct from inheritance.

**Acceptance:** Integration test: second review from prior package retains actor count and assumption/decision nodes; graph diff vs empty second review shows inherited semantic objects; unknown sentinels not copied (**TB-2343**).

**Out of scope:** Compare-two-reviews UX (**TB-2299** Done). Impact preview (**TB-2298** Done). Template library.

**Peers:** `second-review-prior-package.ts`, `repeat-review-activation.ts`, `FirstPilotIntakeWizard`, Done **TB-2299**ΓÇô**TB-2300**.

**Size estimate:** M.

---

## TB-2351 ΓÇö Manifest Mermaid includes actors, trust, requirements, decisions (P3) ΓÇö **V1.1**

**Window:** V1.1 ΓÇö Explainability (diagram richness).

**Priority:** P3.

**Source:** Owner ask 2026-08-17. Manifest Mermaid today emphasizes topology; buyers and sponsors need trust and decision context on the diagram.

**Problem:** `ManifestsController` Mermaid export and `MarkdownArchitectureExportService` diagram generation focus on topology nodes and edges. Actors, trust boundaries, requirements, and decisions live in manifest JSON but do not appear in the default Mermaid diagram ΓÇö undermining explainability for reviews that already captured those objects (**TB-2282**, **TB-2344**ΓÇô**TB-2347**).

**Approach:**

1. Extend Mermaid builder to emit actor/trust-boundary subgraphs (or annotated lanes) plus requirement/decision nodes linked to topology.
2. Cap diagram complexity with toggles or truncation rules for large packages (V1.1 ΓÇö document limits).
3. Keep topology-only diagram available for legacy consumers via format flag or separate endpoint if needed.

**Acceptance:** Golden manifest fixture Mermaid contains actor and decision node declarations; export markdown package includes enriched diagram; OpenAPI diagram response documents new elements.

**Out of scope:** Diagram screenshot polish (**TB-1836**ΓÇô**TB-1865**). Interactive diagram editor. **TB-2358** Architecture Intelligence positioning.

**Peers:** `ManifestsController`, `MarkdownArchitectureExportService`, `DiagramResponse`, **TB-2344**ΓÇô**TB-2347** graph objects.

**Size estimate:** L.

---

## TB-2352 ΓÇö Closed-loop architecture intelligence strengthens the default committed package (P3) ΓÇö **V1.1**

**Window:** V1.1 ΓÇö AI/Agent readiness (closed-loop on golden default).

**Priority:** P3.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2241** (hid nav row) and open engine-quality cluster; golden default package should benefit from closed-loop reasoning.

**Problem:** Architecture Intelligence / closed-loop orchestration (`GoldenArchitectureTestRunner`, generation quality plan) can strengthen proposals in harness contexts but does not feed the default committed review package operators see after finalize. Engine quality improvements from **TB-2343**ΓÇô**TB-2350** still bypass the closed-loop path on the primary golden cohort package.

**Approach:**

1. Wire closed-loop architecture intelligence pass to run on the default committed package (or pre-finalize staging graph) with deterministic guardrails from **TB-2349**.
2. Keep route contextual-only (**TB-2241**); do not restore top-level nav product positioning (**TB-2358**).
3. Measure lift via golden-cohort structural eval pairs ΓÇö no buyer "autonomous architect" claims.

**Acceptance:** Default golden manifest structural eval scores improve or match baseline without policy-pack regressions; closed-loop job is optional/feature-flagged for non-golden tenants; Vitest/API tests cover flag-off behavior.

**Out of scope:** Un-hiding Architecture Intelligence nav. Buyer closed-loop marketing (**TB-2358**). Real-LLM golden CI promotion (**TB-138** owner secrets).

**Peers:** `GoldenArchitectureTestRunner`, `ArchitectureIntelligencePageClient`, **TB-2358**, `agent-structural-eval-pairs.json`, Done **TB-2241**.

**Size estimate:** L.
