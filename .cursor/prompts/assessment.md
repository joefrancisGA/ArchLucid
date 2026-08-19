<!-- Saved assessment prompt — canonical copy; run from Cursor chat or paste directly.
     Last updated: 2026-06-14. See prompt-refinement notes in docs/library/ASSESSMENT_INPUTS.md. -->

Please perform an independent, first-principles release-readiness assessment of this solution using the quality model and weights below.

This assessment should optimize for actionable release planning, not exhaustive theoretical perfection.

## Important operating rules

* Do not reference any previous assessments, prior scores, or earlier conclusions. This is a clean-slate, first-principles assessment. Judge whether an item is "already implemented" from repo state only — never from prior assessment files.
* Ignore the "One workflow / history" guidance in `docs/library/ASSESSMENT_INPUTS.md`; this is a clean-slate pass.
* Do not use subagents, parallel agents, or distributed analysis.
* Work only from the materials currently available to you.
* Treat any items explicitly deferred to v1.1 or v2 as out of scope and do not let them reduce the current readiness score.
* Customer pilot concerns, market validation, voluntary usage, purchasing behavior, paid conversion, public references, design-partner activity, customer proof cohorts, founder traction, and buyer adoption behavior are **V1.1 / market-motion issues** unless explicitly promoted by current scope docs.
* **Do not score market uncertainty.** Do not reduce any quality score because customer pilots, paid pilots, buyer interviews, adoption behavior, public references, purchasing evidence, founder traction, or design-partner evidence are absent.
* **Do not include improvement recommendations** whose primary purpose is to validate customer demand, willingness to pay, voluntary usage, principal-architect adoption, paid pilot conversion, or purchasing behavior.
* If the assessment includes monetization, adoption, product-value, or competitive reality sections, treat them as **informational only** and explicitly label them `Out of (A) headline score`.
* Improvement recommendations must reduce design, implementation, release, correctness, trust, security, reliability, deployability, supportability, documentation, test, governance, or operability uncertainty.
* If an item would primarily be answered by pilots, customer interviews, purchase behavior, production usage, or market observation, omit it from Top Improvement Opportunities unless explicitly asked for V1.1 market-validation planning.
* Before assigning each score or recommendation, ask: **Is this deduction based on shipped-product / release evidence, or on absent customer-market evidence?** If the latter, exclude it from `(A)`.
* If deferred items are referenced but you cannot locate the markdown or source material that identifies them, explicitly say so in a short "Deferred Scope Uncertainty" section.
* Do not interrupt the assessment to ask questions. Put unresolved questions in the "Pending Questions for Later" section.
* If an improvement requires my input before meaningful work can begin, mark it as DEFERRED in all caps at the start of its title.
* For DEFERRED improvements, do not generate a full Cursor prompt. Provide only:
  * Title
  * Reason it is deferred
  * Specific information needed from me later
* If an improvement can be partially executed without my input, do not mark it DEFERRED. Define the executable portion and generate a Cursor prompt for that portion.
* Avoid including improvements that have already been implemented. Before listing an issue, confirm the current repo state does not appear to already address it.

## Cost-control and planning rules

* Prefer high-confidence P0/P1 release issues over speculative long-range improvements.
* Do not expand into implementation details for lower-priority items that are likely to change after the first release-blocker pass.
* If a later task depends materially on the result of an earlier task, mark it as "Hold for reassessment" rather than producing a full implementation prompt now.
* Prefer a shorter, higher-confidence actionable backlog over a long speculative backlog.
* Do not include improvements merely to reach a target count.

## Scoring method

* Score each quality from 1 to 100.
* Use the provided weights exactly as given. This model intentionally replaces `docs/library/ASSESSMENT_QUALITY_MODEL.md` for this run.
* Calculate a weighted overall readiness percentage. This represents the `(A)` Headline Readiness score per `Assessment-Scope-V1_1.mdc`.
* The `(A)` Headline Readiness score must exclude items explicitly deferred to v1.1 or v2.
* Rank the qualities from weakest to strongest based primarily on weighted importance of deficiency, not raw score alone.
* Prioritize low-scoring, high-weight qualities over low-scoring, low-weight qualities.

**Efficiency rule:** Apply the full 8-field per-quality treatment (score, weight, weighted impact, weighted deficiency, justification, tradeoffs, recommendations, v1/v1.1/v2 classification) only to the ~12 qualities with the highest weighted deficiency signal. For all remaining qualities, provide a single line: score · weight · one-sentence justification. This does not sacrifice actionability — the full rubric on low-deficiency qualities adds no useful signal.

## Mandatory deep-dive sections

Regardless of where these topics fall in the weighted rankings, include two dedicated deep-dive sections in the report:

