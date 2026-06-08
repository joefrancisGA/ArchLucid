> **Scope:** ADR 0052 — Monetization posture (the reasoned "no" is the product; seat license for the expert operator).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0052: Monetization posture — decision-as-product, seat license for the expert operator

**Status:** Accepted
**Date:** 2026-06-07 (Accepted 2026-06-08)
**Deciders:** Owner + Architecture review
**Related:** [ADR 0014](0014-trial-enforcement-boundary.md) (trial enforcement), [ADR 0016](0016-billing-provider-abstraction.md) (billing abstraction), [ADR 0050](0050-feasibility-classification-transparency-trail.md), `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` (R6, R13)

## Context

The debate reframed what ArchLucid sells. R6 established that **a defensible "no" is a success, not a failure** — as many as ~90% of *ideas* may bounce, and that is a win because the user learns the idea has no traction and *why*, in ten minutes for ~$1 of GPU, versus ~$25k over weeks of human-architect time. R13 sharpened this into a monetization thesis the owner explicitly drove:

1. **Decision-as-product.** The deliverable is the *decision*, not the design. A reasoned "no" — with the unsat core (ADR 0050 / R5) and the transparency trail (ADR 0050 / R4) — is a complete, first-class, often more valuable product.
2. **Survivorship-bias moat.** Humans (and the AIs trained on their data) document successes far more than failures, so the market systematically *under-values* the credible "no." Competitors are trained to say "yes, here's a design" (hallucinated feasibility). A credible "no" is differentiated and hard to copy because it requires the discipline ArchLucid already commits to (hard/soft, unsat core, provenance).
3. **Pricing granularity — owner override.** The AI proposed pay-per-session/per-verdict. The **owner overrode this**: the typical user is not an anonymous one-shot dreamer but a **qualified repeat professional** — a senior developer, data-warehouse manager, or security SME, deep in one dimension and competent across others — who uses ArchLucid often and becomes the **org's hub** for design decisions, the way a business analyst approaches a DBA with specialized tools. ⇒ **Seat license for the expert operator**, not pay-per-session.

## Decision

1. **Position the reasoned "no" as a first-class, billable deliverable**, not an error state. A run that ends in `SoftInfeasible`/`HardInfeasible` (ADR 0050) produces a dignified, exportable, **cost-quantified** artifact — the receipt quantifies *avoided* cost ("ten minutes, ~$1, vs ~$25k over weeks") — never a dead-end page.
2. **Primary commercial model = per-seat license for the expert operator** (hub-and-spoke). License the **hub** (expert operators who drive the tool), not the **spokes** (downstream requesters who route problems through them) — the same economics as licensing DBAs, not everyone who asks a DBA for a data model.
3. **Reconciliation with R6 (recorded to prevent a false contradiction):** R6's "90% bounce is a win" is **per-*idea/session*, not per-*person***. The seatholder is retained by the tool's value to their job; individual ideas freely bounce — the high rejection rate is *why* the seat is worth holding. There is no conflict between "ideas bounce" and "seats renew."
4. **Reuse the existing billing abstraction (ADR 0016) and trial boundary (ADR 0014).** This ADR sets *posture*, not mechanism; seat enforcement rides the existing billing provider abstraction and usage-metering surfaces rather than a new billing system.
5. **Branch/what-if runs remain individually metered** (each is a billable full-pipeline run per the branching design), but metering is a *cost-attribution* concern under the seat, not a separate pay-per-use product.

## Trade-offs

A per-seat model for a repeat expert **gains** predictable recurring revenue, alignment with how specialized professional tools are actually bought, and freedom to let ~90% of *ideas* bounce without punishing the economics; it **gives up** the ability to monetize the long tail of one-shot anonymous users (who, per R6, are explicitly not the target) and decouples revenue from per-verdict value, so a heavy seatholder and a light one pay the same. We **reject** pay-per-session/per-verdict (the AI's initial proposal): it mispriced the persona, and per-question variants would create a perverse incentive to pad the Socratic loop — directly fighting ADR 0051's deterministic-first, minimal-MUST-set economy. The cost is leaving some usage-based upside on the table; the benefit is a model that matches the buyer and keeps product incentives clean.

## Constraints

- **Reuse ADR 0016 billing abstraction and ADR 0014 trial enforcement** — no new billing system; seat posture must express through existing provider abstractions (Stripe / Azure Marketplace) and idempotent seat handling.
- **The "no" artifact must be exportable and durable** — it rides the same export/evidence surfaces as a "yes," so a rejected run is not a second-class citizen in storage or export.
- **Cost-quantification claims on the receipt are marketing-adjacent** — any "~$25k / weeks avoided" figure must be labeled as an estimate per SAQ-011 claim-labeling discipline, not asserted as fact.
- This ADR is **posture only**; it must not pre-empt pricing-tier specifics (seat price points, included run volume) which are a go-to-market decision, not an architecture decision.

## Expected impact

- **System:** minimal — the main system requirement is that rejected runs produce first-class, exportable, cost-quantified artifacts (already implied by ADR 0050); seat enforcement reuses existing billing/metering.
- **Security posture:** neutral; licensing the hub (fewer privileged operator identities) is consistent with least-privilege and simplifies access governance versus licensing every spoke.
- **Operations:** seat management and metering reuse existing surfaces; the "no" receipt becomes a supported, tested output path rather than an afterthought.
- **Cost:** branch runs are attributed under the seat; the product's own cost story (~$1/run) must stay well inside seat economics for heavy hub users — a monitoring concern.
- **Teams:** go-to-market owns seat pricing tiers; product ensures the rejected-run experience is dignified; platform reuses ADR 0016/0014 plumbing.

## Consequences

- **Positive:** revenue model matches the real buyer (the expert hub), product incentives stay aligned with fast defensible answers, and the survivorship-bias moat is made explicit as a strategic asset.
- **Negative:** usage-based upside is forgone; a single seat can absorb very high (costly) usage, so per-seat run economics need monitoring.
- **Follow-ups:** define seat pricing tiers + included run volume (go-to-market); ensure the rejected-run artifact path is first-class in export/PR-gate surfaces; confirm cost-avoidance figures carry SAQ-011 estimate labels.
