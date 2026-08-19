> **Scope:** ADR 0050 — Feasibility classification (hard vs soft) and the mandatory transparency trail.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0050: Feasibility classification + mandatory transparency trail

**Status:** Accepted
**Date:** 2026-06-07 (Accepted 2026-06-08)
**Deciders:** Owner + Architecture review
**Related:** [ADR 0035](0035-architecture-invariant-catalog.md) (invariant catalog), [ADR 0048](0048-socratic-intake-mutable-draft-lifecycle.md), [ADR 0049](0049-actor-descriptor-model.md), `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` (R4, R5, R6), TB-034 (provenance), SAQ-011 (claim labeling)

## Context

The debate produced ArchLucid's promise-and-refuse contract. R4 made the **business outcome the single non-inferable origin** but allowed ArchLucid to propose candidates and to label every other input as asserted or inferred. R5 distinguished **hard** infeasibility (a provable contradiction or physical law — CAP, speed-of-light RTT) from **soft** infeasibility (economic/empirical — "five-nines on $15/month"). R6 committed to **fail open with a loud label** for soft cases.

Two owner rulings bind this ADR:

1. **The asymmetry rule (R5):** a *false-hard* — declaring "impossible" what is merely expensive — is the worse error, because it is a confident "no" with false authority and is the false-rejection failure R6 optimizes against. Therefore **classify HARD only on a demonstrable contradiction or law; when uncertain, it is SOFT.**
2. **The transparency conditional (R4):** "if ArchLucid gets it wrong, the user got it wrong" is only fair *if* ArchLucid was fully transparent about what was asserted, what was inferred, and which MUST/SHOULD questions were skipped. The owner ratified that **the transparency record is a mandatory output, not optional polish** — it is the precondition that earns the liability stance.

ArchLucid already has an invariant catalog (ADR 0035), provenance work (TB-034), and claim labeling (SAQ-011) to build on.

## Decision

1. **Feasibility verdict is a typed, three-value result:** `Feasible | SoftInfeasible | HardInfeasible`.
   - `HardInfeasible` **requires a citation** — a named theorem, law, or a demonstrably contradictory invariant pair (the "unsat core"). Without a citation, a verdict may **not** be `HardInfeasible`. Confidence is fixed at 100 and the citation is mandatory.
   - `SoftInfeasible` carries a **confidence band + an envelope** (e.g. "holds below scale T, breaks above it") and the assumption that makes it soft, plus the cost of being wrong.
   - The default under uncertainty is `SoftInfeasible` (the asymmetry rule), never `HardInfeasible`.
2. **Over-constrained designs emit the minimal conflicting invariant set** (the unsat core), reusing the `INV-*` catalog from ADR 0035, not a vague "relax something."
3. **ArchLucid proposes relaxations; the human disposes.** The engine surfaces the trade-off and never silently relaxes a residency/availability/cost target.
4. **A `TransparencyTrail` is a mandatory output on every verdict.** It has three sections: `Asserted[]` (what the user stated), `Inferred[]` (what ArchLucid filled, each with a 1–100 confidence), and `Skipped[]` (every MUST/SHOULD question not answered, with its tier). A verdict produced without a complete trail is a defect, not a degraded-but-acceptable result.
5. **The trail composes with existing surfaces.** It serializes into the manifest/provenance output (TB-034) and its claim labels align with SAQ-011 so that any externally-quoted claim carries its evidentiary basis.
6. **Contract + classification rules in this ADR; pipeline wiring is downstream.** Types and the classification decision table are defined here; attaching them to the authority pipeline output is a later implementation step gated on ADR 0048.

## Trade-offs

Biasing classification toward `SoftInfeasible` **gains** protection against the most damaging error (a false, authoritative "no" that kills a viable idea) and keeps the human in control of business-risk relaxations; it **gives up** decisiveness — ArchLucid will sometimes say "probably not, here's the envelope" where a bolder tool would just say "no," which can read as hedging. Making the transparency trail **mandatory** **gains** a defensible liability posture and user trust, while **giving up** output brevity and adding a hard failure condition (no trail ⇒ defect) that the pipeline must always satisfy. We **reject** treating hard/soft as a confidence gradient on a single axis (it blurs the categorical "a law forbids this" from "this is merely costly") and **reject** making the trail optional or best-effort (which would silently re-open the liability hole the owner closed).

## Constraints

- **`HardInfeasible` is citation-gated** — the type system / validators must make it impossible to emit a hard verdict without a law/contradiction reference. This is the load-bearing constraint of the ADR.
- **Reuse the `INV-*` catalog (ADR 0035)** for the unsat core; do not invent a parallel invariant identifier scheme.
- **Trail must serialize through existing provenance (TB-034)** and label claims per SAQ-011 — no new, divergent provenance store.
- Confidence is a **1–100** scale consistent with R2's quality model and ADR 0049's actor confidence; do not introduce a second confidence convention.
- The trail carries user-supplied free text (asserted items) and is therefore subject to content-safety and tenant-isolation handling like any other user data.

## Expected impact

- **System:** a typed verdict + trail flowing out of scoring; over-constrained runs gain a machine-readable unsat core.
- **Security posture:** positive and subtle — the trail makes *inference* auditable, so a wrong outcome can be attributed (user-asserted vs ArchLucid-inferred), which is both a trust and a liability control; skipped-MUST visibility prevents silent under-specification from masquerading as a confident verdict.
- **Operations:** verdicts become larger and richer; downstream consumers (UI, exports, PR gates) must render the trail; a missing-trail assertion becomes a pipeline health signal.
- **Cost:** negligible compute; the real cost is discipline — every output path must populate the trail.
- **Teams:** scoring/decisioning owns the classifier and citation gate; front-end renders the asserted/inferred/skipped breakdown and the "ArchLucid proposes, you dispose" relaxation UX.

## Consequences

- **Positive:** ArchLucid can say a *defensible* "no," a credible "probably not, here's the envelope," and always shows its work — the core of the R13 "decision-as-product" value.
- **Negative:** more verbose outputs; a new always-on invariant (trail completeness) that the pipeline must never violate.
- **Follow-ups:** wire the verdict + trail into the authority pipeline output (post-ADR 0048); ensure ADR 0049 inferred actors land in `Inferred[]`; align export/PR-gate renderers with the new shape; confirm SAQ-011 claim labels map 1:1 to trail entries.
