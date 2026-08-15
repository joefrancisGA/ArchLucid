> **Scope:** V1 design for **Risk & Tradeoffs** — a **review system that earns the right to be a recommendation system** (§0.3). Architectural risk analysis that leads with one screen, scrutinizes requirements as well as the design, treats explanation as the product, and is steered by **behavior change** while calibrated by **predictive validity** (§11.3). Two user-facing buckets on ArchLucid's outcome→evidence chain, rendered in the reader's decision currency. Not a generic GRC register, not a graph risk ontology, not a four-class taxonomy.
> **Status:** Design of record (rev 7, 2026-06-13). Supersedes rev 6 (behavior-change thesis, consequence translation), rev 5 (screen-first, explanation-as-product), rev 4 (two buckets), rev 3 (four-class), rev 2 (WAF-only), rev 1 (assumption ontology). Not yet an ADR or implementation commitment.
> **Related:** [`ARCHITECTURE_FLOWS.md`](../library/ARCHITECTURE_FLOWS.md), [`FINDING_ENGINE_OUTPUT_REFERENCE.md`](../library/FINDING_ENGINE_OUTPUT_REFERENCE.md), [`API_CONTRACTS.md`](../library/API_CONTRACTS.md), ADR 0048–0051 (Socratic intake / transparency trail), ADR 0035 (invariant catalog).

# Risk & Tradeoffs — analyzer component design

## 0. The product is one screen — and the reasoning behind it

Everything below is scaffolding for a single moment: an architect finishes a review and sees their design's hidden bets reflected back, with the one that **contradicts what they said they needed** called out in plain language — and the reasoning, the alternative, and *what would satisfy the requirement* one click away.

```
Review: Customer Portal Modernization                    ● Completed

Your architecture makes 4 tradeoffs. 1 conflicts with what you told us.

⚠  CONFLICT
   You chose a single region to save cost —
   but you required recovery within 1 hour.
   A single region can't meet a 1-hour RTO during a regional outage.
      You said:  "RTO = 1 hour"      You built:  single-region App Service
      [ see reasoning ]   [ what would satisfy this ]   [ is this requirement real? ]
      [ accept risk ]     [ change requirement ]

Tradeoffs you're making (you already acknowledged these):
   •  Scale-to-zero  →  slower cold start     (you accepted "best-effort latency")
   •  Private endpoints everywhere  →  higher operational burden
   •  Cosmos multi-region write  →  higher cost

Worth a look (AI-suggested, unverified):
   ◇  This migration depends on six business units changing behavior at once,
      but the adoption plan you described only covers one.
      [ why we think this ]
```

**The "holy crap" is not the conflict alone — it is the conflict plus the reasoning.** Architects trust reasoning, not conclusions (rev-5, §6). The conflict is the hook; `[ what would satisfy this ]` turns ArchLucid from critic into advisor; `[ is this requirement real? ]` is the admission that requirements are not ground truth (§5).

**What this product must prove (rev-7, the thesis).** Insight is not the goal — **improved outcomes are.** The bar that separates a documentation tool from a decision-support system is one sentence from a customer: *"We were going to proceed, but ArchLucid caught this and we changed course."* Rev 6 made **decision change** the sole north star; rev 7 corrects that — behavior change is the **leading commercial signal** (what you steer by), but **predictive validity** is the lagging truth signal (what you calibrate by). Case B — flagged, ignored, then failed exactly as predicted — is the strongest evidence of correctness, not a failure (§11.3). Finding contradictions is table stakes; influencing decisions *and being right about them* is the product.

**V1 demo core (what survives deleting three-fourths):**

1. Conflicting-tradeoff detection anchored to a stated requirement, **rendered for both reader (§0.2)**.
2. The screen above, with first-class explanation (reasoning + counterfactual).
3. One *grounded, non-obvious* suggested concern (the part that passes the principal gate, §11.2), within the signal-to-noise floor (§11.4).

### 0.1 When there is no conflict (rev-5 change)

The emotional peak is the conflict, but **the product cannot depend on finding one.** Most reviews will have zero. The steady-state value, present every time:

- **Articulated bets:** "here are the tradeoffs your design is making, and what each one costs you" — making the implicit explicit, even when nothing conflicts.
- **Named assumptions:** unacknowledged tradeoffs surfaced as "unvalidated assumptions your design depends on" (§3.2).
- **Requirement smells:** "3 of your requirements look unvalidated — confirm before we hold the design to them" (§5).
- **A clean assurance statement:** "we checked your design against your stated intent; nothing contradicts" is itself an audit/governance artifact.

Conflict is the peak; articulation + interrogation is the floor.

### 0.2 Two readers, one finding — the consequence-translation layer (rev-6 change)

Rev 5 calibrated everything around *"would a principal architect find this non-obvious?"* That optimizes for the **champion**, not the **buyer**. Architects get you in the door; CIOs, CTOs, governance boards, and risk officers sign. They value the same finding only when it is stated in **their decision currency**.

The fix is **not** a fabricated probability. "This creates a 70% chance of missing the delivery date" is exactly the invented precision rev 2–4 deleted — we will not put a made-up number on the screen. The fix is to render the *same evidence-backed finding* in the reader's consequence language:

| Reader | Same finding, their currency |
|--------|------------------------------|
| **Architect** | *"Adoption depends on six business units; the plan you described covers one."* (mechanism + evidence) |
| **Sponsor** | *"Adoption scope is ~6× what is resourced — a delivery-date and benefit-realization exposure on this initiative."* (consequence on schedule / cost / compliance, no invented probability) |

One detection, two renderings. The architect rendering carries the mechanism and evidence chain; the sponsor rendering carries the consequence to **schedule, cost, or compliance exposure**. Both link to the same evidence. The **governance packet** (§0.2, below) carries only evidence-backed items — an sponsor will not delay a project over an "AI-suggested, unverified" item, but will over a defensible conflict stated as a delivery risk.

**The sponsor form factor is a governance packet, not a dashboard (rev-7 change).** Most CIOs do not log into tools and consume findings — they consume **narratives**: program status, steering-committee summaries, escalations, risk registers. The architect consumes findings; the sponsor consumes the *slide the architect carries up*. So the consequence rendering does **not** become a separate sponsor login — it composes into **the steering-committee artifact the champion presents** (reusing `ExecutiveReviewPacketComposer`, which is already a *packet*, not a dashboard). This is a better-fitting and stickier form factor than an exec dashboard, and it makes the architect the hero in the governance meeting — which is precisely the relationship that drives renewal.

### 0.3 Review system or recommendation system — the funnel (rev-7, the product-identity question)

Across seven revisions the design kept drifting from *review* concepts (conflict, evidence, assurance) toward *recommendation* concepts (counterfactuals, alternatives, better decisions, behavior change). That drift is real, and the honest answer is not to pick one — **they are a funnel, and the order is load-bearing:**

> **ArchLucid is a review system that earns the right to be a recommendation system.**

- **The review engine is the trust substrate.** A conflict is a *verifiable contradiction* — provably right in the moment, defensible to an auditor. It is what ArchLucid can be *right* about.
- **The recommendation engine is the value surface.** "What would satisfy this requirement?" is where time, repeat usage, and willingness-to-pay concentrate. It is what customers come *back* for.
- **The recommendation inherits its credibility from the review.** A counterfactual grounded in *your specific evidence-anchored conflict* — "the alternative to your single-region-vs-RTO contradiction" — is defensible. Strip the conflict out and the same recommendation is generic chatbot advice: ungrounded, unverifiable, no moat.

