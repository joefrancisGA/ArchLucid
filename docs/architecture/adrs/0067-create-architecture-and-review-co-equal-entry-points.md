> **Scope:** ADR 0067 — Create architecture and Review are co-equal entry points, not sequential lifecycle steps.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0067: Create architecture and Review as co-equal entry points

- **Status:** Accepted
- **Date:** 2026-08-12

## Context

ArchLucid exposes two top-level jobs an operator can start: **Create architecture** (generative — describe, upload, or connect inventory to produce an architecture draft) and **Review** (evaluative — analyse architecture evidence to produce findings and a signed review record). Both are reachable from the sidebar, Home, hub headers, empty states, the command palette, and the tour.

Until this decision the UI did not treat them as peers. Home framed them as ordered steps of a single funnel — `"Step 1 — Describe, import, or connect"` and `"Step 2 — Run a governed review"` under a lead reading `"One lifecycle: … then run a governed review, the durable work item."` The Create card explained itself by what it fails to do (*"Saving a draft does not start a review"*) rather than by what it produces, and `/architecture/reviews` carried a matching hint that *"the review remains the durable work item."* The framing was also **enforced**: `buyer-polish-copy-home-lifecycle.test.ts` asserted the `Step 1` / `Step 2` prefixes, pinned the `One lifecycle:` lead verbatim, and explicitly forbade peer phrasing such as *"Create an architecture, review an existing design"*. Guard coverage was lopsided in the same direction — `operator-primary-cta-inventory.ts` marked `reviews-hub` `status: "verified"` while `architectures-list` remained `status: "coordinate"`.

A usability pass surfaced two defensible readings of the resulting confusion. The first treats the two CTAs as **duplicate doors to one job** and resolves it by demoting draft creation to a `Resume` / `Continue` affordance behind a single primary `Start review`. The second treats them as **two genuinely different jobs** whose presentation wrongly implies precedence. The owner selected the second reading: the two paths are products of equal standing, and the defect is that the product ranked them. This ADR records that choice so the ranked framing is not reintroduced by the next copy or IA change, and so agents have a checkable rule rather than an aesthetic preference. Audience: UI contributors, copywriters, and coding agents working under `archlucid-ui/`.

## Decision

1. **Create architecture and Review are co-equal entry points.** Neither is the other's prerequisite in user-visible copy, navigation weight, or CTA hierarchy.
2. **No ordinal or funnel framing on surfaces where both appear.** Banned in buyer-facing copy: `Step 1` / `Step 2` prefixes on the pair, `One lifecycle`, and ranking predicates such as *the durable work item*. Each path states its own outcome positively instead of being defined by what the other does.
3. **Equal CTA weight when co-located.** Where both appear on one surface, they render at the same button `variant` and `size` and at the same heading scale. The per-hub single-primary contract (**TB-1539** / **TB-1544**) is unchanged — parity is a *cross-surface* rule about the pair, not a licence for two primaries inside one hub.
4. **Symmetric guard coverage.** Both members of the pair carry `status: "verified"` rows in `OPERATOR_PRIMARY_CTA_INVENTORY`. Neither path may be audited for CTA weight while the other is not.
5. **Parity of entry points and jobs — explicitly not parity of artifacts.** An architecture draft is mutable and unsigned; a signed review record is sealed, governed, and export-bearing. Copy must keep that distinction and must never imply a draft is a governed or signed artifact.
6. **Emphasis must derive from workspace state, not product preference.** The existing `emphasizedPath` / `Recommended next` mechanism stays legal because callers pass it from workspace readiness (for example: drafts exist, or no review has run yet). A hard-coded preference for either path is not legal.

## Trade-offs

Co-equality **gains** alignment with what the product actually does: two distinct jobs with distinct outputs, each able to carry a positive outcome statement instead of the Create path being introduced by its deficiency. It removes the mismatch where a user who wanted to draft an architecture was told they were on step one of someone else's funnel, and it keeps the generative and evaluative halves independently describable in sales and help material rather than collapsing the narrative into a single review funnel.

