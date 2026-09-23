> **Last reviewed:** 2026-09-23

> **Scope:** Verbatim record of an owner and agent conversation (2026-09-23) about an AI QA lecture, its implications for ArchLucid product strategy, proposed tech backlog items, and a V1 vs later-version placement recommendation. The proposed items are **not yet filed** in [`docs/library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md); the owner has not yet chosen placements.

# QA ideas — AI output as a claim, not a result

## Contents

1. [Turn 1 — The lecture and its strategic implications](#turn-1--the-lecture-and-its-strategic-implications)
2. [Turn 2 — Proposed tech backlog items](#turn-2--proposed-tech-backlog-items)
3. [Turn 3 — V1 vs subsequent version placement](#turn-3--v1-vs-subsequent-version-placement)
4. [Turn 4 — Recording request](#turn-4--recording-request)

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