So even if users eventually spend 80% of their time on recommendations and 20% on conflicts, the conflict is **not** "merely the doorway" — it is the grounding the recommendation borrows its trust from. The fatal mistake would be building the recommendation system *first* (no grounding, no track record, no moat) — exactly what a frontier-model competitor would do, and why they would lose in regulated markets. **Detection is what you can be provably right about; recommendation is a judgment you can only be probably right about.** Build the provable thing first.

**Design implication (binding on V1):** architect the recommendation engine as a **first-class extension point, not a bolt-on.** The counterfactual contract (`CounterfactualRef`, §3.1) and data model must let V1's *closed-form* counterfactuals (§6.1) grow into ranked, grounded, eventually conversational remediation **without rework**. Name the destination — *grounded architecture recommendation* — put it on the wall; build only the review-plus-closed-form-counterfactual wedge in V1.

---

## 1. Two buckets, not four classes

Users see **two** things. The old A/B/C/D classes are **internal source metadata**, never a taxonomy the buyer must learn.

| User sees | Trust | What it is | Where its value comes from (rev-6) |
|-----------|-------|------------|-----------------------------------|
| **Evidence-backed risks** | High — the moat | Anchored to a stated requirement, manifest element, finding, or captured outcome (conflicts, unacknowledged assumptions, optimization mismatch, requirement smells) | **Consistent enforcement** — caught *every time*, across every review. Obvious is fine, even desirable. |
| **Suggested concerns** | Lower — the hook | Grounded AI judgment relating ≥2 held facts, passing the quality gate (§4); labeled "AI-suggested, unverified" | **Non-obviousness** — an obvious AI concern is noise. The quality gate applies here, *only* here. |

### 1.1 The strategic balance (kept from rev 4)

- **Suggested concerns are the value ceiling** (the hook). Invest in quality (§4); surface prominently, labeled. Do not bury.
- **Evidence-backed risks are the trust floor / moat.** A concerns-only product is GPT-with-file-upload — no defensibility.
- **Lead with the concern, defend with the evidence. Drop either and you lose.**

### 1.1a Enforcement of the obvious is the product, not a consolation prize (rev-6 change)

Rev 5 over-rotated on *non-obvious*, then mis-applied it to **everything**. The correction: non-obviousness is a gate for **concerns**, not for the evidence-backed core. Organizations fail *obvious* tests every day — single-region vs 1-hour RTO, five-nines with no DR budget, MFA rollout with no adoption plan. The value of the deterministic core is **not** rare genius; it is **catching the boring mistake every single time, at scale, with a defensible record.** That is more buyable than insight: it is predictable, automatable, and governance-shaped.