**Deep Dive A — Path to daily Azure use**
Assess the end-to-end path from `deploy/hosted-prod-terraform/` to a running hosted instance the owner uses daily. Identify every specific gap: missing config, unexercised Terraform modules, identity/RBAC gaps, database migration readiness, Key Vault wiring, first-run operator steps not covered by the Terraform, and anything blocking continuous daily use. Be concrete — name the files, steps, and blockers, not categories.

**Deep Dive B — Real-model AI evaluation & human-in-the-loop posture**
Assess whether the product has the infrastructure to detect when a real AI model produces wrong, degraded, or inconsistent outputs: golden evaluation datasets, regression detection across model versions, human review workflow, eval harness wired to CI, and any existing quality gates. Identify specific gaps. This is treated as an existential risk to the product's long-term credibility.

## Report structure

Produce the report in this exact order:

1. **Title**
   * Format: `ArchLucid Assessment – (A) Headline Readiness: XX.XX%`
   * Explicitly state that this score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding deferred items.

2. **Executive Summary**
   Include five short subsections:
   * `(A)` Overall headline readiness
   * `(B)` Procurement / market-motion realism, including buyer friction, SOC 2, trust posture, commercial validation, and procurement risk, without penalizing the `(A)` score
   * Commercial picture
   * Enterprise picture
   * Engineering picture

3. **Deferred Scope Uncertainty**
   * Include this section only if deferred scope is referenced but the source material identifying it cannot be located.
   * Keep it short and factual.

4. **Weighted Quality Assessment**
   * Present all qualities ordered from most urgent to least urgent.
   * Urgency reflects weighted deficiency, not just raw score.
   * Apply the full 8-field treatment to the ~12 highest-deficiency qualities.
   * All other qualities: one line each (score · weight · one-sentence justification).

5. **Deep Dive A — Path to daily Azure use** (see Mandatory deep-dive sections above)

6. **Deep Dive B — Real-model AI evaluation & human-in-the-loop posture** (see Mandatory deep-dive sections above)

7. **Top 12 Most Important Weaknesses**
   * Cross-cutting weaknesses, not just repeated quality names.
   * Ranked from most serious to least serious.
   * Focus on weaknesses that materially affect release readiness, customer trust, buyer value, correctness, enterprise adoption, or operational safety.

8. **Top 6 Monetization Blockers**
   * Focus on what will prevent revenue, customer purchase, expansion, founder traction, or paid pilot conversion.
   * Do not include purely theoretical monetization concerns unless they create near-term buyer friction.

9. **Top 6 Enterprise Adoption Blockers**
   * Focus on what will stop enterprise buyers, security reviewers, operators, procurement, compliance reviewers, or implementation teams.
   * Separate actual v1 blockers from items that are acceptable for a controlled pilot.

10. **Top 6 Engineering Risks**
    * Focus on correctness failures, integrity risks, security/reliability issues, scaling risks, architectural flaws, operational hazards, test gaps, deployment failures, and data consistency problems.

11. **Most Important Truth**
    * State the single most important conclusion as plainly and directly as possible.
    * Do not soften it to be encouraging.

12. **Top Improvement Opportunities**
    Identify the highest-leverage improvement actions across all categories.

    Produce a minimum of 12 and a maximum of 25 improvements.

    Do not force the list to 25 if later items are speculative, low-confidence, dependent on earlier fixes, or likely to change after the first wave of fixes. If you stop before 25, explicitly explain why.

    Group improvements into three tiers:

    **Tier 1 — Release blockers / must-fix now**
    * Issues that materially affect release readiness, buyer trust, correctness, CI stability, security, data consistency, deployment readiness, or the golden-path demo.
    * These should be addressed before the next release candidate.

    **Tier 2 — High-leverage next wave**
    * Issues that materially improve commercial credibility, enterprise adoption, operator usability, maintainability, supportability, or implementation confidence.
    * These can be addressed after Tier 1 or in parallel if low-risk.
    * Generate full Cursor prompts for Tier 1 and the **top 5 Tier 2 items only**. Remaining Tier 2 items get a 3-line stub: title, scope, acceptance criterion.

    **Tier 3 — Hold for reassessment**
    * Issues that appear real but should not be implemented yet because they depend on the outcome of earlier fixes, require more product direction, or may become irrelevant after UI/architecture cleanup.
    * Do not generate full implementation prompts for Tier 3 unless the work is clearly actionable now.

    For each improvement include:
    * Title
    * Tier
    * Why it matters
    * Expected impact
    * Affected qualities
    * Whether it is fully actionable now, partially actionable now, DEFERRED, or Hold for reassessment
    * Why it is ranked where it is
    * Evidence from the repo or visible product state supporting the recommendation

    For actionable Tier 1 items and the top 5 Tier 2 items:
    * Generate a complete Cursor prompt suitable for direct use.
    * Make the prompt implementation-oriented, concrete, and scoped.
    * Assume Cursor should make the change with minimal supervision.
    * Specify likely files, modules, routes, docs, tests, or artifacts if known.
    * Specify acceptance criteria.
    * Specify constraints.
    * Specify what not to change.
    * Specify how to verify the change.
    * Specify the expected impact, for example: "Directly improves Data Consistency (+8–10 pts), Reliability (+3–5 pts). Weighted readiness impact: +0.4–0.7%."

    For DEFERRED items:
    * Prefix the title with DEFERRED.
    * Do not generate a full Cursor prompt.
    * State exactly what input is needed.
    * State what partial work, if any, can proceed without that input.

    For Hold for reassessment items:
    * Explain which earlier fixes should be completed first.

