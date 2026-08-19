> **Reviewed:** 2026-07-23
> **Scope:** Top-level, **living** foundational design record. This is the existential debate about *what ArchLucid is* — an architecture-review engine that must elicit intent, model trust as a spectrum, and be willing to say "no" with reasons. It is owner-and-AI co-authored and grows with increasing rigor over time.

> **Status:** Living debate log. **Not** a contract; when a position here hardens enough to bind the product, promote it to an **ADR** and/or **`docs/library/V1_SCOPE.md`** and link back here. Architecture-question tracking mirror: **`docs/library/SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md`** (**SAQ-013**).

> **Spine doc:** [`START_HERE.md`](START_HERE.md).

# ArchLucid Foundational Design Debate — What is an "architecture," and what will ArchLucid promise?

## 0. Why this document exists

This is **existential to ArchLucid**. The product claims to review software/cloud architectures, but "architecture" has no crisp boundary, and most users will not arrive with a clean specification. The questions debated here decide whether ArchLucid is a narrow UI-app reviewer or a general architecture-reasoning engine, what the minimum input is, how it expresses trust, and when it is allowed to tell a user "what you want cannot be done."

**Method note (read this first).** The owner contributes *wispy thoughts conveyed with increasing degrees of rigor*; the AI contributes *algorithmic structure, adversarial pressure-testing, and grounding in the actual codebase*. Convergence is deliberate and iterative — like rewriting a novel, we are explicitly **not** chasing a perfect first draft. Positions are recorded as they harden. Disagreements and open edges are kept visible on purpose.

**Authorship convention in this doc:**
- **[OWNER]** — an owner decision or assertion. Load-bearing; do not silently override.
- **[AI]** — an AI proposal or pressure-test, pending owner ratification.
- **[CONVERGED]** — owner and AI agree; candidate for promotion to ADR / scope.

---

## 1. The emerging thesis (what ArchLucid is becoming)

ArchLucid is **not** a tool that scores a finished design you hand it. It is an **intent-elicitation + constrained-feasibility engine**:

1. It **elicits** a designable intent from a user who may not speak "architecture," through Socratic questioning and proposed alternatives.
2. It **infers** the parts the user did not state, transparently labeling inference vs. user assertion.
3. It treats the design as a **constrained optimization**: maximize achievement of the user's stated business outcome, subject to invariants (the five Well-Architected pillars by default, plus any the user adds).
4. It is willing to return **"no feasible design"** — with the exact conflicting invariants — when the objective cannot be met within the constraints.

This reframes ArchLucid from "reviewer" to "**solver that can prove or assert infeasibility and explain why.**" That posture is the differentiator.

---

## 2. Resolved positions

### R1 — Every system has an interface; the only question is *who the user is*. [CONVERGED · 2026-06-07]

- **[OWNER]** "All systems have a user interface. The real question is how you define *user*." A user is **either a human or a machine**. ArchLucid does **not** care which for the purpose of admission, but it **must understand** which (human, machine, or both) because it changes the architecture.
- **[AI] Why it matters:** actor type parameterizes the dominant non-functional requirements. Human → latency-in-seconds, interactive authN (sessions/MFA), accessibility, consent/PII, bursty low volume. Machine → throughput/concurrency, service authN (mTLS/client-credentials), idempotency, retry/backoff, contract versioning, strict SLAs, no "UX."
- **[AI] Proposed extension (pending [OWNER]):** human/machine is one of **three** irreducible axes of the actor descriptor:

  **`(human | machine | both)` × `(internal | external | public/anonymous)` × `(sync request-response | async/batch | event | streaming)`**

  Trust origin is *not* derivable from human/machine (an employee and an anonymous visitor are both human but architecturally opposite). Interaction contract is *not* derivable either.
- **[AI] Scope-discipline rule:** when an actor is a machine, ArchLucid reviews **only up to the interaction contract** and treats the external system as a black box with a trust label — otherwise "review my system" recurses into "review everything it touches" and never terminates.

### R2 — Trust is a spectrum, not a gate; the five pillars are the default invariant set. [CONVERGED · 2026-06-07]

