> **Scope:** ADR 0048 — Socratic intake and the mutable draft-request lifecycle.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0048: Socratic intake — mutable draft-request lifecycle in front of the single-shot run create

**Status:** Accepted
**Date:** 2026-06-07 (Accepted 2026-06-08)
**Deciders:** Owner + Architecture review
**Related:** [ADR 0042](0042-canonical-run-write-surface.md) (canonical run write surface), [ADR 0049](0049-actor-descriptor-model.md), [ADR 0050](0050-feasibility-classification-transparency-trail.md), [ADR 0051](0051-question-selection-engine.md), `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` (R3, R7, R11), SAQ-013

## Context

Today the intake is **single-shot**: `POST /v1/architecture/request` binds an `ArchitectureRequest`, `ArchitectureRunAuthorityCoordination.CreateRunAsync` runs a **structural-only** `ValidateRequest` plus a content-safety precheck, and the request immediately becomes a run that drives the authority pipeline. There is no place to stand *before* a run exists: `AskService` is hard-anchored to a committed golden manifest (it throws when no run/manifest is in scope), so it cannot host pre-run reasoning.

The foundational debate (R3) established that **minimum-to-admit ≠ minimum-to-trust**: a user — often a naive *requester* mediated by an expert *operator* (R13) — arrives with vague intent that must be shaped through a Socratic loop (R7) before it is a designable request. R11 requires the actor set to be **inferred-then-confirmed**, which is inherently iterative. None of this is expressible against an immutable, single-shot create call.

SAQ-013 named the three fundamental additions this implies. This ADR commits the **first and largest**: a mutable draft-request lifecycle that sits *in front of* the existing create surface without replacing it.

## Decision

1. **Introduce a `DraftRequest` aggregate** distinct from `ArchitectureRequest`. A draft is the mutable workspace where intent is elicited, labeled (asserted vs inferred, per [ADR 0050](0050-feasibility-classification-transparency-trail.md)), and refined. It is **scoped** (tenant/workspace/project) like every other aggregate and carries a `schemaVersion` per ADR 0013.
2. **Lifecycle states:** `Drafting → Admitted → Submitted → RunSpawned` (plus terminal `Redirected` and `Abandoned`). Only `Drafting` is mutable. `Admitted` requires the **semantic admission gate** to have identified ≥1 actor (ADR 0049) and ≥1 functional outcome; failure routes to `Redirected` (**redirect, not refuse** — R6), never a hard 4xx for real-but-inarticulate intent.
3. **`Submitted` requires the MUST-set answered.** A draft may only transition to `Submitted` when every `MUST` question for the active pillars/packs is answered (ADR 0051). This is the deterministic admission-to-trust gate; `SHOULD` questions refine confidence but do not block.
4. **`RunSpawned` reuses the existing canonical write surface unchanged.** On submit, the draft is projected into an `ArchitectureRequest` and handed to the **existing** `POST /v1/architecture/request` path (ADR 0042). The draft lifecycle adds **no** second run-creation pipeline; it is strictly a pre-stage that produces the same `ArchitectureRequest` the system already consumes.
5. **New endpoints are draft-scoped only:** create/patch/get a draft, answer a question, request admission, and submit. They live under a new route group (e.g. `v1/architecture/draft/*`) and never touch committed run state.
6. **Branching (ADR-future / R12) clones a draft snapshot.** A what-if branch is a draft cloned with a minimal invariant override, then submitted as its own run; comparison reuses the existing Compare engine. This ADR only reserves the snapshot/clone capability on the aggregate; branch orchestration is a later ADR.

## Trade-offs

Adding a draft aggregate **gains** the entire Socratic capability (iterative elicitation, redirect-not-refuse, what-if branching) and keeps the trust gate deterministic and testable, while **giving up** the simplicity of a stateless intake: we take on a new mutable aggregate, new tables, new endpoints, and a new lifecycle state machine to maintain and secure. We deliberately **reject** mutating the existing `ArchitectureRequest` in place (which would blur the audit boundary between "still being shaped" and "submitted for review") and **reject** overloading `AskService` (which is correctly manifest-anchored and post-hoc). The cost is two intake concepts instead of one; the benefit is that the committed-run surface (ADR 0042) stays immutable and the draft stays freely mutable — a clean separation that protects idempotency and audit keying.

## Constraints

- **Must not introduce a second run-creation pipeline.** ADR 0042 made `v1/architecture/*` the canonical write surface with unified idempotency/audit; the draft lifecycle must terminate by calling that surface, not by spawning runs itself.
- **Tenant isolation applies fully** — draft tables are tenant/workspace/project-scoped and subject to the same fail-closed scope derivation (ADR 0041) and Roslyn scope guard (ADR 0047) as every other persistence path.
- **All DDL for a database in a single file** (house rule) — draft tables are added to the unified schema script, not a scattered migration set.
- **The VoI ranking that orders questions is still OPEN (O1-remainder)** — this ADR defines *where* questions are answered (the draft) but not *which order* they are asked; that is owned by ADR 0051 and explicitly deferred.
- Drafts are **not** evidence and are **not** sealed; retention/expiry of abandoned drafts is an operational policy, not a commit-immutability concern (contrast ADR 0039/0045).

## Expected impact

- **System:** a new bounded context (draft) with a state machine; the authority pipeline and committed-run surface are unchanged. Net new tables, repository, and a thin controller.
- **Security posture:** *reduced* blast radius versus the alternative — drafts are mutable and non-evidentiary, so they sit outside the sealed-evidence trust boundary; the admission gate adds a semantic filter before any pipeline spend. Drafts carry user free-text, so content-safety precheck must run at admission, not only at submit.
- **Operations:** abandoned drafts (R6 predicts ~90% of *ideas* bounce) accumulate and need a reaper job; draft volume is a new capacity/monitoring dimension.
- **Cost:** draft elicitation that ends in `Redirected`/`Abandoned` costs only deterministic question evaluation (no pipeline run) — cheap by design; only `Submitted` drafts incur authority-pipeline GPU cost.
- **Teams:** front-end gains a conversational intake surface (reusing existing `IConversationService` thread/message machinery); platform owns a new aggregate and reaper.

## Consequences

- **Positive:** unlocks the Socratic loop, redirect-not-refuse, and what-if branching while preserving ADR 0042's immutable committed-run surface; trust gate is deterministic.
- **Negative:** a genuinely new aggregate and state machine — the highest-risk item in the build-out; must not be one-shotted.
- **Follow-ups:** ADR 0049 (actor descriptor the draft confirms), ADR 0050 (asserted/inferred labeling stored on the draft), ADR 0051 (question engine that drives the draft), a future ADR for what-if branch orchestration, and resolution of O1-remainder before the LLM-fallback question tier is built.
