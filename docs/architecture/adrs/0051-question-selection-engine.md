> **Scope:** ADR 0051 — Question selection engine (deterministic-first, LLM as bounded selector).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0051: Question selection engine — deterministic-first, LLM as a bounded selector, packs own questions

**Status:** Accepted — amended by [ADR 0058](0058-bounded-generative-question-tier.md) (bounded generative tier L2g + retrospective question mining; 2026-07-12)
**Date:** 2026-06-07 (Accepted 2026-06-08; L0/L1 implemented, L2/VoI remain OPEN per O1-remainder)
**Deciders:** Owner + Architecture review
**Related:** [ADR 0007](0007-effective-governance-merge.md) (governance merge), [ADR 0031](0031-cross-tenant-pattern-library.md) (cross-tenant wall), [ADR 0036](0036-graph-rag-embedding-strategy.md) (RAG), [ADR 0048](0048-socratic-intake-mutable-draft-lifecycle.md), [ADR 0049](0049-actor-descriptor-model.md), `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` (R7–R10)

## Context

The Socratic loop (ADR 0048) needs a principle for *which* questions to ask, because in principle ArchLucid may ask thousands. The debate (R7) settled the governing idea: **deterministic questions first, LLM as a bounded fallback**, with **policy packs guiding questions**; as packs grow from experience (and feed RAG), the question surface becomes *less* nondeterministic over time. The keystone reframe: the LLM is demoted from a question **generator** (hallucination-prone, ungradeable) to a **selector over a curated, bounded candidate set** (verifiable — the chosen question is always known-good; gradeable in the golden cohort).

Three owner rulings bind this ADR:
- **R8 — packs own their questions.** A policy pack becomes a first-class carrier of evaluation rules **and** the elicitation questions that feed them, with a question→rule mapping, versioned together.
- **R9 — human-in-the-loop promotion, out of runtime scope.** Promoting a learned question into the canon requires a human gate, but that governance lives *outside* the ArchLucid runtime; the runtime provides only the versioned, non-silent, auditable mechanism (the existing "no silent row mutation / SemVer uplift" pack discipline).
- **R10 — k-anonymized aggregates only.** Learning "from user experience" flows through curated platform packs and k-anonymized aggregates; raw cross-tenant Q&A reuse stays forbidden (ADR 0031).

Policy pack content is already versioned JSON (`PolicyPackVersions.ContentJson` / `PolicyPackContentDocument`), so R8 is a content-schema extension, not a table migration.

## Decision

1. **Layered selection model:**
   - **L0 — deterministic, universal:** the five Well-Architected pillars + the actor set (ADR 0049) generate the universal `MUST` questions. No LLM.
   - **L1 — deterministic, pack-driven:** active/inferred policy packs contribute their question sets (each derivable from a pack rule key); ordering by value-of-information ranking. No LLM.
   - **L2 — LLM bounded fallback:** only when L0–L1 are exhausted but the objective is still under-determined; the LLM **selects/phrases from the bounded corpus** (platform packs + k-anon aggregates via RAG). It does **not** free-generate questions.
   - **L3 — learning flywheel:** useful L2 questions are logged → reviewed (human, out of runtime — R9) → promoted into packs (SemVer, no silent mutation) → become L1. Nondeterminism decreases monotonically.
2. **Packs own questions (R8).** Extend `PolicyPackContentDocument` with an additive `ElicitationQuestions` collection: `{ QuestionKey, Prompt, Tier (MUST|SHOULD), AnswerKind, RuleKeys[] }`. A validator asserts every `RuleKeys` entry resolves within the same pack version. Existing question-less packs must deserialize unchanged.
3. **Termination is deterministic.** "Done" = all `MUST` questions for the active pillars/packs are answered. The LLM never decides when to stop. This is the same gate ADR 0048 uses to allow `Submitted`.
4. **Cold-start is seeded, not empty.** L0/L1 are seeded from the five pillars' canonical questions and the existing bundled policy packs' rule keys (each evaluation rule implies an elicitation question).
5. **The value-of-information ranking function is OUT OF SCOPE and OPEN (O1-remainder).** This ADR fixes the *layering, ownership, and termination*; the precise VoI ordering and the exact condition under which L2 may break ties are deferred until golden-cohort data exists to calibrate them. Building L2/VoI before that data is explicitly disallowed by this ADR.

## Trade-offs

Deterministic-first with the LLM as a bounded selector **gains** verifiability (every asked question is known-good), gradeability (the golden cohort can score "did it pick the right next question?"), cost control (most questions need no LLM call), and a flywheel that *reduces* nondeterminism with use — the opposite of typical LLM systems. It **gives up** early breadth: cold-start coverage is only as good as the pillars + seeded pack rules, so genuinely novel domains lean on L2 sooner and feel thinner until packs grow. We **reject** letting the LLM free-generate questions (the dangerous oracle pattern — unverifiable, ungradeable, hallucination-prone) and **reject** a fully static question bank (it cannot improve and would ossify one author's house style as universal). The cost is a slower-improving cold-start; the benefit is a system that is safe and auditable from day one and compounds over time.

## Constraints

- **Cross-tenant wall (ADR 0031) is absolute** — L3 may consume only curated platform packs and k-anonymized aggregates; never raw cross-tenant questions/answers. Anything richer is a new ADR with DPA consequences.
- **Promotion follows existing pack discipline** — SemVer uplift, no silent row mutation; the *runtime* exposes the mechanism only, and the *human approval* gate is out of scope (R9).
- **R8 schema change must be backward-compatible** — additive `ElicitationQuestions`; no change to `PolicyPacks`/`PolicyPackVersions` tables; reuse the effective-governance merge (ADR 0007) when packs overlap.
- **No L2/VoI implementation until O1-remainder is resolved** with golden-cohort calibration data — this is a hard scope boundary, not a suggestion.
- LLM usage at L2 must respect the existing completion pipeline, cache, and quota posture (ADR 0005).

## Expected impact

- **System:** the policy pack becomes the unit that carries both evaluation and elicitation; the engine has three deterministic-leaning layers and one bounded LLM layer.
- **Security posture:** positive — bounding the LLM to selection eliminates the injected/hallucinated-question class of failure; the cross-tenant wall keeps learning privacy-preserving by construction.
- **Operations:** pack authoring gains a new responsibility (questions, not just rules); a promotion pipeline (human-gated, external) must exist before L3 yields value; RAG indexing of platform packs is a new corpus to maintain (ADR 0036).
- **Cost:** lower per-session LLM spend than a generate-every-question design; cost is dominated by L2 frequency, which falls as packs mature.
- **Teams:** policy-pack authors and the platform owner take on the question corpus and its review; the runtime team owns L0/L1 and the deterministic termination gate.

## Consequences

- **Positive:** a safe, gradeable, cost-bounded question engine whose nondeterminism shrinks over time; packs become the single growth lever.
- **Negative:** cold-start coverage depends on seeding quality; L2 and the learning flywheel are blocked on data (O1-remainder) and on an out-of-runtime human review process.
- **Follow-ups:** resolve O1-remainder (VoI ranking) with golden-cohort data; implement the R8 `ElicitationQuestions` schema extension (Phase 1, ready now); seed L0/L1 from pillars + bundled pack rule keys; design the (external) promotion review workflow.