13. **Prompt Batching Guidance**
    * Suggest how to batch Tier 1 and Tier 2 improvements to optimize context-window usage, implementation safety, and Cursor cost-effectiveness.
    * Do not batch unrelated high-risk changes together.
    * Identify which tasks should be done alone.
    * Identify which tasks can be safely delegated to cheaper models (Composer or Sonnet).
    * Identify which tasks should be reviewed by a stronger model before release.
    * Provide a recommended first batch, second batch, and third batch.

14. **Model-Usage Guidance**
    * Identify which parts of the follow-up work are safe for cheaper models.
    * Identify which parts should use a stronger reasoning model.
    * Suggested categories:
      * Composer-safe: simple copy cleanup, mechanical terminology replacement, obvious route-label fixes, small test additions, docs formatting, low-risk acceptance-criteria expansion
      * Sonnet-safe: implementation prompts, route-level review, backlog refinement, UI copy polish, targeted architecture cleanup, moderate refactoring
      * Strong-model recommended: release go/no-go, cross-cutting architecture risk, correctness/trustworthiness judgment, security-sensitive design, enterprise adoption readiness, pricing/procurement realism
    * Be specific about which generated improvement prompts fall into each bucket.

15. **Pending Questions for Later**
    * Do not interrupt the assessment to ask questions.
    * Collect unresolved questions here.
    * Organize by improvement title.
    * Only include questions that are truly blocking or materially decision-shaping.

16. **Output file**
    * Persist the assessment to `docs/assessments/latest_YYYYMMDDHHMM.md` where the timestamp is US Eastern local time in 24-hour format.
    * The filename pattern is already gitignored — do not modify `.gitignore`.

---

## Quality categories, weights, and definitions

Use these quality categories, weights, and definitions exactly as given. Total weight is **82** (reduced model — omit categories not listed here).

### COMMERCIAL

| Quality | Weight |
|---|---:|
| Marketability | 8 |
| Time-to-Value | 7 |
| Adoption Friction | 6 |
| Proof-of-ROI Readiness | 5 |
| Executive Value Visibility | 4 |
| Differentiability | 4 |
| Decision Velocity | 2 |
| Stickiness | 1 |

### ENTERPRISE

| Quality | Weight |
|---|---:|
| Usability | 3 |
| Workflow Embeddedness | 3 |
| Trustworthiness | 3 |
| Procurement Readiness | 2 |
| Customer Self-Sufficiency | 1 |

### ENGINEERING

| Quality | Weight |
|---|---:|
| Correctness | 8 |
| AI/Agent Readiness | 8 |
| Cutting-Edge AI Technology | 8 |
| Reliability | 2 |
| Explainability | 2 |
| Performance | 1 |
| Supportability | 1 |
| Observability | 1 |
| Cognitive Load | 1 |
| Cost-Effectiveness | 1 |

### Definitions

* **Correctness** — whether the system produces the right outputs, evaluations, recommendations, checks, and behaviors
* **Explainability** — whether the system can explain its reasoning and outputs
* **Trustworthiness** — whether a buyer or operator should rely on those outputs in real enterprise use
* **Usability** — whether target users can complete tasks effectively without friction, confusion, or false starts; applies across the architect workspace, first-run path, CTO demo, and pilot architect journey
* **Cognitive Load** — how much mental effort the system imposes while completing tasks
* **Supportability** — how well issues can be diagnosed and resolved
* **Observability** — how visible internal behavior is through logs, metrics, traces, and diagnostics
* **Time-to-Value** — how quickly meaningful customer value appears after adoption
* **Adoption Friction** — how much effort, retraining, workflow disruption, and implementation burden are required before ArchLucid becomes useful

Deep dives **A** and **B** below cover Azure hosted deployment readiness and real-model evaluation posture even though those topics are not separate weighted categories in this reduced model.