So the two buckets are validated by **two different criteria** (§11): the evidence-backed core by **coverage** (does it catch the known mistakes without misses?), suggested concerns by **non-obviousness** (does it surface something a principal didn't?). Optimizing the core for "surprise" would be a mistake — its job is *repeatability*.

### 1.2 Ordering without scores — consequence-led, reversibility as tiebreaker (rev-6 change)

Rev 5 ranked reversibility *above* consequence. That was wrong: a **reversible-but-catastrophic** choice must outrank a **one-way-but-moderate** one — consequence dominates. Reversibility is a real signal, but it is a *secondary* discriminator among items of comparable consequence, not the primary axis. Corrected lexicographic default:

1. **Hard conflict with stated intent** (a contradiction) before a silent bet before an acknowledged tradeoff.
2. **Consequence** (`High | Medium | Low`) — a catastrophic outcome ranks high whether or not it is reversible.
3. **Reversibility / blast-radius** — among comparable consequences, the "one-way door" (foundational, expensive-to-undo, high dependency fan-in) outranks the swappable one. Fix the irreversible-moderate before the reversible-moderate.

**Any fixed order embeds a philosophy** (the rev-5 reversibility-first ordering quietly imported a "one-way doors first" worldview that is not universal). The defense is **transparency, not a better fixed order**: consequence and reversibility are shown as *separate, visible dimensions*, and the architect can **re-sort by either**. The default reflects "catastrophe first"; the user is never locked into our worldview. Plus an **`Unknown`** state for *undisclosed* items (we don't know because nobody told us) — distinct from a judgment. No numbers anywhere.

### 1.3 The invariant (survives every revision)

Every item cites evidence ArchLucid holds — a stated requirement, finding id, graph node id, intake answer, or captured business outcome. **Suggested concerns are visibly lower-trust and never enter a governance-packet / board-level count** (§0.2). This is the line between ArchLucid risk and a generic LLM summary.

---

## 2. Decision log

| # | Decision | Choice |
|---|----------|--------|
| 1 | Centerpiece | **Conflict + reasoning** on one screen (not a register) |
| 2 | User-facing model | **Two buckets**; A/B/C/D are internal metadata |
| 3 | Scoring | **No numeric score.** Order by conflict → **consequence → reversibility** (rev-6 corrected); dimensions visible + re-sortable; `Unknown` for undisclosed |
| 4 | Tradeoff detection | **Deterministic-first**; LLM explains |
| 5 | Tradeoff framing | **Azure Well-Architected** (a lens, not the ontology) |
| 6 | Assumptions | **Embraced as vocabulary** — unacknowledged tradeoff = "unvalidated assumption your design depends on." Light detection, no ontology |
| 7 | Outcome alignment | Orphaned outcome → intake clarification *question*; only *optimization mismatch* is a risk |
| 8 | Suggested concerns | **Primary value (hook)**, surfaced prominently but labeled; grounded (≥2 relations) **and quality-gated** (specific + non-obvious) |
| 9 | **Requirements** | **Scrutinized as evidence, not trusted as truth** — requirement smells, **raised once and dismissible** (rev-6); posture is question, not assertion |
| 10 | **Explanation / counterfactual** | **First-class — likely the long-term center of gravity** (rev-6). V1 ships catalog-grounded options; full remediation advisory deferred (liability) |
| 11 | **Value model** | **Evidence-backed = consistent enforcement of the obvious; concerns = non-obvious** (rev-6). Two buckets, two validation criteria |
| 12 | **Buyer output** | **Consequence-translation layer** (rev-6) — same finding, rendered in architect detail vs sponsor decision currency; no fabricated probability |
| 13 | Durability | Immutable per-run snapshot (delta/audit/export); mutable lifecycle deferred |
| 14 | Defensibility | **Judgment is the value; provenance + flywheel is the durable, deployable moat** (rev-6 refinement) — judgment commoditizes, grounding/audit/flywheel do not |
| 15 | Positioning | Unit assured is the architectural **decision**; **design for generalization, ship narrow** |
| 16 | Naming / UX | "Risk & Tradeoffs"; plain language; **governance packet** (not exec dashboard) = evidence-backed only |
| 17 | Validation | **Gates** (rev-7): coverage (core) · principal (concerns) · sponsor/behavior-change · **signal-to-noise/dismiss-rate** (§11) |
| 18 | **Metrics** | **Two decoupled** (rev-7): **behavior change** steers (commercial, never trains the model); **predictive validity** calibrates (feeds the flywheel). Ignored-but-correct (Case B) is first-class |
| 19 | **Product identity** | **Review system that earns the right to be a recommendation system** (rev-7) — review = trust substrate; recommendation = value surface; build recommendation as an extension point |
| 20 | **Sponsor form factor** | **Governance packet, not dashboard** (rev-7) — the slide the architect carries into the steering committee (reuse `ExecutiveReviewPacketComposer`) |
| 21 | **Post-deployment trust** | **Earned by being right over time** (rev-7) — visible per-bucket track record + per-tenant calibration + fail-quiet; burden sits on judgment items only (conflicts are verifiable) |
| 22 | **Counterfactual scope** | **Closed-form, not conversational** in V1 (rev-7) — one question, catalog-bounded; no "why not B?" loop |
| 23 | **Moat strategy** | **Wedge-to-moat conversion** (rev-7) — judgment is the wedge, governance embedding is the moat; build system-of-record early; cold-start is the risk |
| 24 | Deferred | 2026 external layer · graph ontology · mutable lifecycle · numeric likelihood/heatmaps/uncertainty axis · AWS/GCP framing · the source PM model as-is · broad decision-assurance repositioning · full remediation advisory · **conversational counterfactual advisor** |
| 25 | **Next step** | **Pilot, not revision** (rev-7) — ship §0 demo core, instrument metrics, run §11 gates on real architectures; design stops at §18 |

---

## 3. Evidence-backed risks

### 3.1 Conflicting tradeoffs (the V1 core)

A tradeoff strengthens one WAF pillar at the expense of another. The risk is whether the sacrifice was acknowledged and whether it **conflicts with a stated requirement**.

```csharp
// ArchLucid.Contracts/Risk/ArchitectureTradeoff.cs (proposed)
public sealed class ArchitectureTradeoff
{
    public string TradeoffId { get; set; } = Guid.NewGuid().ToString("N");
    public WafPillar GainedPillar { get; set; }
    public WafPillar SacrificedPillar { get; set; }
    public string Mechanism { get; set; } = null!;          // from WAF catalog
    public List<string> EvidenceNodeIds { get; set; } = [];
    public List<string> EvidenceFindingIds { get; set; } = [];
    public string? AcknowledgedByAnswerKey { get; set; }    // L0 pillar answer accepting the sacrifice
    public string? ConflictingRequirementId { get; set; }   // stated requirement violated
    public string? RelatedOutcomeRef { get; set; }          // when it is an optimization mismatch (§3.3)
    public TradeoffStatus Status { get; set; }
    public RiskConsequence Consequence { get; set; }
    public ReversibilityClass Reversibility { get; set; }   // ordering input (§1.2)
    public string? CounterfactualRef { get; set; }          // what would satisfy the requirement (§6)
}

public enum WafPillar { Reliability, Security, Cost, Operations, Performance }
public enum TradeoffStatus { Acknowledged, Unacknowledged, Conflicting }
public enum RiskConsequence { Low, Medium, High }
public enum ReversibilityClass { Reversible, Costly, OneWayDoor }
```

| Status | Meaning | Treatment |
|--------|---------|-----------|
| **Conflicting** | Sacrifice contradicts a *stated* requirement | **The ⚠ line — the V1 headline** |
| **Unacknowledged** | Real sacrifice, no intake answer accepting/requiring it | **= "an unvalidated assumption your design depends on"** (§3.2) |
| **Acknowledged** | Matches an intake answer | Shown as an articulated bet, not flagged |

### 3.2 Assumptions, named openly (kept from rev 4)

An **unacknowledged tradeoff is an unvalidated assumption the design depends on.** Assumptions are fundamental — the model kept re-deriving them across revisions; rev 1 was wrong to fight the word, only wrong to build a heavy ontology. V1 keeps the concept and vocabulary with lightweight detection (a tradeoff with no acknowledging answer) — no nodes, edges, or lifecycle. Assumptions also live in requirements (§5).

### 3.3 Optimization mismatch (kept from rev 4)

Orphaned outcome (outcome with no traceable design element) → **intake clarification question**, not a risk (it is usually a documentation gap). Only **optimization mismatch** — the design's dominant tradeoffs optimize *against* the stated outcome — is an evidence-backed risk, represented as a tradeoff with `RelatedOutcomeRef` set.

### 3.4 Seed catalog (Azure WAF — bounded 5×4, kept)

At most 20 directed pillar pairs with concrete mechanisms — cannot sprawl into a checklist.

| Gained → Sacrificed | Mechanism |
|---------------------|-----------|
| Cost → Reliability | Reduced redundancy / single region |
| Cost → Performance | Smaller SKUs, scale-to-zero |
| Security → Performance | Inspection / encryption / private-link latency |
| Security → Operations | More controls = operational friction |
| Performance → Reliability | Caching / denormalization adds failure modes |
| Reliability → Cost | Multi-region redundancy spend |

The catalog is also read **in reverse** to generate counterfactuals (§6). Source: Azure WAF pillar "Tradeoffs" docs; versioned data.

### 3.5 Detection — deterministic-first (kept)

1. Inspect `ManifestDocument` sections for catalog mechanism signatures; anchor to node/finding ids.
2. Classify status against the matching L0 pillar answer (`TransparencyTrail`), stated requirements, and captured outcome.
3. Compute `Reversibility` from dependency fan-in on the manifest element.
4. LLM only writes the plain-language explanation + counterfactual for an already-detected, already-classified tradeoff.

---

## 4. Suggested concerns (the hook) — with a quality gate

The risks that are **not** mechanically detectable, and the part that must pass a principal architect (§11). The difference between a toy and a weapon is **grounded specificity**, not model cleverness:

- Weak (suppress): *"This architecture appears operationally heavier than the team you described."*
- Strong (promote): *"This migration depends on six business units changing behavior at once, but the adoption plan you described covers one."*

```csharp
// ArchLucid.Contracts/Risk/SuggestedConcern.cs (proposed)
public sealed class SuggestedConcern
{
    public string ConcernId { get; set; } = Guid.NewGuid().ToString("N");
    public string Statement { get; set; } = null!;           // plain language, specific
    public List<string> RelatedFactRefs { get; set; } = [];  // >= 2 held facts (named entities)
    public ConcernSource Source { get; set; }                // Architectural | ExecutionCredibility
    public RiskConsequence Consequence { get; set; }
    public ReversibilityClass Reversibility { get; set; }
}

public enum ConcernSource { Architectural, ExecutionCredibility }
```

**Quality gate (rev-5 change):**

- **≥2 grounded relations** to held facts — necessary, not sufficient.
- **Specificity:** must reference *named entities* from the customer's context (actors, business units, named components, the adoption plan) — not generic adjectives.
- **Non-obviousness:** must pass the "would a competent principal already know this?" filter. Obvious concerns are dropped, not shown.
- **Always labeled** "AI-suggested, unverified"; **excluded from governance-packet counts**; surfaced prominently in the architect view.
- **Precision is measured, not assumed (rev-7).** The quality gate is enforced by the signal-to-noise gate (§11.4): per-bucket precision floors and a dismiss-rate ceiling. When in doubt, suppress.

Execution-credibility concerns relate architecture complexity to disclosed capacity — grounded, never "your sponsor is weak."

---

## 5. Requirements are evidence, not ground truth (rev-5 change)

The moat — conflict vs stated requirements — is worthless if the requirement was invented and never validated. So requirements are **scrutinized**. ArchLucid already holds the provenance to do it:

| Smell | Signal | Source |
|-------|--------|--------|
| **Unjustified assertion** | A requirement asserted with no recorded rationale | `TransparencyTrail` asserted vs inferred vs defaulted |
| **Incoherent intent** | RTO = 1h but "best-effort" cost answer; "five 9s" but no DR budget | Cross-requirement / cross-pillar consistency |
| **Round-number heuristic** | "1 hour", "99.99%", "five 9s" with no supporting evidence | Pattern + missing justification |
| **Cost-infeasible target** | Stated target implies spend the stated budget can't fund | Requirement × cost section |

Output: *"This requirement appears unvalidated — confirm before we hold your design to it,"* surfaced as `[ is this requirement real? ]` on the conflict and as a standalone evidence-backed item. This rescues the zero-conflict case (§0.1) and reconnects to assumptions — requirements are where most unexamined assumptions hide.

**Bounded, dismissible, and quiet — when ArchLucid stops questioning (rev-6 change).** Requirement interrogation changes posture from *"your design violates your requirement"* (assurance) to *"your requirement may be wrong"* (organizational challenge). Unbounded, that becomes an exhausting argument with the customer. Three rules keep it assurance, not nagging:

1. **Posture is a question, never an assertion.** *"Is RTO = 1 hour validated?"* — not *"your RTO is wrong."*
2. **Raised once, then dispositioned.** A smell uses the same snapshot + disposition trail as everything else (§8). When the user answers *"yes — it's a policy requirement,"* it is **accepted into the record and never re-raised** on later runs. ArchLucid stops questioning the moment you answer.
3. **Tightly scoped to the four kinds below.** No expansion into general requirement critique. A smell is a *flag with provenance*, not an open-ended opinion.

The stop condition is explicit: **ArchLucid questions a requirement exactly once, and only until you disposition it.** Perpetual skepticism is a bug, not a feature.

```csharp
// ArchLucid.Contracts/Risk/RequirementSmell.cs (proposed)
public sealed class RequirementSmell
{
    public string RequirementId { get; set; } = null!;
    public RequirementSmellKind Kind { get; set; } // Unjustified | Incoherent | RoundNumber | CostInfeasible
    public string Rationale { get; set; } = null!;
    public List<string> EvidenceRefs { get; set; } = [];
}

public enum RequirementSmellKind { Unjustified, Incoherent, RoundNumber, CostInfeasible }
```

---

## 6. Explanation is the product, not a drawer (rev-5 change)

Architects trust reasoning, not conclusions. Detection is the hook; **explanation is where trust and indispensability concentrate.** Every evidence-backed item exposes four things:

1. **Assumptions made** — the unacknowledged tradeoffs in scope (§3.2).
2. **Evidence chain** — reuse the existing finding evidence-chain (nodes → finding → manifest).
3. **Alternative architecture** — the path that avoids the sacrifice (`AlternativePathsConsidered`, `ProposedRelaxation`).
4. **Counterfactual — "what would satisfy this requirement"** — the strongest, and the one no competitor does. Derived as the *inverse* of the WAF tradeoff catalog: *"to meet 1-hour RTO you'd need multi-region; here's the cost delta and two ways to get there."* This converts ArchLucid from critic to advisor and is also the zero-conflict value (explain what each tradeoff costs and what the alternative would be).

The counterfactual is `CounterfactualRef` on the tradeoff; deterministic where the catalog encodes the remedy, grounded-judgment where it is interpretive.

### 6.1 Counterfactual is likely the long-term center of gravity (rev-6 change)

**Detection is easy and commoditizing; remediation is hard and valuable.** Frontier models increasingly spot conflicts on their own — but *"here are three ways to satisfy this requirement, the cost delta, the operational impact, and the implementation complexity, grounded in your constraints"* is architecture consulting, and it is hard precisely because it requires *your* cost model, *your* catalog, *your* constraints. Over time the counterfactual/remediation engine may **dwarf** the conflict engine, and it is where grounding (the moat, §12) earns its keep.

Two disciplines keep this from wrecking V1:

- **Liability scales with action.** A wrong *detection* is an annoyance; a wrong *remediation the customer acts on* is a real harm — and the damage scales with how ungrounded the advice is. Remediation raises the trust bar far above detection.
- **Sequence accordingly.** V1 ships only **catalog-grounded options** — the safe WAF inverse, where the remedy is encoded and defensible ("to meet RTO you need multi-region; here is the cost delta"). **Full remediation advisory** (ranked options with bespoke cost/ops/complexity analysis) is deferred (§15) until grounding and calibration justify the liability. Acknowledge it as the probable long-term center of gravity; do not let it balloon the V1 surface.
- **Closed-form, not conversational (rev-7 change).** The scope-explosion risk is *expectation*, not engineering: show one alternative and users will ask *"why not B? what about C?"* — and you are now an interactive architecture advisor, not a risk engine. The boundary that holds V1: the counterfactual is a **statement, not a dialogue.** It answers exactly one question — *what would satisfy this requirement* — bounded by the same 20-pair WAF catalog (§3.4), which *cannot* sprawl because the catalog cannot. **No "why not B?" follow-up loop in V1.** The conversational advisor is the deferred recommendation product (§0.3, §15); the line is closed-form vs dialogue, and crossing it is a deliberate later decision, not an accident of one more button.

---

## 7. Execution / organizational context (intake, kept)

Org risk enters as intake elicitation questions in a new `execution-context` group (separate from WAF pillar questions). Honest base signal is **disclosure state**:

| Answer state | Becomes |
|--------------|---------|
| Answered, positive | Disclosed-OK — articulated, not flagged |
| Answered, negative | Disclosed-Risk → suggested concern (quality-gated) |
| **Skipped MUST** | **Unknown / Undisclosed** (`HasSkippedMustQuestions`) |

Salvaged questions (~7 durable rows from the PM model): sponsor sponsor + tenure · technical leadership · skills/staffing for this architecture · business case w/ measurable benefits · end-user adoption · schedule/budget realism. All other PM-model rows are out of scope.

---

## 8. Durability — immutable per-run snapshot (kept)

- **Immutable `RiskSnapshot` per review run**, mirroring `FindingsSnapshot` (both buckets + requirement smells, stable item ids).
- **Delta** = diff two snapshots — reuses `/compare`.
- **Disposition / acceptance / waiver** = point the existing `FindingReviewTrailAppendService` at snapshot item ids (append-only, audited).
- **Export** = snapshot → CSV / traceability bundle.
- **Behavior-change events (rev-6/7).** Log when a finding leads to `[ change requirement ]`, an accepted counterfactual, or a subsequent manifest revision — the leading commercial metric (§11.3). **Never use these to train the model.**
- **Outcome capture on ignored findings (rev-7).** Lightweight follow-up on items that were dismissed or not acted on ("what happened?") — feeds **predictive validity** and the flywheel, including Case B (ignored-but-came-true). **This is the calibration signal; keep it separate from behavior-change events.**

A snapshot is a record, not a mutable object — not the deferred ontology. The disposition + outcome-capture trail is also the **system-of-record substrate** the moat compounds on (§12).

---

## 9. Honesty + UX rules

1. **Lead with the screen and the reasoning** (§0), not the taxonomy.
2. **Evidence anchoring** — every item cites held evidence; concerns need ≥2 grounded relations + the quality gate.
3. **Two buckets only** — never co-counted in board metrics.
4. **No fabricated precision** — order by conflict → consequence → reversibility; dimensions visible + re-sortable; `Unknown` for undisclosed. **No invented probabilities** ("70% chance") in any reader's view.
5. **Requirements are interrogated, not trusted** — but **once and dismissibly** (§5); ArchLucid stops questioning when you disposition.
6. **Explanation ≥ detection** — always show reasoning + counterfactual.
7. **Absence is a signal** — unacknowledged tradeoffs (= unvalidated assumptions) and undisclosed MUSTs are first-class.
8. **One finding, two readers** — render the same evidence-backed item in architect detail *and* sponsor decision currency inside the **governance packet** (§0.2). **Governance packet = evidence-backed only.** Plain language always — *"one conflicts with what you said you needed,"* never "WAF pillar consequence classification."
9. **Two decoupled metrics** — behavior change *steers* (commercial), predictive validity *calibrates* (the flywheel; trains on what proved true, never on what got clicked). Capture outcomes on ignored findings (§11.3).
10. **Earn trust by being right** — visible per-bucket track record, per-tenant calibration, fail-quiet on low-accuracy categories (§11.5). Default to suppression over surfacing (§11.4).
11. **Review earns recommendation** — recommendations are grounded in detected, evidence-anchored conflicts; the counterfactual is closed-form in V1, never a chat (§0.3, §6.1).

---

## 10. Reuse map (keeps V1 small)

| Need | Existing surface |
|------|------------------|
| Business outcome (mismatch anchor) | `DraftRequestDocument.BusinessOutcome` |
| WAF pillar definitions | `UniversalIntakeQuestions` (`l0.pillar.*`) |
| Tradeoff acknowledgment + requirement provenance | `TransparencyTrail` (asserted/inferred/defaulted) |
| Skipped-MUST signal | `TransparencyTrail.HasSkippedMustQuestions` |
| Org elicitation / clarification | `ElicitationQuestion`, `QuestionSelectionEngine` |
| Evidence anchor / per-pillar findings | `Finding.RelatedNodeIds`; `SecurityBaselineFindingEngine`, `SecurityCoverageFindingEngine`, `CostConstraintFindingEngine`, `RequirementFindingEngine` |
| Detection input | `ManifestDocument` sections |
| Alternatives / counterfactual seed | `AlternativePathsConsidered`, `ProposedRelaxation`, WAF catalog (inverse) |
| Coarse precedent to supersede | `AuthorityManifestRiskPosture` |
| Snapshot pattern | `FindingsSnapshot` |
| Disposition trail | `FindingReviewTrailAppendService` |
| Delta surface | `/compare`, `pilot-run-deltas` |
| Sponsor export / governance packet | `ExecutiveReviewPacketComposer` |

**Coverage honesty:** Operations and Performance pillars have thin finding-engine coverage — report "low evidence on this pillar," not silence.

---

## 11. Validation plan — four gates + two decoupled metrics (rev-7, the go/no-go gates)

Rev 5 used one test ("is the output non-obvious to a principal?"). Rev 6 added behavior change as the north star. Rev 7 corrects both: **four pre-launch gates** (coverage · principal · behavior-change · signal-to-noise), plus **two decoupled post-launch metrics** (behavior change steers; predictive validity calibrates — §11.3). The two buckets carry value differently (§1.1a); the gates get you in; the metrics keep you honest over time.

### 11.1 Coverage gate — the evidence-backed core

Measures **consistent enforcement**, not surprise. Run the engine over real architectures with *known* tradeoff/requirement violations seeded or pre-identified.

- **Pass bar:** catches the known evidence-backed mistakes **every time** (no misses) with a low false-positive rate. Obvious is fine — the value is the guarantee. A single-region-vs-RTO catch *passes* this gate; missing it once *fails* it.

### 11.2 Principal gate — suggested concerns

Measures **non-obviousness**, applied to concerns only (a single-pillar conflict is *not* expected to pass here — that is the core's job, §11.1).

1. Take **10–15 real past architectures** with known outcomes; run blind; collect every suggested concern.
2. An **independent principal architect** scores each: *genuinely non-obvious and correct* / obvious / wrong (noise).
3. **Pass bar:** ≈ ≥1 non-obvious-true concern per review without drowning in noise.

### 11.3 Two decoupled metrics — behavior change *and* predictive validity (rev-7 change)

Rev 6 made **decision change** simultaneously the commercial metric *and* (implicitly) the flywheel's training signal. That coupling is a real defect, visible in two cases:

| | Outcome | Rev-6 verdict | Truth |
|---|---------|---------------|-------|
| **Case A** | Flagged → customer changed design → project succeeded | Success | Value delivered |
| **Case B** | Flagged → customer *ignored* it → project failed exactly as predicted | "Failure" (no decision change) | **Strongest possible evidence ArchLucid was right** |

Behavior change is a *proxy* for value, not a measure of *correctness*. Optimizing on it alone teaches the system to "generate findings people already agree with" — the survivorship trap (and many true findings are initially unpopular). The fix is **two metrics with different jobs, time horizons, and consumers — deliberately decoupled:**

| Metric | Question | Horizon | Role | Trains the model? |
|--------|----------|---------|------|-------------------|
| **Behavior change** | "Did the product influence a decision?" | Short (in-session) | **The metric you *steer* by** — commercial north star, sales narrative | **Never** |
| **Predictive validity** | "Was the finding actually right?" | Long (months) | **The metric you *calibrate* by** — feeds the flywheel | **Yes — exclusively** |

Two rules follow:

1. **Train calibration on validity, not acceptance** (anti-survivorship, §12). What proved *true* tunes the system — not what got *clicked*.
2. **Capture outcomes on ignored findings, not just acted-upon ones.** A lightweight outcome-capture loop ("you didn't act on this — what happened?") makes **Case B (ignored-but-came-true) a first-class, highest-value calibration signal**, and lets us track an explicit **unpopular-but-correct rate** as a guard against the system collapsing toward consensus.

**Why behavior change still leads commercially:** predictive validity cannot run a business — outcomes take 6–18 months, attribution is confounded, and Case B requires a customer to fail *and* admit ArchLucid called it. So behavior change is the dial you watch weekly; predictive validity is the slow truth that keeps the dial honest.

**The sponsor / behavior-change gate (the pre-launch form of the leading metric).** Show the output to a **CIO / CTO / VP Engineering** and ask: *"Would you delay, re-scope, or change this project based on this finding?"* If the answer is *no* across the board, ArchLucid is an architecture toy, not a governance platform — regardless of how well it clears 11.1/11.2. Instrument it from day one: a conflict leading to `[ change requirement ]`, an accepted counterfactual, or a subsequent manifest revision is a **logged behavior-change event** (tenant-scoped, on the snapshot trail, §8).

**Interpretation:** clears 11.1/11.2/11.3 *and* the dismiss-rate floor (§11.4) → a company. Clears the gates but drowns the user in noise → alert fatigue kills it anyway. The thesis (§0) is settled only when behavior change is observed *and* predictive validity confirms it was warranted.

### 11.4 Signal-to-noise gate — the denominator (rev-7 change)

"≥1 non-obvious-true per review" (§11.2) ignores the denominator: **one great insight buried in twenty mediocre ones reads as noise, and products die of alert fatigue.** So precision is a gate, not an afterthought:

- **Per-bucket precision floors.** Evidence-backed risks ≈100% by construction (a contradiction is true or it isn't). **Suggested concerns carry a precision floor below which the entire bucket is hidden** — fewer, sharper concerns beat many weak ones.
- **Dismiss rate is the alert-fatigue proxy.** Track the fraction of items the architect dismisses as noise; treat a ceiling on it as a hard gate. Rising dismiss rate is an early-warning signal, not a vanity stat.
- **Default to suppression over surfacing.** When in doubt, don't show it. The §4 quality gate becomes a *measured* threshold, not a vibe.

### 11.5 Earning trust after deployment (rev-7 change)

Pre-launch gates (11.1–11.4) get you in the door; they do not keep you there. **Trust is built by being right over time, not by explanation** — and a few wrong judgment calls and the architect tunes out permanently. Three mechanisms, concentrated where the trust burden actually lives:

1. **Deterministic conflicts are exempt.** A logical contradiction is verifiable on the spot — there is no track record to earn. **The entire post-deployment trust burden sits on suggested concerns and requirement smells** (the judgment items). That tells us exactly where to invest.
2. **Make the track record visible, per bucket.** *"Concerns flagged: X · confirmed by you: Y · later proven correct: Z."* Trust is transparency about your own hit rate, not a confidence badge.
3. **Calibrate to demonstrated accuracy, per tenant, and fail quiet.** If requirement smells run 40% wrong for *this* tenant, down-weight or suppress the category for that tenant. A category that loses trust is silenced before it poisons the buckets that earned it. Per-tenant calibration over global priors.

---

## 12. Monetization, defensibility & competitive position

- **Tier:** Enterprise/Governance above Standard (`RequiresCommercialTenantTier`).
- **Segments:** regulated enterprises, EA governance boards, M&A due diligence.
- **Differentiation:** competitors (LeanIX, MEGA, Orbus, Sparx, ServiceNow APM) ship registers; none surface an **evidence-anchored conflict between a design's tradeoffs and the customer's own stated requirements**, with reasoning and counterfactual.
- **Defensibility (rev-7 refinement) — judgment is the value; provenance is what makes it deployable and durable.** Rev 5 implied the evidence graph *is* the value. Correction: **customers buy judgment, not traceability.** Between System A (perfect graph, weak recommendations) and System B (mediocre graph, brilliant recommendations), B wins in a general market — nobody buys a graph. So judgment quality is the product. **But two things hold in ArchLucid's market specifically:**
  - **In regulated governance, judgment without provenance is undeployable.** A recommendation a CIO cannot defend to an auditor — *"we changed the design because the AI said so"* — does not survive a governance board. Provenance is not a nicety here; it is a *purchase requirement* in exactly the segment that pays the most. So: judgment is the value, **provenance is what makes the judgment usable.**
  - **Judgment commoditizes; the moat must be what doesn't.** Raw concern generation will be replicated by frontier models. What does not commoditize:
    - **Grounding a raw model can't get** — the customer's governed manifest, evidence graph, requirement provenance, longitudinal history. You can't paste a governed enterprise architecture into a public chatbot.
    - **Data flywheel — calibrated on *predictive validity*, not acceptance (rev-7).** What proved *true* compounds — explicitly **including ignored-but-correct (Case B, §11.3)**, which is the most valuable and most counter-consensus signal. Training on what got *acted on* instead would teach the system to be agreeable, not right (the survivorship trap). **This is where judgment itself becomes a moat.** Invest here.
    - **System of record** — dispositions, waivers, audit trails, behavior-change history create switching cost.
  - Therefore **model improvement is a tailwind** (judgment improves for free, stays grounded and defensible) rather than a threat. The bet: in regulated enterprise, *grounded + defensible + calibrated* judgment beats raw judgment — and the flywheel makes our judgment progressively better than a generic model's.
- **The moat is a wedge-to-moat conversion, and cold-start is the real risk (rev-7).** If frontier models master judgment, the durable moat is workflow + provenance + governance + history — *enterprise* moats: slow, sticky, hard to replicate (no model can fabricate a tenant's two years of dispositions and validated track record). That slowness is a **feature** for this market, but it creates the genuine danger: **at cold-start you have only judgment to sell — the very thing commoditizing.** So the strategy is explicit: **judgment is the wedge (shrinking edge); governance embedding is the moat (compounding edge); deliberately convert one into the other, and the clock starts at deployment.** This is the business reason to build the unglamorous system-of-record / disposition / outcome-capture infrastructure *early* — not for the demo, but because defensibility only begins compounding once it exists. A company that is all wedge and never converts loses to the next model release.
- **Positioning (decision #15):** the unit assured is the architectural *decision*. Security reviews, vendor selection, and migrations are the same machinery (stated intent + realized choice + conflict + explanation). **Design the abstraction so it generalizes; build only the architecture use case in V1.** North Star on the wall, not in the backlog.

---

## 13. Critical review & failure modes

| Failure mode | Mitigation |
|--------------|------------|
| Feature, not a product (zero conflicts) | Articulated bets + named assumptions + requirement smells are the floor (§0.1) |
| Hostage to bad requirements | Requirement interrogation (§5) — scrutinized, not trusted; raised once and dismissible |
| Value (AI) is replicable | Judgment is the value; provenance + flywheel is the durable, deployable moat (§12) |
| **Architects love it, executives don't pay** | **Consequence-translation layer — same finding in sponsor decision currency (§0.2); behavior-change gate (§11.3)** |
| **Optimizing for rare insight over repeatability** | **Evidence-backed core = consistent enforcement of the obvious; non-obvious gate applies to concerns only (§1.1a)** |
| **Requirement interrogation becomes nagging** | **Once, dismissible, question-posture, scoped to four kinds (§5)** |
| **Ranking embeds a non-universal philosophy** | **Consequence leads; reversibility is a tiebreaker; dimensions visible + re-sortable (§1.2)** |
| **Wrong remediation a customer acts on** | **V1 ships catalog-grounded options only; full advisory deferred until grounding/calibration justify it (§6.1, §15)** |
| Weak concern makes product look shallow | Quality gate: specific + non-obvious + ≥2 relations (§4) |
| Underestimated explanation | Explanation is first-class; counterfactual likely the long-term center of gravity (§6, §6.1) |
| Over-classification | Two user-facing buckets; classes are internal metadata |
| Outcome-alignment false positives | Orphaned outcome → clarification question; only optimization mismatch is a risk |
| Assumptions keep returning | Embraced as vocabulary; light detection, no ontology |
| Accidentally a bigger product | Decision-assurance is North Star; design to generalize, ship narrow (§12) |
| **Insight nobody acts on** | **Behavior change steers (§11.3); but it is a proxy, not correctness** |
| **Measuring clicks, not correctness** | **Two decoupled metrics — predictive validity calibrates; behavior change steers (§11.3)** |
| **Survivorship bias in the flywheel** | **Train on validity not acceptance; capture ignored-but-correct (Case B); track unpopular-but-correct rate (§11.3, §12)** |
| **Executives don't consume findings** | **Governance packet, not dashboard — the slide the architect carries up (§0.2)** |
| **Trust erodes after a few wrong calls** | **Visible per-bucket track record + per-tenant calibration + fail-quiet; conflicts are exempt (§11.5)** |
| **Alert fatigue / noise** | **Per-bucket precision floors + dismiss-rate ceiling; suppress by default (§11.4)** |
| **Counterfactual becomes a chat advisor** | **Closed-form, catalog-bounded; no "why not B?" loop in V1 (§6.1)** |
| **Moat is slow; cold-start exposed** | **Judgment is the wedge, governance embedding the moat; build system-of-record early (§12)** |
| **Drifting into a recommendation system** | **It's a funnel — review is the trust substrate; build recommendation as an extension point (§0.3)** |
| Doesn't pass a principal | Validation gates — coverage, principal, behavior-change, signal-to-noise — gate further engineering (§11) |

---

## 14. Security, scalability, reliability, cost

| Dimension | Treatment |
|-----------|-----------|
| Security | Tenant-scoped via `ScopeContext`; snapshot governed like `FindingsSnapshot`; no new PII class |
| Scalability | Bounded 20-pair catalog + manifest scan; reversibility from existing dependency edges; snapshot one row-set per run |
| Reliability | Deterministic core reproducible per run; AI explanation/concern non-authoritative; no background loop |
| Cost | No LLM for detection; LLM for explanations + counterfactuals + grounded concerns; compose-on-read reporting |

---

## 15. Explicitly deferred

Graph risk node/edge types · **mutable** risk lifecycle (waiver/disposition *state*; trail reuse is fine) · continuous assumption-invalidation · 2026 external-risk layer · numeric likelihood / heatmaps / uncertainty axis / fabricated probabilities · AWS/GCP pillar framing · **full remediation advisory** (ranked bespoke options with cost/ops/complexity analysis — V1 ships catalog-grounded options only, §6.1) · **conversational counterfactual advisor** (the "why not B?" dialogue — V1 is closed-form, §6.1) · broad "Enterprise Decision Assurance" repositioning (kept as North Star, not built). **Deferred ≠ unplanned:** the recommendation engine and its outcome-capture/calibration substrate are designed as extension points now (§0.3, §11.3) even though only the wedge ships.

---

## 16. Implementation steps (when promoted) — demo-first order

1. **The screen + conflicting-tradeoff detector + reasoning + counterfactual** over `ManifestDocument` + `TransparencyTrail` + stated requirements; supersede `AuthorityManifestRiskPosture`. *(V1 demo core.)*
2. **Requirement smell detector** (§5) over `TransparencyTrail` provenance + cross-requirement consistency.
3. One grounded, quality-gated suggested-concern synthesizer (§4).
4. Contracts under `ArchLucid.Contracts/Risk/` (`ArchitectureTradeoff`, `SuggestedConcern`, `RequirementSmell`, `ExecutionContextItem`, enums).
5. Azure WAF tradeoff catalog as versioned data (+ inverse for counterfactuals).
6. `execution-context` elicitation questions (7) + orphaned-outcome clarification in `QuestionSelectionEngine`.
7. `RiskSnapshot` mirroring `FindingsSnapshot`; delta on `/compare`; disposition via `FindingReviewTrailAppendService`. **Log behavior-change events** (`[ change requirement ]` / accepted counterfactual / subsequent manifest revision) **and a lightweight outcome-capture loop on ignored findings** (Case B) on the snapshot trail — keep the two metric streams separate: behavior change steers, predictive validity calibrates (§11.3). **Build this system-of-record substrate early** (the moat compounds only once it exists, §12). Per-tenant calibration + dismiss-rate tracking (§11.4–11.5).
8. Extend `ExecutiveReviewPacketComposer` (evidence-backed only) with the **consequence-translation** rendering as a **governance packet / steering-committee artifact** (§0.2 — schedule/cost/compliance, no fabricated probability), not an sponsor dashboard.
9. **Run the §11 gates before committing further engineering** — coverage (§11.1), principal (§11.2), sponsor/behavior-change (§11.3), and the signal-to-noise/dismiss-rate floor (§11.4) once pilots exist.
10. API routes + OpenAPI snapshot + nav builders; ADR (non-goals: register, mutable ontology, four-class taxonomy, fabricated probability, full remediation advisory, conversational advisor). **Design the counterfactual contract as a recommendation extension point** (§0.3) even though V1 ships closed-form.

---

## 17. Code map (current substrate)

| Concern | Location |
|---------|----------|
| Business outcome | `ArchLucid.Contracts/Drafts/DraftRequestDocument.cs` |
| Pillar intake questions | `ArchLucid.Application/Drafts/QuestionSelection/UniversalIntakeQuestions.cs` |
| Elicitation model | `ArchLucid.Contracts/Governance/ElicitationQuestion.cs`, `.../QuestionSelection/QuestionSelectionEngine.cs` |
| Transparency trail (provenance) | `ArchLucid.Contracts/Architecture/TransparencyTrail.cs` |
| Per-pillar finding engines | `ArchLucid.Decisioning/Services/*FindingEngine.cs` |
| Manifest sections | `ArchLucid.Core/Manifest/Sections/*.cs` |
| Alternatives / relaxations | `ArchLucid.Contracts/Findings/ExplainabilityTrace.cs`, `ArchLucid.Contracts/Architecture/ProposedRelaxation.cs` |
| Coarse risk posture (supersede) | `ArchLucid.Decisioning/Manifest/AuthorityManifestRiskPosture.cs` |
| Findings snapshot (pattern) | `ArchLucid.Contracts/Findings/FindingsSnapshot.cs` |
| Disposition trail | `ArchLucid.Application/Governance/FindingReview/FindingReviewTrailAppendService.cs` |
| Trust label | `ArchLucid.Contracts/Findings/FindingTrustLabel.cs` |
| Sponsor export | `ArchLucid.Application/Exports/ExecutiveReviewPacketComposer.cs` |
| Existing risk register surfaces | `ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.cs`, `ArchLucid.Contracts/Governance/ArchitectureRiskRegisterResponse.cs` |

---

## 18. What comes next — pilot, not revision (rev-7)

Seven revisions made this design **complete and internally consistent**. They did not make it **true**. Every remaining open question is now answerable only by running real architectures through the §0 demo core and instrumenting the result:

| Question | How it gets answered | When |
|----------|---------------------|------|
| Does it change behavior? | Logged behavior-change events (§8, §11.3) | Weeks (in-session) |
| Is it right? | Predictive validity + ignored-but-correct (Case B) | Months (post-outcome) |
| Does trust compound? | Per-bucket track record + dismiss rate (§11.4–11.5) | Quarters (post-deployment) |
| Does the wedge convert to moat? | Disposition + outcome-capture history per tenant (§12) | Quarters–years |

**The next move is not rev 8.** It is:

1. **Ship the §0 demo core** — conflict detector + screen + closed-form counterfactual + one quality-gated concern.
2. **Instrument from day one** — behavior-change events and outcome capture on ignored findings, kept in separate streams (§11.3).
3. **Run the §11 gates on 10–15 real past architectures** before committing to the full §16 backlog.
4. **Pilot with one design partner** — observe whether the architect carries the governance packet (§0.2) into a real steering committee and whether anyone changes a decision because of it.

The design document stops here. Falsification starts in the pilot.

---

## Appendix A — Adversarial design-review log

Six adversarial rounds shaped this design. Decisions are in §2; this log records the *reasoning* — including where the design held the line — so revisions don't relitigate settled points.

### Round 1 — "is this the right problem?" (ontology → tradeoffs)

| Attack | Verdict |
|--------|---------|
| Graph-theory engine, not an architect | Agree (strategy) / Disagree (characterization) |
| Decision is deeper than Assumption | Partial — risk is a relationship; decisions already first-class |
| Continuous invalidation is a distraction | Agree (V1); remains long-term moat |
| Risk engine already exists (AI synthesis) | Agree — dropped heavy ontology; held: must cite evidence |
| This is a V2 problem | Agree — reframed as destination map |

### Round 2 — "too narrow / too cautious?" (→ four-class rev 3)

| Attack | Verdict |
|--------|---------|
| Too WAF-bound; model risk missing | Agree — added model risk; WAF demoted to lens |
| Deterministic-first too shallow | Agree, guardrailed — AI concerns, never exec-counted |
| Org layer too timid | Agree — grounded credibility judgment |
| No durable object is a dead end | Agree (snapshots) / Hold (ontology) — snapshot ≠ ontology |
| "No likelihood" too dogmatic | Agree, reframed (axis later removed in rev 4) |
| First-five-minutes unsolved | Agree — naming + plain language |

### Round 3 — "is this four products?" (→ rev 4, two buckets + screen-first)

| Attack | Verdict |
|--------|---------|
| Drifting toward four products | Agree (surface) / Hold (plumbing) — two buckets |
| Outcome alignment is dangerous | Concede — orphaned outcome → question, not risk |
| Sneaking assumptions back in | Concede concept / Hold implementation — embraced the word |
| AI concerns will be the star | Concede — concerns = hook, evidence = moat; ship both |
| Uncertainty axis is muddy | Concede — removed |
| Too architecture-centric | Agree / refuse to chase in V1 — parked as positioning |
| Five-minute value unproven | Concede — added screen-first §0 |

### Round 4 — "feature or company?" (→ rev 5)

| Attack | Verdict | Resolution |
|--------|---------|-----------|
| Feature, not a product (zero conflicts) | **Concede** | Articulated bets + assumptions + requirement smells as the floor (§0.1) |
| Customers don't know their requirements | **Concede — strongest** | Requirement interrogation (§5); requirements are evidence, not truth |
| Value (AI) is replicable | **Partial / reframe** | Moat = grounding + data flywheel + system-of-record; model gains are a tailwind (§12) |
| Ranking still unsolved | **Concede** | Order by conflict → reversibility → consequence (§1.2) |
| One weak concern looks shallow | **Concede** | Concern quality gate: specific + non-obvious (§4) |
| Underestimating explanation | **Concede — best unraised point** | Explanation first-class; counterfactual (§6) |
| Close to category-defining | **Agree / hold discipline** | Decision-assurance = North Star; design to generalize, ship narrow (§12) |
| Show 3 conflicts a principal missed | **Concede — the real test** | Validation plan as go/no-go gate (§11); the clean conflict likely fails it — value is in concerns/smells/interactions |

### Round 5 — "feature or company?" became "does it change behavior?" (→ rev 6)

This round moved off architecture entirely — onto product strategy, epistemology, and market fit.

| Attack | Verdict | Resolution |
|--------|---------|-----------|
| Optimizing for architects, not buyers | **Concede framing / reject the example** | Consequence-translation layer (§0.2) — same finding in sponsor decision currency. **But no fabricated "70% chance"** — that is the invented precision rounds 2–4 deleted |
| "Non-obvious" is a dangerous target | **Concede — corrects a rev-5 over-rotation** | Non-obviousness gates *concerns only*; evidence-backed core = **consistent enforcement of the obvious** (§1.1a); two validation criteria (§11.1/11.2) |
| Requirement smells = rabbit hole | **Concede** | Raised once, dismissible, question-posture, scoped to four kinds; stops on disposition (§5) |
| Reversibility is the wrong ranking signal | **Concede — over-elevated in rev 5** | Consequence leads; reversibility is a tiebreaker; dimensions visible + re-sortable, not a baked-in philosophy (§1.2) |
| Counterfactual becomes the whole product | **Agree, with liability caveat** | Likely the long-term center of gravity (§6.1); V1 ships catalog-grounded options; full advisory deferred (wrong remediation acted-on is high harm) |
| Moat isn't the graph | **Partial** | Judgment *is* the value; provenance is a deployability requirement in regulated governance + the durable moat (judgment commoditizes, grounding/flywheel don't) (§12) |
| Principal test is insufficient | **Concede** | Added sponsor/behavior-change gate (§11.3) — the better commercial gate |
| **The thesis: prove customers change decisions** | **Concede fully — superseded in rev 7** | Rev 6: decision change as sole north star. Rev 7: behavior change *steers*, predictive validity *calibrates*; Case B is first-class (§11.3) |

### Round 6 — "deeper assumptions" (→ rev 7): metrics, trust, and product identity

The reviewer stopped finding fatal flaws and went after foundational assumptions — measurement, the flywheel, trust over time, and what kind of product this is.

| Attack | Verdict | Resolution |
|--------|---------|-----------|
| Measuring behavior change, not predictive validity | **Concede the point / push back on framing** | Two decoupled metrics — behavior change *steers*, predictive validity *calibrates*; validity can't run a business alone (§11.3) |
| Survivorship bias in the flywheel | **Concede — a real rev-6 bug** | Train on validity not acceptance; capture ignored-but-correct (Case B); track unpopular-but-correct rate (§11.3, §12) |
| Executives consume narratives, not findings | **Concede — fits the grain** | Governance packet, not dashboard — reuse `ExecutiveReviewPacketComposer` (§0.2) |
| Trust isn't solved post-deployment | **Concede / sharpen** | Visible track record + per-tenant calibration + fail-quiet; conflicts are exempt (verifiable), so the burden sits on judgment items (§11.5) |
| Counterfactuals explode via expectation | **Concede — bound it** | Closed-form, catalog-bounded; no "why not B?" loop in V1 (§6.1) |
| Moat depends on slow enterprise embedding | **Partial** | Slow is a feature for this market; the real risk is cold-start — judgment is the wedge, governance embedding the moat; build system-of-record early (§12) |
| Principal test too easy (ignores denominator) | **Concede** | Signal-to-noise gate — per-bucket precision floors + dismiss-rate ceiling; suppress by default (§11.4) |
| **Review system or recommendation system?** | **The real reframe** | A funnel: review = trust substrate (provably right), recommendation = value surface (probably right); build recommendation as an extension point, ship the wedge (§0.3) |

### Standing guardrails (do not regress)

1. Lead with the screen and the reasoning; two user-facing buckets, never four.
2. Evidence-backed conflict is the moat; suggested concerns are the hook; ship both, label clearly, never co-count in board metrics.
3. No numeric score / probability / uncertainty axis / fabricated likelihood — order by conflict → **consequence → reversibility**; dimensions visible + re-sortable; `Unknown` for undisclosed.
4. Requirements are interrogated, not trusted — but **once and dismissibly**; ArchLucid stops questioning on disposition. Orphaned outcomes are questions, not risks.
5. Assumptions named openly; detection stays lightweight (no ontology).
6. Explanation ≥ detection; always show reasoning + counterfactual. Counterfactual is the probable long-term center of gravity, but V1 ships catalog-grounded options only.
7. A snapshot is a record, not the deferred mutable lifecycle.
8. Decision-assurance is the North Star; design to generalize, build narrow.
9. **The evidence-backed core is valued for consistent enforcement of the obvious; non-obviousness gates concerns only.**
10. **One finding, two readers** — architect detail and sponsor decision currency; no invented probabilities.
11. **Judgment is the value; provenance + flywheel is the durable, deployable moat.** Judgment is the wedge; governance embedding is the moat; build the system-of-record early.
12. **Two decoupled metrics:** behavior change steers (never trains the model); predictive validity calibrates (trains on what proved true, including ignored-but-correct). The gates — coverage · principal · behavior-change · signal-to-noise (§11) — gate further engineering.
13. **Earn trust by being right over time** — visible track record, per-tenant calibration, fail-quiet; the burden is on judgment items, not verifiable conflicts.
14. **It is a review system that earns the right to be a recommendation system.** Review is the trust substrate; recommendation is the value surface; counterfactual is closed-form in V1 but designed as an extension point.
15. **Governance packet, not sponsor dashboard** — the buyer consumes the champion's artifact, not a login (§0.2).
16. **Design is complete; falsification is in the pilot** — no rev 8 until real architectures run through §0 (§18).
