> **Last reviewed:** 2026-09-23

> **Scope:** Verbatim record of an owner and agent conversation (2026-09-23) about an AI QA lecture, its implications for ArchLucid product strategy, proposed tech backlog items, and a V1 vs later-version placement recommendation. The proposed items are **not yet filed** in [`docs/library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md); the owner has not yet chosen placements.

# QA ideas — AI output as a claim, not a result

## Contents

1. [Turn 1 — The lecture and its strategic implications](#turn-1--the-lecture-and-its-strategic-implications)
2. [Turn 2 — Proposed tech backlog items](#turn-2--proposed-tech-backlog-items)
3. [Turn 3 — V1 vs subsequent version placement](#turn-3--v1-vs-subsequent-version-placement)
4. [Turn 4 — Recording request](#turn-4--recording-request)
5. [Turn 5 — Verification independence](#turn-5--verification-independence)
6. [Turn 6 — From chess engines to architecture engines](#turn-6--from-chess-engines-to-architecture-engines)

---
## Turn 1 — The lecture and its strategic implications

### Owner input

> what do you thin of it and how might iot change the strategy for the oproduct line?

### Owner-provided lecture

# AI QA Course — Lecture 1: Treat AI Output as a Claim, Not a Result

**Length:** about five minutes

When an AI system gives you an answer, the first question shouldn’t be, “Does this sound right?” It should be, “What evidence would show that this answer is right?”

That distinction is the foundation of AI quality assurance. AI can produce fluent, confident answers that are incomplete, unsupported, or wrong. A polished explanation is not proof. QA means checking the result against evidence and the purpose it is meant to serve.

## Start with the claim

Every AI output makes one or more claims. In a code review, it might claim that a change fixes a defect. In an architecture review, it might claim that a design meets a requirement or follows a policy.

Write down the important claim in a form that can be checked:

> “This change prevents a user in one tenant from accessing another tenant’s data.”

That is more useful than “The AI says the change is secure.” The first statement gives you something concrete to test.

## Define what would count as proof

Before accepting the answer, decide what evidence would support it. For the tenant-isolation claim, useful evidence might include:

* A test that tries to access another tenant’s record and confirms the request is denied.
* A test that confirms a user can still access records in their own tenant.
* Inspection of the authorization check at the relevant data-access boundary.

Each piece covers a different failure mode. A test that checks only the denied request might miss a change that blocks all users, including authorized ones.

## Look for counterexamples

A good QA process doesn’t merely seek examples where the answer works. It looks for conditions where it might fail.

For the tenant example, vary the user, tenant, workspace, project, and identifier. Try missing or mismatched scope values. Ask whether the check applies on every path that reads or changes the data—not just the path the AI happened to inspect.

This is similar to testing a chess move: you don’t evaluate it only by how attractive it looks. You consider the opponent’s strongest replies.

## Separate the AI’s explanation from the system’s behavior

An AI may explain why a fix should work. That explanation is useful for guiding review, but it is not an independent verification of the fix. The code, tests, runtime behavior, and authoritative requirements are separate sources of evidence.

A practical rule is:

> Use AI to propose and explain; use independent checks to verify.

“Independent” matters. If the same model generated the change and then judged its own work using the same assumptions, both steps can share the same blind spot. Add a different kind of check: deterministic tests, a separate reviewer, a policy rule, or an adversarial test case.

## Record the evidence and its limits

A QA conclusion should say what was checked and what it establishes. For example:

> “The cross-tenant access test is denied, and same-tenant access succeeds. This supports the tenant-isolation claim for the tested API path.”

That is stronger than “Looks good,” and more honest than claiming the whole system is secure. The test gives evidence about a defined path and set of conditions. It does not prove every possible path is safe.

## Takeaway

Treat every AI answer as a claim that needs evidence. State the claim, define a check, search for counterexamples, and report what the evidence actually covers.

**Small exercise:** Pick one AI-generated recommendation from your work. Write its central claim in one sentence, then name one check that could disprove it. That check is the beginning of a useful QA process.

### Agent output

The lecture is sound but not new. Its main value for ArchLucid is that it describes the product's existing thesis almost exactly, and it points to one weak spot. It supports the current strategy rather than calling for a change, but it offers a sharper way to express that strategy.

**Where ArchLucid already fits**

`docs/go-to-market/POSITIONING.md` already promises most of what the lecture teaches:

- **“Evidence-linked findings”** matches “treat output as a claim and define what would prove it.”
- **“Stated confidence limits”** and **“explicit non-conclusions where proof is missing”** match “record the evidence and its limits.”
- **The audit chain and signed manifest** match “record what was checked.”
- **The Architecture Proof Engine category** matches the contrast the lecture draws between polished prose and accountability.

This suggests the market is being taught the vocabulary ArchLucid sells into. If buyers take courses like this, they'll show up asking “how do you verify the AI?” That's the question the product is built to answer.

**The weak spot: independence**

The lecture's sharpest point is that if the same model produces an answer and then judges it, both steps can share the same blind spot. A skeptical buyer who has absorbed that will look at the `ExplainabilityTrace` and the aggregate explanation and ask whether that's the AI explaining itself. By the lecture's own standard, an explanation isn't verification.

So the strategic question is how much of each finding is verified by something other than the model. Examples would be deterministic policy-pack rules, checks against the extracted Azure or infrastructure-as-code (IaC) inventory, schema or configuration comparisons, and human approval. ArchLucid has pieces of this: policy packs, governance gates, segregation of duties, and the faithfulness/support-ratio and hallucination-defense work. It doesn't yet present them as a separate verification layer.

**How it could change the product line**

1. **Make the claim the unit, not the finding.** Each finding would carry one checkable claim, the evidence that would support it, who or what verified it, and a coverage statement.
2. **Show verification independence as a visible attribute.** For example: “7 of 12 findings are backed by a deterministic check or inventory match; 5 are model-only.” This answers the self-grading objection.
3. **Add a counterexample pass.** An adversarial step would try to disprove each high-severity finding and record what it tried.
4. **Consider a possible adjacent product line.** The method could apply to AI-generated code reviews, security recommendations, or compliance assertions. This should be a future option because it could dilute the architecture-package positioning.

**What not to do**

- Do not pivot or rebrand around AI QA; the advantage is having the discipline built into governed architecture packages.
- Keep the headline promise honest. “Defensible architecture, on demand” should be accompanied by coverage statements so “defensible” never reads as “proven safe.”

The lecture's tenant-isolation example also fits ArchLucid's engineering discipline. The “state the claim, name the check that could disprove it” habit could fit agent-shipped PR descriptions and `/al-bug` fix reports.

## Turn 2 — Proposed tech backlog items

### Owner input

> If I were to make tech backlog items from these ideas, what would you propose? Then I can tell you whether I want it now or in a future version.

### Agent output

Most of the lecture's ideas were already shipped on 2026-07-27, but as foundations. The proposals below are mostly the missing last steps rather than new systems.

**Already covered:** the two-axis provenance model (**TB-1984**, where a claim came from and how well it is supported), the five-stage evidence-validation pipeline (**TB-1981**), and the two-lane adversarial reviewer (**TB-1983**). All three shipped on 2026-07-27 as foundations. The critic pass is **TB-383**, the fail-closed provenance contract is **TB-1221**, and the finding verification loop is **TB-2033** through **TB-2037**.

The gaps identified were:

- Nothing records what kind of check verified a finding.
- Adversarial challenges state a falsification test, but nothing runs it.
- The two-axis provenance may not yet be surfaced throughout the main review package and exports.

### Proposed items

1. **Verifier-kind attribute on every finding** — P1, M. Add `VerifierKind` values for model self-check, independent model, deterministic rule or policy pack, inventory/IaC match, and human approval. Every decision-grade finding must have at least one explicit verifier entry.
2. **Package-level verification-independence summary** — P1, S, after item 1. Show deterministic, independently reviewed, and model-only counts in the package overview and DOCX/Markdown export. Never count model-only findings as verified.
3. **Execute falsification tests for adversarial challenges** — P1, L. Run deterministic probes where possible and record refuted, survived, not testable, or needs human input, with a trace.
4. **Per-finding evidence scope statement** — P1, M. Add `EvidenceScope` describing what was examined and what was not. Render it for high-severity findings and exports.
5. **Surface provenance and verification on the main review package** — P1, M, after items 1 and 4. Show origin, support, verifier, and scope in the main package and exports.
6. **Critic and escalation model independence** — P2, M. Configure and record separate engines for generation and critique where possible; same-engine checks must be labeled model self-check.
7. **“Independently verified” honesty CI** — P2, S. Add a buyer-copy guard beside **TB-1222** and **TB-1229**, allowing the claim only with qualifying verifier data or real pilot evidence.
8. **Claim-and-disproof discipline in agent ship reports** — P3, S. Require a claim, disproof check/result, and scope line in `/al-bug` and ship-loop reports.

**Existing item to reprioritize:** Promote **TB-2034** (finding-verification re-ingest and scoring) from P2 to P1; it is the strongest realization of checking sealed-package claims against later evidence. **TB-2035** through **TB-2037** depend on it.

## Turn 3 — V1 vs subsequent version placement

### Owner input

> which of these do you recommend for ArchLucid V1 and which for a subsequent version?

### Agent output

Very little of this should be added to V1. `docs/library/V1_SCOPE.md` describes V1 as the contract for the current codebase, “not a roadmap of net-new capabilities.” The foundations (**TB-1981**, **TB-1983**, **TB-1984**) are already in the V1.1 window.

### V1 — now

- **Item 7, “independently verified” honesty CI.** Guard against unsupported independent-verification claims; refine after verifier kinds exist.
- **Item 8, claim-and-disproof discipline in agent ship reports.** Internal process with no product-surface risk.

### V1.1 — “show your verification”

- **Item 1, verifier-kind field.** The keystone for items 2, 5, 6 and 7.
- **Item 2, package-level independence summary.** The buyer-visible payoff of item 1.
- **Item 5, provenance and verification on the main review package and exports.**
- **Item 4, per-finding evidence scope statement.**
- **TB-2034**, promoted from P2 to P1, unlocking **TB-2035** through **TB-2037**.

Suggested order: item 1 first; items 2 and 5 together; item 4 next. **TB-2034** can run in parallel.

### Subsequent version — V1.2 or later

- **Item 3, falsification-test/counterexample runner.** Largest item; depends on mature knowledge-model and inventory probes.
- **Item 6, critic and escalation model independence.** Carries cost and depends on model availability; item 1 should exist first so same-engine results can be labeled honestly.

If V1 remains open to new capability, item 1 is the one capability to pull forward because it is medium-sized and derived largely from existing pipeline data.

## Turn 4 — Recording requests

### Owner input

> as we are having this converation please record all of it - input and output - to QA_Ideas.md uinder docs\\architecture

### Agent action

Created `docs/architecture/QA_Ideas.md` and began the record.

### Owner input

> record this conversation to QA_Ideas.md under docs\\architecture

### Agent action

Updated `docs/architecture/QA_Ideas.md` with the transcript record.

### Owner input

> record this conversation to QA_Ideas.md under docs\\architecture

### Agent action

Updated this file with the full conversation to date.

### Owner input

> impement the two items you feel are approriate for V1 now and put the other ideas in the tech backlog for V2.

### Agent action

Implemented the two V1 recommendations:

1. Added `scripts/ci/check_independent_verification_honesty.py` with tests and registered it in `run_buyer_surface_strict_guards.py`.
2. Updated the `/al-bug` and `/ship-next-improvement` reporting templates to require a claim, a disproof check/result, and a scope statement.

Filed the remaining ideas as V2 backlog work:

- **TB-2402** verifier kind on decision-grade findings.
- **TB-2403** package verification-independence summary.
- **TB-2404** executable falsification tests for adversarial challenges.
- **TB-2405** per-finding evidence scope.
- **TB-2406** main review-package provenance and verification presentation.
- **TB-2407** independent critic/escalation engine identity.
- Existing **TB-2034** finding-verification loop was moved to the V2 window.

## Turn 5 — Verification independence

### Owner input

> Here are more OpenAI thoughts. What do you thionk of them and what Ideas could we apply to the product line:

### Owner-provided lecture

# AI QA Course — Lecture 2: Verification Independence

**Length:** about five minutes

In Lecture 1, we treated an AI output as a claim that needs evidence.

Now we face a harder question:

> Who, or what, is allowed to decide that the evidence actually supports the claim?

Suppose an AI system examines an Azure environment and reports:

> “Storage account production-data is accessible from the public internet.”

The system then generates an explanation:

> “The storage account permits public network access, so the finding is valid.”

That explanation may be correct. But it is still the model explaining its own conclusion. If the model misunderstood the configuration, used the wrong resource, or omitted an exception, its explanation may repeat the same mistake in more polished language.

Explanation improves transparency. It does not create independent verification.

## The self-grading problem

Imagine a student writes an answer, grades it, and then explains why the grade is correct. The student may be honest and capable, but all three outputs come from the same reasoning process.

AI systems have the same weakness. The original finding, its confidence score, and its explanation can share:

* The same missing evidence
* The same interpretation error
* The same prompt bias
* The same hallucinated fact
* The same failure to consider a counterexample

Running the same model again may improve reliability, but it does not guarantee independence. Even a second model may have similar training data and reasoning habits.

AI QA therefore needs to record both **support** and **independence**.

## Four useful verification sources

For ArchLucid, a claim can be checked by four broad sources.

| Verification source | Example | Relative independence |
| --- | --- | ---: |
| Model reasoning | A model concludes that public access is enabled | Low |
| Challenger analysis | Another model tries to disprove the conclusion | Moderate |
| Deterministic rule | A policy rule evaluates the configuration value | High |
| Authoritative evidence or human approval | Azure inventory confirms the value, or an accountable reviewer approves the conclusion | High |

These are not interchangeable.

A model can interpret ambiguous architecture intent better than a simple rule. A deterministic rule can establish an exact configuration fact without relying on model judgment. A human can resolve business context that neither one understands.

The strongest proof package combines them.

## Make the claim smaller than the finding

A single finding often contains several claims.

Consider:

> “This publicly accessible storage account creates a critical data-exposure risk and should immediately be restricted to private endpoints.”

That sentence contains at least four claims:

1. The storage account exists.
2. Public network access is enabled.
3. The account contains sensitive data.
4. Immediate restriction is the correct remediation.

Each claim needs different evidence.

The extracted Azure inventory may establish the first two. A data-classification source may establish the third. Business owners and architecture policy may be needed for the fourth.

If ArchLucid assigns one confidence score to the entire finding, uncertainty becomes hidden. A more defensible structure records each claim separately:

```text
Claim:
Public network access is enabled for production-data.

Supporting evidence:
Azure inventory snapshot, resource ID X, property publicNetworkAccess=Enabled.

Verification:
Deterministic policy rule AZ-STORAGE-014.

Coverage:
Verified for the captured resource configuration at 14:32 UTC.
Application-level authorization and network behavior were not tested.
```

This structure tells an auditor what is known, why it is known, and where the conclusion stops.

## Independence is an attribute, not a verdict

A finding should not simply be marked “verified.” Verification has degrees and sources.

For example:

* **Model-only:** The claim was inferred by the analysis model.
* **Model corroborated:** A second analysis reached the same conclusion.
* **Evidence matched:** The claim was checked against extracted inventory or IaC.
* **Rule verified:** A deterministic policy produced the same result.
* **Human approved:** An accountable reviewer accepted the claim and its stated limits.

This lets ArchLucid generate a package-level summary:

> 12 high-severity findings were reported. Seven were independently verified by deterministic rules or inventory matches. Three were corroborated by a challenger model. Two remain model-only and require review.

That statement is more meaningful than an average confidence score of 91 percent. It exposes the composition of the assurance.

## The challenger must try to defeat the claim

A second evaluator should not merely ask, “Is the first model correct?”

That encourages agreement.

Instead, give the challenger a specific mission:

> Find the strongest evidence that would make this claim false, overstated, or irrelevant.

For the storage finding, the challenger might ask:

* Does a network rule override the apparent public setting?
* Is the resource unused or empty?
* Is anonymous blob access disabled?
* Was the evidence taken from the correct subscription and tenant?
* Is the configuration snapshot current?
* Does another control reduce the stated severity?
* Would the proposed remediation interrupt a required service?

The challenger’s work should also be recorded. “Adversarially reviewed” means little unless the package shows what was tested and what evidence was available.

## Applying this to ArchLucid

ArchLucid already has many required components:

* Evidence-linked findings
* Policy packs
* Inventory extraction
* Governance gates
* Segregation of duties
* Confidence limits
* Explicit non-conclusions
* Faithfulness and hallucination defenses
* Signed manifests and audit history

The next conceptual step is to organize these as a visible verification layer.

Each claim should carry:

1. **Claim text**
2. **Evidence references**
3. **Verification source**
4. **Independence level**
5. **Counterexample attempts**
6. **Coverage boundary**
7. **Remaining uncertainty**

The architecture package can then answer a difficult buyer question directly:

> “How much of this report was verified by something other than the AI that produced it?”

That is a stronger assurance measure than fluency, confidence, or explanation quality.

## Engineering use inside ArchLucid

The same discipline can improve development.

An agent-generated pull request could contain:

```text
Claim:
This change prevents project-scoped records from being read through a
workspace-only query.

Disproof attempt:
Query with the correct tenant and workspace but a different project ID.

Evidence:
The negative test returns no record. The same-project control test succeeds.

Coverage:
Verified for the repository method and API path under test.
Other query paths were not evaluated.
```

This forces the coding agent to identify how its claim could fail. It also gives the human reviewer a concise verification target.

## Takeaway

AI QA becomes stronger when every conclusion reveals its verification lineage.

Ask four questions:

1. What exact claim is being made?
2. What evidence supports it?
3. Is that evidence evaluated independently of the model that made the claim?
4. What part of the claim remains unverified?

The goal is not to eliminate model judgment. The goal is to distinguish model judgment from independently established facts.

That distinction could become one of ArchLucid’s most defensible product capabilities:

> Every important claim shows its evidence, its verifier, its attempted counterexamples, and the boundary of what has actually been established.

### Agent output

This lecture strongly validates the direction we just implemented and backlogged. Most ideas map directly to existing V2 items rather than requiring a new product strategy.

The most important refinement is: verification should attach to individual claims, not entire findings.

## What is especially strong

- Separating support from independence is more useful than a single confidence score.
- Breaking compound findings into factual, contextual, risk, and remediation claims exposes where uncertainty actually exists.
- Challengers should attempt falsification rather than agreement.
- Package-level assurance composition is clearer than “91% confidence.”
- Coverage boundaries prevent a configuration observation from being presented as system-wide proof.

## Two corrections I would make

1. **Authoritative evidence and human approval are not equivalent.**  
   Inventory can establish a configuration fact. Human approval records accountability or disposition, but it does not prove the underlying fact. ArchLucid should preserve those as different verifier types.

2. **A second model is not automatically independent.**  
   Different engine identity, evidence, prompt mission, and execution trace increase independence. Simply rerunning the same model should remain labeled “model self-check” or “model corroboration,” not independent verification.

## Existing backlog alignment

The lecture maps almost exactly to the V2 work already filed:

- **TB-2402:** verifier source and independence classification
- **TB-2403:** package assurance-composition summary
- **TB-2404:** executable counterexample/falsification attempts
- **TB-2405:** evidence coverage boundaries
- **TB-2406:** expose verification lineage in packages and exports
- **TB-2407:** critic engine identity and genuine model independence
- **TB-2034:** later verification against subsequent real-world evidence

The V1 agent-report change also already implements the engineering example: claim, disproof check/result, and scope.

## Net-new product ideas

### 1. Atomic claim decomposition

This is the genuinely new idea missing from the current backlog.

A finding such as “public storage creates critical exposure and should use private endpoints” should decompose into:

- Resource existence
- Configuration fact
- Data-sensitivity assertion
- Risk interpretation
- Severity judgment
- Remediation recommendation

Each claim then receives its own evidence, verifier, coverage, and uncertainty. The finding becomes a composed conclusion rather than the smallest unit of truth.

I would add a V2 item:

**Compound finding → atomic claim graph (P1, L)**  
Require decision-grade findings to contain typed claims—fact, context, risk, severity, and remediation—with independent verification states. A finding cannot inherit “verified” merely because one factual subclaim was rule-verified.

### 2. Verification semantics contract

Define precisely what product labels mean:

- `Model inferred`
- `Model corroborated`
- `Evidence matched`
- `Rule established`
- `Human accepted`
- `Not independently checked`

This prevents “verified,” “approved,” and “supported” from becoming interchangeable marketing language.

### 3. Claim-sensitive assurance summaries

Avoid one package-wide verification percentage. Show composition by claim type:

- Configuration facts: 18/20 rule-established
- Business-context assertions: 4/9 human-confirmed
- Severity judgments: 6/12 independently challenged
- Remediations: 3/12 approved

That is substantially more honest and actionable than treating every claim as equivalent.

### 4. Challenge records as package artifacts

Record:

- Counterexample sought
- Evidence inspected
- Outcome
- Remaining uncertainty
- Challenger identity

“Adversarially reviewed” should never be a badge without this record.

## Product-line implication

Do not create a separate generic “AI QA” product yet. Make **verification lineage** a defining capability of the architecture package:

> Every decision-grade claim shows what established it, what attempted to disprove it, and where the evidence stops.

That strengthens the existing Architecture Proof Engine category without diluting ArchLucid into a horizontal AI-evaluation platform.

---

## Turn 6 — From chess engines to architecture engines

### Owner input

> Here is some analysis from Open AI. Tell me what you think of it and how we could use it for ArchLucid and SecureNow.

### Owner-provided analysis

The analysis proposes treating ArchLucid as an architecture search-and-evaluation engine rather than a rules engine that could eventually become complete. It uses chess-engine concepts as a design vocabulary:

- A multidimensional architecture evaluation function covering security, reliability, operability, cost, performance, maintainability, compliance, resilience, and governance.
- Candidate-analysis generation and move ordering so high-impact concerns receive more analysis than cosmetic issues.
- Alpha-beta-style pruning when deterministic controls establish that a branch cannot change the conclusion.
- Selective search extensions for privileged identity, internet exposure, regulated data, cross-region dependencies, and cascading failures.
- Architecture quiescence: continue investigating while high-severity dependencies, mitigations, or contradictions remain unresolved.
- Transposition tables as normalized architectural-state and reasoning caches.
- Architecture “opening books” for known patterns such as hub-spoke, AKS, landing zones, and multi-region workloads.
- Exact architectural “tablebases” for facts that can be determined without AI, such as public access, TLS policy, identity presence, key expiry, and regional redundancy.
- Architecture mutation tournaments and relative tests, such as ensuring that removing MFA cannot improve identity security.
- Elo-style longitudinal measurement, SPRT-style comparisons, and separate strength ratings for security tactics, reliability, governance, cost, and strategic architecture.
- Principal architectural improvement paths rather than isolated scores.
- Future what-if analysis for proposed architecture changes.
- Explicit uncertainty fields including severity, confidence, evidence completeness, search depth, contradictions, and unresolved dependencies.

The central recommendation is to measure whether each release makes the engine stronger, more efficient, and more useful, rather than treating passing software tests as evidence that architecture reasoning is complete.

### Agent response

This is a valuable engineering philosophy, but it should not become ArchLucid’s product claim. Chess has a decisive advantage that architecture does not: every game has a referee and a final result. Architecture “Elo” is meaningful only where deterministic checks or accountable human labels provide the result. A second AI judge alone would recreate the self-grading problem described in the verification-independence discussion above.

The strongest parts are selective analysis, exact facts before model judgment, relative mutation testing, uncertainty tracking, and ordered remediation. The weakest parts are:

1. **Pruning must be conservative.** A chess pruning error loses rating points; a security pruning error can miss a critical finding. Model confidence must never be the sole reason to discard a security branch. Any pruned or unexamined branch needs a coverage statement.
2. **Severity and confidence should not be multiplied into one priority.** A high-severity, low-confidence finding should receive deeper investigation, not disappear down the queue. Priority should preserve severity while using uncertainty as an analysis-extension signal.
3. **Mutation tests are dimension-specific.** Removing MFA should not improve identity security, but architecture changes can legitimately trade cost against resilience. Relative invariants should be stated per dimension.
4. **The product filter is incomplete.** Verification lineage, governance, audit history, and honest limitations may not improve search or evaluation directly, but they are central to the buyer value of ArchLucid.
5. **“Superhuman” and buyer-facing Elo claims should be avoided.** These concepts are useful for internal engineering trend measurement, not as unsupported marketing language.

### Application to ArchLucid and SecureNow

SecureNow already contains several foundations for this direction:

- Synthetic Azure worlds provide independently authored expected answers, analogous to exact tablebases.
- Metamorphic assurance checks that semantically irrelevant transformations do not change path ranking or cut points.
- Incremental invalidation recomputes the neighborhood affected by a snapshot change and carries forward unaffected paths.
- Cut-point analysis identifies high-leverage controls, which can become the first step in an ordered remediation path.
- The agent evaluation corpus, real-mode evaluation, nightly trend reports, and canary drift alerts provide a base for longitudinal strength measurement.
- Explicit insufficient-evidence states prevent uncertain evidence from being promoted to observed fact.

Recommended follow-on work:

1. **Directional SecureNow mutation tests.** Add cases where public ingress, permissive network rules, or privilege must not improve the security result, and where a private endpoint plus public access exposes a contradiction. Keep these test-only, synthetic, deterministic, and independent of production ranking logic.
2. **Independent path-count oracle.** For small synthetic worlds, exhaustively enumerate paths to a bounded depth and compare the count and materialized paths with the production enumerator. This is the architecture equivalent of chess perft and can expose pruning or deduplication defects.
3. **Head-to-head evaluation.** Run candidate and baseline prompts/models against identical scenarios and score deterministic wins, draws, and losses. Report separate results for topology, cost, compliance, and critic analysis. Treat the current corpus size as insufficient for strong statistical claims until expanded.
4. **Stable-conclusion gating.** Do not seal a decision-grade finding while a high-severity dependency, mitigation, contradiction, or evidence gap remains unresolved. Pair this with TB-2404 falsification execution and TB-2405 evidence-scope statements.
5. **Ordered remediation paths.** Apply the highest-leverage SecureNow cut point, recompute, and repeat to show how each proposed fix reduces the remaining attack paths.
6. **Adaptive depth and what-if planning later.** Extend analysis only for high-risk branches first, and eventually compare a proposed architecture state with the observed state to identify both improvements and newly introduced risks.

### Placement recommendation

- **Near term, test-only:** directional mutation tests and the bounded independent path-count oracle.
- **V1.1/V2:** head-to-head version comparisons, a larger evaluation corpus, stable-conclusion gating, and ordered remediation paths.
- **Later:** adaptive analysis depth and proposed-state what-if planning.

Deterministic reasoning may be cached when its inputs are unchanged. Model conclusions should not be reused casually: evidence can become stale, and any cache must be tenant-isolated and invalidated by evidence changes. The overall strategy should remain verification-first: use the chess analogy to improve search quality, not to imply that architecture has a single objectively perfect answer.

### Luna prompts for items 1 and 2

Paste-ready GPT-5.6 Luna prompts for the two near-term items:

- **SN-QA-01** directional mutation tests: [`.cursor/prompts/securenow-qa-01-directional-mutation.md`](../../.cursor/prompts/securenow-qa-01-directional-mutation.md)
- **SN-QA-02** independent path-count oracle: [`.cursor/prompts/securenow-qa-02-independent-path-count-oracle.md`](../../.cursor/prompts/securenow-qa-02-independent-path-count-oracle.md)

Index: [`SECURENOW_ENGINE_STRENGTH_LUNA_PROMPTS.md`](SECURENOW_ENGINE_STRENGTH_LUNA_PROMPTS.md). Paste one prompt per Luna session.