- **[OWNER]** "Trust is not absolute. There are degrees of trust, modeled along architectural quality dimensions with degrees of certainty on a scale of 1 to 100. Certain minimum qualities must always be assessed. The **five pillars of a Well-Architected design always apply unless the user has explicitly chosen to ignore them.**"
- **[OWNER]** ArchLucid must **always vector on whether the design achieves the stated business outcome.** If it does not, assess the user's expressed invariants and determine whether relaxing some is acceptable. **It is OK to tell a user there is no solution, and to name the invariants.**
- **[AI] Reuse:** this *is* ArchLucid's existing weighted 1–100 quality model — applied to the *inferred* design, with **confidence per dimension**. No new scoring framework needed.
- **[AI] Framing:** objective = business outcome; constraints = five pillars (default) + user invariants; solver returns **feasible design** or **minimal unsatisfiable invariant set**.

### R3 — Minimum-to-admit ≠ minimum-to-trust. [CONVERGED · 2026-06-07]

Admitting an input (agreeing to reason about it) is a far lower bar than producing a trustworthy design. A UI + outcome gets a *plausible* design but hides the decisions that actually define an architecture (consistency, tenancy, scale, trust boundaries, regulation). **Everything beyond what the user asserted is rendered as a labeled assumption the user can correct — never as settled fact.**

### R4 — The business outcome is the single non-inferable *origin*, but ArchLucid may propose candidates. [CONVERGED · 2026-06-07]

- **[AI] Claim:** the business outcome is the objective function; if ArchLucid invents it, it optimizes for something the user never wanted. So it is the one input that must **originate** from the user.
- **[OWNER] Refinement (accepted):** ArchLucid **may ask clarifying questions and propose alternative/candidate outcomes** ("it looks like you want faster audit prep — yes/no/ask-another-question?"). The goal is **"good enough," not perfect** — like writing a novel through rewrites; the user iterates further once ArchLucid starts generating work product.
- **[OWNER] Question taxonomy:** ArchLucid must be explicit about which questions **MUST** be answered (objective is unscoreable without them) and which **SHOULD** be answered (refine confidence). It may, in principle, ask **thousands** of questions to resolve a complex problem (e.g., designing ArchLucid itself).
- **[OWNER] Liability stance:** "If ArchLucid gets it wrong, that is because the user got it wrong." Assumed persona: an **IT professional** who will pull in other IT professionals. Envisioned usage: **ArchLucid on a conference-room projector**, a business analyst mediating — *"ArchLucid wants to know if a three-second response time is OK. Yes, no, or respond with another question?"*
- **[AI] Conditional attached to the liability stance — [OWNER] RATIFIED · 2026-06-07:** "the user got it wrong" is only fair **if** ArchLucid was fully transparent about (a) what the user asserted, (b) what ArchLucid inferred, and (c) which MUST/SHOULD questions were skipped. If ArchLucid silently inferred the outcome and got it wrong, that is ArchLucid's fault. **The transparency record is therefore a MANDATORY output, not optional polish — it is the precondition that *earns* the liability stance.** A complete, visible assumption/Q-provenance trail must accompany every output, tying directly to existing provenance (TB-034) and claim-labeling (SAQ-011) work.

### R5 — Hard vs. soft infeasibility must be distinguished; classify hard only on a provable contradiction. [CONVERGED · 2026-06-07]

- **Hard infeasibility** — provable from a theorem or physical law (e.g., CAP: strong consistency + total availability + partition tolerance cannot coexist; speed-of-light inter-region RTT). **Confidence 100; cite the law.**
- **Soft infeasibility** — economic or empirical, not logical (e.g., "five-nines on $15/month"). **Confidence band + envelope; state the assumption and the cost of being wrong.**
- **[OWNER]-ratified asymmetry rule:** a **false-hard** (declaring "impossible" what is merely expensive) is the worse error — a confident *no* delivered with false authority, the exact false-rejection failure R6 optimizes against. A **false-soft** wastes money but leaves the human in control. **Therefore: classify as HARD only when there is a demonstrable contradiction or law; when uncertain, it is SOFT.** Hard is the narrow, high-burden category; soft is the default.
- Conflating the two destroys trust the first time someone *does* find a solution to a "soft" impossibility.
- Output of an over-constrained design should be the **minimal conflicting invariant set** (the "unsat core"), and where the conflict is threshold-based, the **envelope** ("X holds below scale T, breaks above it") — not a binary "relax something."
- **ArchLucid proposes relaxations; the human disposes.** Relaxing residency, availability, or cost targets is a business-risk decision the owner must own; the engine surfaces the trade-off and never silently relaxes.

