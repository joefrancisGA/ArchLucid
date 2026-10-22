> **Scope:** ADR 0049 — Actor descriptor model (the irreducible "who is the user" triple).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0049: Actor descriptor model — inferred-then-confirmed set of `(kind × trust-origin × contract)` triples

**Status:** Accepted
**Date:** 2026-06-07 (Accepted 2026-06-08)
**Deciders:** Owner + Architecture review
**Related:** [ADR 0048](0048-socratic-intake-mutable-draft-lifecycle.md), [ADR 0050](0050-feasibility-classification-transparency-trail.md), [ADR 0051](0051-question-selection-engine.md), `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` (R1, R11)

## Context

ArchLucid reviews architectures, and the debate (R1) converged on a first-principles claim: **every system has a primary interaction surface; the only open question is who the user is** — and a user is *either a human or a machine*. ArchLucid does not care whether a user is human or machine in the sense of preferring one, but it **must know**, because the answer parameterizes the dominant non-functional requirements (human → latency-in-seconds, interactive authN, accessibility, consent/PII; machine → throughput, service authN, idempotency, retry/backoff, contract versioning).

R11 sharpened this: the descriptor is **three irreducible axes**, not one, because trust-origin and interaction-contract are not derivable from human/machine (an employee and an anonymous visitor are both human but architecturally opposite). And real systems have **several** actors, so the descriptor is a **set**, with the *count* of distinct actors being the highest-value thing to get right — a missed actor is an entire unassessed attack surface and trust boundary.

There is no actor model in the contracts today. This ADR fixes the shape so [ADR 0048](0048-socratic-intake-mutable-draft-lifecycle.md)'s draft can confirm it and [ADR 0051](0051-question-selection-engine.md)'s engine can ask about it.

## Decision

1. **Define the actor descriptor as a triple over three enums:**
   - `ActorKind`: `Human | Machine | Both`
   - `TrustOrigin`: `Internal | External | PublicAnonymous`
   - `InteractionContract`: `Sync | AsyncBatch | Event | Streaming`
2. **A system carries an `ActorSet`** — a set of actor descriptors, not a single triple. The set's **cardinality is inferred first**; refining any single actor's axes is secondary.
3. **Each actor carries provenance:** an `Origin` of `Asserted | Inferred` and a `Confidence` (1–100), aligning with [ADR 0050](0050-feasibility-classification-transparency-trail.md). A confirmed actor is `Asserted`; an unconfirmed-but-proceeded actor is `Inferred` and lowers downstream scoring confidence.
4. **Inferred-then-confirmed, never a blank form.** ArchLucid infers the `ActorSet` from free-text intent and presents it as a pre-filled, labeled guess for confirmation/correction; the confirmation *is* the question. The single highest-value confirmation is **"are there other kinds of users I'm missing?"** before refining axes.
5. **Machine-actor scope discipline:** when an actor is a `Machine`, ArchLucid reviews **only up to the interaction contract** and treats the external system as a black box with a trust label — preventing "review my system" from recursing into "review everything it touches."
6. **Contract types only in this ADR.** No persistence, no endpoint, no `ArchitectureRequest` wiring here — those land in the draft (ADR 0048). Each type in its own file; concrete types; null checks.

## Trade-offs

A fixed three-axis enum model **gains** determinism (the actor set is a small, enumerable space the question engine and validators can reason over) and forces the architecturally load-bearing distinctions (trust origin, contract) to the surface instead of hiding them inside "human vs machine." It **gives up** expressiveness: real actors have nuances (a partially-trusted B2B partner, a delegated service-on-behalf-of-human) that three enums flatten. We **reject** free-form actor descriptions (unrankable, untestable, and they defeat the deterministic-first question engine) and **reject** collapsing to a single actor (the cheap modeling choice that would silently drop attack surfaces — the exact failure R11 warned against). The cost is occasional modeling friction at the edges; the benefit is a bounded, gradeable actor space.

## Constraints

- **Enums must be additive-friendly.** Future axes values (e.g. a `DelegatedMachine` kind) must extend without breaking serialization or existing packs that map questions to actor axes; treat the enum surface as a versioned contract under ADR 0013.
- **No persistence coupling** in this ADR — the `ActorSet` is a value object carried by the draft, not its own table, until ADR 0048's draft schema lands.
- **`Both` is a first-class value, not a modeling escape hatch** — systems with genuinely dual human+machine surfaces (e.g. an API with a console) are common and must be representable without forcing two separate actors when they share a trust boundary.
- Must compose with [ADR 0050](0050-feasibility-classification-transparency-trail.md)'s transparency trail: every `Inferred` actor must appear in the trail's inferred section.

## Expected impact

- **System:** a small set of value types in Contracts; no runtime behavior until consumed by the draft and question engine.
- **Security posture:** *materially positive* — making trust-origin an explicit, mandatory axis means anonymous/public surfaces can no longer be silently assumed internal; the actor-count-first rule directly targets missed-trust-boundary defects, the highest-severity class of architecture error.
- **Operations:** none initially (types only).
- **Cost:** negligible; pure contract work.
- **Teams:** gives front-end a stable shape to render the "confirm your users" intake step and gives policy-pack authors (ADR 0051) a vocabulary to scope questions by actor axis.

## Consequences

- **Positive:** the load-bearing "who is the user" question becomes a bounded, gradeable, provenance-tracked structure.
- **Negative:** three enums cannot capture every real-world trust nuance; edge cases will need policy-pack-level questions to disambiguate.
- **Follow-ups:** wire `ActorSet` into the draft (ADR 0048); have the question engine (ADR 0051) seed actor-axis questions from the five pillars; ensure inferred actors flow into the transparency trail (ADR 0050).