It **gives up** real onboarding clarity. A numbered lifecycle is genuinely easier for a first-run operator than two peer doors, because it answers "what do I do first?" without requiring the user to self-classify before they have learned the vocabulary. It also gives up the funnel narrative that pointed every new user at the review path, which is the revenue-bearing outcome under ADR 0052, so first-session conversion to a finalized review may fall even as path-selection accuracy rises. Finally it adds standing maintenance cost: parity is not visually obvious in review, so it needs a guard, and every future copy change on these surfaces must be checked against it.

We **reject** the competing option of a single primary `Start review` with draft creation demoted to `Resume` / `Continue`. That option is cheaper, gives a strictly simpler first run, and needs no new guard — but it misrepresents a first-class job as a subordinate step, and it would have forced renaming the Create surfaces away from a verb the product genuinely supports.

## Constraints

- **ADR 0052 (monetization posture)** licenses the expert operator's seat and makes the reasoned verdict a billable deliverable. Parity here is about entry points and UI standing only; it must not be read as revenue attribution, nor as a claim that architecture drafts are billable deliverables.
- **Claim-honesty discipline** (`docs/library/UI_DESIGN_SYSTEM.md`, `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`) forbids implying a draft is signed, governed, or audit-bearing. Decision point 5 is subordinate to those rules, which win on any conflict.
- **TB-1539 / TB-1544** single-primary-per-hub contract remains in force; this ADR must not be cited to justify two competing primaries on one hub.
- **Routes and wire identifiers are unchanged** — `/architecture/architectures/new` and `/architecture/reviews/new` keep their paths, and internal constant names retaining the word `LIFECYCLE` are identifiers, not buyer copy.
- **Scope is copy, inventory, and guards.** No new navigation framework, billing surface, or API change is authorized by this ADR.
- **ADR immutability** per [`README.md`](README.md): supersede with a new ADR rather than rewriting this one if the owner later prefers a single primary path.

## Expected impact

**System.** Buyer copy constants in `archlucid-ui/src/lib/buyer-copy/operator-home.ts` lose their ordinal prefixes and funnel lead; `/architecture/reviews` loses its ranking hint. No API, schema, persistence, or authorization surface changes, so there is no migration and no contract snapshot churn.

**Security.** No effect. The decision touches presentation copy and a test inventory only; no authentication, tenant-scope, or evidence-sealing path is involved.

**Operations.** One Vitest guard replaces the guard that previously enforced the opposite contract, so CI time is unchanged to within noise. The observable failure modes are precise: reintroducing a `Step N` prefix or the `One lifecycle` / `durable work item` framing on the pair fails the parity guard, and demoting either inventory row below `verified` fails it as well.

**Cost.** No infrastructure cost. The ongoing cost is reviewer attention on copy PRs touching Home and the two hubs.

**Teams.** Agents and contributors gain a falsifiable rule where previously they had a committed test asserting the opposite, which is the specific reason the ranked framing survived earlier usability passes. Support and go-to-market material describing a numbered two-step lifecycle will diverge from the UI until refreshed; that sweep is a follow-up, not a blocker.

## Consequences

- **Positive:** The pair is presented as two jobs with two outcomes; guard coverage becomes symmetric; future drift fails loudly instead of silently re-ranking the paths.
- **Negative:** First-run guidance weakens without a numbered path, and help, tour, and marketing copy still carry the old lifecycle narrative until swept.
- **Follow-ups:** Symmetric cross-navigation so `/architecture/architectures` offers a first-class jump to review (mirroring the draft-aware `ReviewsHubHeaderActions`); a copy sweep across help topics, the opt-in tour, and marketing for residual `Step 1` / `Step 2` lifecycle framing; promote or retire the remaining `coordinate` inventory rows.