### R6 — Soft infeasibility: fail open with a loud label. [CONVERGED · 2026-06-07]

- **[OWNER]** Fail open with a loud label is correct. Human-architect analogy: *"We want X." "It can't be done." "Why not?" Then people drop the idea or compromise.*
- **[OWNER] Success reframe:** as many as **~90% of users may get frustrated and abandon a session — and that is a big win.** They leave knowing the idea had no traction and **why**, so they stop wasting other humans' valuable time. ArchLucid may resolve in **ten minutes for ~$1 of GPU** what could otherwise cost ~$25k over weeks.
- **[OWNER] Non-target users:** people who put in garbage and call ArchLucid stupid are "the same people who think VS Code, Excel, or Azure is stupid. ArchLucid is not for them."
- **[AI] Guardrail attached (pending [OWNER]):** the failure mode to optimize against is **false rejection of real-but-inarticulate intent** (e.g., a non-native-English founder with a genuine system). Mitigation: the gate's default is **redirect, not refuse** — "I don't understand yet; here is exactly what I'd need." Trolls leave regardless; real users get a path.

### R7 — Question selection: deterministic-first, LLM as a *bounded selector*, converging via policy packs. [OWNER core + AI structure · 2026-06-07]

- **[OWNER]** "Assume **deterministic questions first**, with **LLM as a fallback**. There are **policy packs to help guide questions**. As the policy packs grow from user experience — and we use them to build **RAG** — the questions gradually become **less nondeterministic and more bounded**. An LLM with a policy pack has to decide which questions to ask, **but from a bounded set**."
- **[AI] The keystone reframe:** this demotes the LLM from **generator** (invents questions — hallucination-prone, ungradeable) to **selector/ranker over a curated candidate set** (verifiable — the chosen question is always a known-good one; gradeable in the golden cohort). This is the single most important safety property of the intake surface and the concrete answer to **O1** and a partial de-risk of **SAQ-008/SAQ-011**: the question surface becomes *more* deterministic with use, not less.
- **[AI] Proposed layered model (pending [OWNER]):**
  - **L0 — deterministic, universal:** the five pillars + the actor triple (R1) generate the universal **MUST** questions. No LLM.
  - **L1 — deterministic, pack-driven:** active/inferred policy packs contribute question sets (derivable from each pack's existing rule keys); selection by value-of-information ranking. No LLM.
  - **L2 — LLM bounded fallback:** only when L0–L1 are exhausted but the objective is still under-determined; the LLM **selects/phrases from the bounded corpus** (platform packs + k-anon aggregates via RAG) — it does **not** free-generate.
  - **L3 — learning flywheel:** useful L2 questions are logged → reviewed → **promoted** into packs (SemVer, no silent mutation) → become L1 deterministic. Nondeterminism decreases monotonically.
- **[AI] Cold-start is not empty:** seed L0/L1 from the five pillars' canonical questions and the **existing 23 bundled policy packs'** rule keys (each evaluation rule implies an elicitation question — "pack checks encryption at rest" ⇒ "Is data encrypted at rest?").
- **[AI] Termination becomes deterministic:** "done" = all **MUST** questions for the active pillars/packs are answered. The LLM never decides when to stop.
- **[AI] Hard guardrails on the flywheel:**
  - **Cross-tenant text wall (ADR 0031):** learning "from user experience" must flow through **curated platform packs** or **k-anonymized aggregates** — **never** raw cross-tenant Q&A reuse. (See O7.)
  - **Promotion discipline:** promoting a learned question into a pack follows the existing **"no silent row mutation / SemVer uplift"** policy-pack rule (`V1_DEFERRED.md` §6j) and requires review. (See O6.)

### R8 — A policy pack owns its questions. [CONVERGED · 2026-06-07]

- **[OWNER]** "Packs should own the questions."
- **[AI] Consequence:** the pack is promoted to a **first-class carrier of both evaluation rules and the elicitation questions that feed them**, with an explicit **question→rule mapping**, versioned together so the thing that *elicits* and the thing that *evaluates* cannot drift apart. This is a schema change (new pack fields + validation), not a side artifact referencing rule keys. Resolves **O8**.

### R9 — Promotion requires a human in the loop; that governance is *out of scope* for the ArchLucid runtime. [CONVERGED · 2026-06-07]

- **[OWNER]** "This is an unescapable problem. There **must** be a *human in the loop* to approve policy-pack alterations. **BUT** that is **not** a problem for the ArchLucid system to worry about."
- **[AI] Boundary captured:** ArchLucid (the runtime) provides only the **mechanism** — versioned promotion, **no silent row mutation**, SemVer uplift, auditable change (per `V1_DEFERRED.md` §6j). **Who** approves a learned question into the canon, and the **bias-review checklist**, live in an **operator/authoring governance process outside the running system**. The bias risks raised in old O6 (leading questions; one architect's house style ossifying as universal) remain real but are owned by that external human gate, not by ArchLucid's request pipeline. Resolves **O6**.

### R10 — Learning flows through k-anonymized aggregates only. [CONVERGED · 2026-06-07]

- **[OWNER]** "I am assuming **k-anonymized aggregate patterns**."
- **[AI] Confirmed against ADR 0031:** the L3 flywheel consumes **curated platform packs + k-anonymized aggregate patterns only**; raw cross-tenant question/answer reuse stays forbidden. Anything richer is a new ADR with data-processing-agreement consequences. Resolves **O7**.

### R11 — The actor descriptor is *inferred-then-confirmed*, as a *set* of triples. [CONVERGED · 2026-06-07]

- **[AI] proposal, [OWNER] ratified ("matches my intent with rigor"):**
  - **Never a blank form.** A blank 3-axis form (`type × trust-origin × contract`) silently violates R3/R6 — the naive user can't fill "async vs streaming," so the form is either abandoned or filled with noise. ArchLucid instead **infers the triple from the free-text intent and presents it as a pre-filled, labeled guess** the user confirms or corrects. The confirmation *is* the question (conference-room persona: "I'm assuming external humans making real-time requests — yes/no/more complicated?").
  - **Asserted-vs-inferred (R4) stays honest:** a confirmed triple is *asserted*; an unconfirmed-but-proceeded triple is *inferred* and carries lower confidence into scoring.
  - **Actors are a set, not a single triple.** Real systems have several actors (external human customer + internal ops human + machine webhook caller). ArchLucid must first infer *how many distinct actors* exist, then each one's axes. **Getting the count wrong is worse than getting an axis wrong** — a missed actor is an entire unassessed attack surface / trust boundary. So the highest-value confirmation question is often **"are there other kinds of users I'm missing?"** *before* refining any single actor's axes. Resolves **O2**.

### R12 — What-if branching reuses the Compare engine; a branch is a ceteris-paribus run. [CONVERGED · 2026-06-07]

- **[AI] proposal, [OWNER] ratified ("agree"):** The existing **Compare engine** (`AuthorityCompareService` / `ComparisonController`) diffs **two committed golden manifests** from **two existing runs** and emits structured deltas in exactly the sections a trade-off needs — Requirements, Topology, **Security**, **Cost**, Issues, **Assumptions**, Warnings, Decisions — plus an AI "major changes / tradeoffs" narrative. What-if branching **reuses this unchanged** rather than introducing a draft-diff primitive.
- **A branch is a *run*, not a new compare surface:** snapshot the parent draft → **override only the invariant(s) under test** → execute → new run + golden manifest → call `Compare(baseRun, branchRun)`.
- **Ceteris-paribus rule:** a branch inherits the parent's confirmed actors, outcome, and answered MUST questions and changes *one thing*; otherwise deltas aren't attributable and the comparison is meaningless. This makes **R5's envelope concrete** — "at 3s: feasible, cost X, these findings; at 5s: feasible, cost X−Δ, findings gone" — the Compare delta sections *are* the envelope.
- **Three ruled constraints:**
  1. **Gate:** a branch is comparable only once it clears the **same MUST-set / admission gate** as any run (Compare requires a committed golden manifest on both sides — no diffing half-elicited drafts).
  2. **Cost:** each branch is a **billable, full-pipeline run** (≈ the "$1 of GPU" figure). Branching must **surface its cost and be capped**, or it breaks the "ten minutes for a dollar" promise. Hands a thread to **O3**.
  3. **Provenance per branch (R4):** branches may differ in what was *inferred*; the existing **Assumptions-delta** section surfaces this divergence automatically.
- **Rejected alternative:** a draft-level diff engine comparing two mutable, manifest-less intent drafts — duplicates shipped functionality and diffs state too unstable to trust. Resolves **O4**.

### R13 — A reasoned "no" is the product; sell it as a seat license for a repeat professional. [CONVERGED · 2026-06-07]

- **[OWNER] core thesis:** "Rejected designs are good things." A definitive, well-reasoned **"no"** is valuable — the anti-gravity-machine builder *values* being told no by something credible. This is **counter-trained**: AIs learn from data humans feed them, and humans "document their successes far more than their failures," so an AI structurally **under-values the no** and over-values the yes.
- **[AI] extensions (converged):**
  - **Decision-as-product.** The deliverable is the *decision*, not the design. A "no" — with R5's unsat-core + envelope and R4's transparency trail — is a complete, first-class, often more-valuable product. The analyst leaves with "ArchLucid says no, here is the law it violates, here is what would change."
  - **Survivorship-bias moat.** Because the market and every naive LLM tool are trained on survivorship-biased data, competitors are optimized to say "yes, here's a design" (hallucinated feasibility). A *credible no* is differentiated and hard to copy — it requires the discipline (hard/soft, unsat-core, provenance) the market doesn't know to value. ArchLucid monetizes what the market **under-prices**.
  - **"No" ships as a dignified, exportable, cost-quantified artifact** — never an error page; the receipt quantifies *avoided* cost ("ten minutes, ~$1, vs ~$25k over weeks").
- **Pricing granularity — [OWNER] OVERRODE [AI]:** [AI] proposed *pay-per-session / per-verdict, not seats*. **[OWNER] corrected:** the typical user is **not** an anonymous one-shot dreamer but a **qualified repeat professional** — a senior developer, data-warehouse manager, or security SME with deep expertise in one dimension and general competence across others — who uses ArchLucid often and becomes the **org's hub** for design decisions. Others route problems through them, "the same way a business analyst approaches a DBA with specialized tools to work on a data model." ⇒ **Seat license for the expert operator**, not pay-per-session. (Also rejects [AI]'s per-question guardrail as moot.)
- **Reconciliation with R6 (captured to avoid a false contradiction):** R6's "90% bounce is a win" is **per-*idea/session*, not per-*person***. The seatholder is retained by the tool's value to their job; individual ideas are freely allowed to bounce — the high rejection rate is *why* the seat is worth holding. **License the hub (expert operators), not the spokes (downstream requesters)** — same as licensing DBAs, not everyone who asks a DBA for a data model. Resolves **O3**.
- **Persona-coherence note (reconciles R13 with R3/R7/R11 and SAQ-013) [CONVERGED · 2026-06-07]:** the Socratic intake was motivated by the *naive* user, yet the seatholder is a *qualified SME* — the opposite. These reconcile: **the Socratic loop serves the naive *requester* through the expert *operator*.** The senior dev / DBA-equivalent drives the tool; the business analyst or domain person who walks up to them supplies the raw, inarticulate intent. The elicitation machinery (R7, R11) is therefore not aimed at the seatholder — it is what lets the seatholder **absorb a vague request and convert it into a defensible yes/no.** Same hub-and-spoke shape as the pricing model.

---

## 3. Working conceptual model (current best synthesis)

```
                 ┌──────────────────────────────────────────────┐
   user intent → │  ELICIT (Socratic, MUST/SHOULD questions,     │
   (free text)   │          propose candidate outcomes)          │
                 └───────────────┬──────────────────────────────┘
                                 │  draft (mutable) — labeled: asserted vs inferred
                                 ▼
                 ┌──────────────────────────────────────────────┐
                 │  ADMIT?  identify ≥1 actor + ≥1 functional    │
                 │          outcome → else redirect (not refuse) │
                 └───────────────┬──────────────────────────────┘
                                 ▼
   objective  = business outcome (non-inferable origin; candidates allowed)
   constraints= 5 Well-Architected pillars (default) + user invariants
   actors     = (human|machine|both) × (internal|external|public) × (sync|async|event|streaming)
                                 │
                                 ▼
                 ┌──────────────────────────────────────────────┐
                 │  SOLVE / SCORE  (1–100 per dimension,         │
                 │                  confidence per dimension)    │
                 └───────────────┬──────────────────────────────┘
                                 ▼
        feasible ───────────────► design + scored manifest (assumptions labeled)
        infeasible ─────────────► minimal conflicting invariant set
                                  + hard/soft label + envelope
                                  → human chooses to relax or stop
```

---

## 4. Open questions (live debate)

- **O1 — Question selection & termination.** *[Largely resolved by R7.]* Order = value-of-information ranking within the bounded set; stopping = all MUST questions for active pillars/packs answered (deterministic). LLM is a bounded selector, not a generator. **Remaining sub-question:** the precise VoI ranking function (deterministic policy) and when the LLM is allowed to break ties / handle novelty within L2.
- **O2 — Where exactly is the actor descriptor confirmed?** *[Resolved → R11.]* Infer-then-confirm a *set* of actor triples; the count of distinct actors is inferred first, and "are there other users I'm missing?" is the highest-value confirmation.
- **O3 — Monetization consequence of "90% bounce is a win."** *[Resolved → R13.]* The reasoned "no" is the product (decision-as-product + survivorship-bias moat); pricing is a **seat license for the repeat expert operator** (hub-and-spoke), not pay-per-session. R6's bounce is per-idea, not per-person.
- **O4 — What-if branching.** *[Resolved → R12.]* A what-if is a ceteris-paribus run spawned from a parent-draft snapshot; comparison reuses the existing Compare engine unchanged; branches must clear the MUST-gate and are explicit, capped, billable runs.
- **O5 — Ratify R5 (hard/soft infeasibility) and the R4 transparency conditional.** *[Resolved → R5 + R4.]* Owner ratified both: hard requires a provable contradiction/law (else soft); the asserted/inferred/skipped transparency trail is a mandatory output.
- **O6 — Promotion-gate integrity & question bias.** *[Resolved → R9.]* Human-in-the-loop approval is mandatory but lives **outside** the ArchLucid runtime; the system provides only versioned, non-silent, auditable promotion.
- **O7 — Cross-tenant learning wall ratification.** *[Resolved → R10.]* k-anonymized aggregates + curated platform packs only; raw cross-tenant Q&A reuse forbidden (ADR 0031).
- **O8 — Policy-pack schema extension.** *[Resolved → R8.]* Packs own their questions as a first-class artifact with a question→rule mapping.

---

## 5. Cross-references

### Resolved positions → ADRs (Proposed, 2026-06-07)

The hardened positions were promoted to ADRs under `docs/architecture/adrs/` (all **Status: Proposed**):

| Position(s) | ADR |
| --- | --- |
| R3, R7, R11 (intake/draft lifecycle) | [0048 — Socratic intake: mutable draft-request lifecycle](architecture/adrs/0048-socratic-intake-mutable-draft-lifecycle.md) |
| R1, R11 (actor model) | [0049 — Actor descriptor model](architecture/adrs/0049-actor-descriptor-model.md) |
| R4, R5, R6 (feasibility + transparency) | [0050 — Feasibility classification + transparency trail](architecture/adrs/0050-feasibility-classification-transparency-trail.md) |
| R7–R10 (question engine) | [0051 — Question selection engine](architecture/adrs/0051-question-selection-engine.md) |
| R6, R13 (monetization) | [0052 — Monetization posture: decision-as-product](architecture/adrs/0052-monetization-posture-decision-as-product.md) |

*This debate doc remains the living rationale; the ADRs are the binding extracts. O1-remainder (the VoI ranking function) is explicitly carried as OPEN in ADR 0051.*

- **`docs/library/SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md`** — **SAQ-013** (Socratic intake gap; the three fundamental additions: pre-run reasoning surface, mutable draft lifecycle, semantic admission gate).
- **`docs/library/V1_SCOPE.md`** — current shipped contract (single-shot `POST /v1/architecture/request`; `AskService` is post-hoc / manifest-anchored).
- **`ArchLucid.Contracts/Requests/ArchitectureRequest.cs`** — the request fields the elicited intent must ultimately populate.
- **Golden-cohort harness** — `scripts/ci/eval_agent_corpus.py`, `tests/golden-cohort/expected.json` (seeded with an out-of-domain example to anchor admit/redirect/reject behavior).
- Assessment dimensions (1–100 weighted model) — `docs/assessments/latest_*.md` (local working copies).

---

## 6. Change log

| Date | Author | Change |
| --- | --- | --- |
| 2026-06-07 | Owner + AI (Opus) | Document created. Captured R1–R6 and O1–O5 from the foundational debate on intent elicitation, actor definition, trust-as-spectrum, business outcome as non-inferable origin, and fail-open-with-loud-label for soft infeasibility. |
| 2026-06-07 | Owner + AI (Opus) | Added **R7** (question selection: deterministic-first, LLM as bounded selector not generator, L0–L3 layered model, learning flywheel converging via policy packs). Marked **O1** largely resolved. Added **O6** (promotion-gate integrity & question bias), **O7** (cross-tenant learning wall ratification), **O8** (policy-pack schema extension to carry questions). |
| 2026-06-07 | Owner + AI (Opus) | Owner rulings resolved O6/O7/O8 → **R8** (packs own their questions), **R9** (human-in-the-loop promotion is mandatory but out of scope for the ArchLucid runtime; system provides only the versioned/auditable mechanism), **R10** (learning flows through k-anonymized aggregates + curated platform packs only). |
| 2026-06-07 | Owner + AI (Opus) | Owner ratified **R11** (actor descriptor is inferred-then-confirmed as a *set* of triples; actor count inferred first; "are there other users I'm missing?" is the highest-value confirmation). Resolves O2. |
| 2026-06-07 | Owner + AI (Opus) | Owner ratified **R5** (classify HARD only on a provable contradiction/law; uncertain ⇒ SOFT, per the false-hard-is-worse asymmetry) and the **R4 transparency conditional** (asserted/inferred/skipped trail is a mandatory output that earns the liability stance). Resolves O5. |
| 2026-06-07 | Owner + AI (Opus) | Owner ratified **R12** (what-if branching reuses the Compare engine unchanged; a branch is a ceteris-paribus run from a parent-draft snapshot, must clear the MUST-gate, and is an explicit/capped/billable run). Resolves O4. |
| 2026-06-07 | Owner + AI (Opus) | **R13** — owner thesis: a reasoned "no" is a valuable first-class product (AIs under-value it via survivorship bias). AI extensions converged: decision-as-product, survivorship-bias moat, "no" as cost-quantified artifact. **Owner overrode AI's per-session proposal → seat license for the repeat expert operator (hub-and-spoke; DBA-with-specialized-tools persona).** Reconciled with R6 (bounce is per-idea, not per-person). Resolves O3. |
| 2026-06-07 | Owner + AI (Opus) | Promoted hardened positions to **ADRs 0048–0052** (Status: Proposed): 0048 draft lifecycle (R3/R7/R11), 0049 actor model (R1/R11), 0050 feasibility + transparency trail (R4/R5/R6), 0051 question engine (R7–R10), 0052 monetization (R6/R13). O1-remainder carried as OPEN in ADR 0051. See §5 mapping. |
| 2026-06-08 | Owner + AI | **ADRs 0048–0052 → Accepted** after implementation: draft aggregate + lifecycle (Phase 2), actor/trail/question contracts (Phase 1), and deterministic L0/L1 question selection with pack-owned questions merged through effective governance (Phase 3). **L2 LLM selector + VoI ranking remain OPEN** (O1-remainder) and are blocked until golden-cohort calibration data exists. |
