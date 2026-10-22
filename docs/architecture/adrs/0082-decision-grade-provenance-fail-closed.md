> **Scope:** ADR 0082 — Decision-grade finding provenance fail-closed at emission and commit (livelihood-proof LP-01 / TB-1221 gates).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0082: Decision-grade finding provenance fail-closed at emission and commit

- **Status:** Proposed
- **Date:** 2026-09-08
- **Owner decision:** Execute TB-1221 structural provenance gates — hold or reject decision-grade rows without ProvenanceKind A or B (LP-01 / wave 20)

## Context

ArchLucid's liability stance (R4 / ADR 0052) requires a **cited record** architects can defend in ARB and sponsor email. ADR 0078 binds **career artifacts** (stamp, finalize, exports) to honesty validators — but those validators can still render decision-grade **labels** while `ArchitectureFinding.EvidenceRefs` remains empty at persist time.

TB-1221 published the structural contract in [`DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md`](../../library/DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md) (**contract Done**). TB-1222 honesty CI guards marketing overclaims. **Emission and commit validators remain follow-on** — this ADR is the durable decision reviewers cite when wiring LP-02–04.

Today:

- Typed engines may emit authority `Finding` rows with empty `RelatedNodeIds` or `RulesApplied` and still reach decision-grade surfaces.
- Agent paths may persist `ArchitectureFinding` with `[]` `EvidenceRefs` while classification stays decision-grade.
- `FindingCitationCoverageRatio` exists on `AgentOutputSemanticScore` but is **inert** on production commit paths.
- Critic Low, run-level `AgentResult.EvidenceRefs`, prompt instructions, and trust-label strings are mistaken for per-finding proof.

**Dual pipeline (ADR 0068):** typed engines and LLM agents remain separate kernels. This ADR does **not** merge streams, unseal records, or change insight-density demotion (ADR 0070).

**Related (not rewritten):** ADR 0039 (sealed immutability), ADR 0070 (density demotion), ADR 0073 (trail finalize gate), ADR 0076 (disposition 409), ADR 0078 (career artifact honesty), ADR 0080 (Working seat), ADR 0084 (`diagram:` package citations — AS-022; concrete for Kind B demotion, not TB-1228 faithfulness), `FindingFactory`, `FindingsOrchestrator`, `AgentResultParser`, `AgentOutputQualityGate`, `FindingClaimCoverageEvaluator`.

## Decision

1. **ProvenanceKind required for decision-grade:** A finding classified as **decision-grade** (`DecisionGradeFinding` or equivalent default on the agent path) must carry structural **ProvenanceKind A** (typed) or **B** (agent) before emission and before commit-eligible Real paths treat it as governance input.
2. **Kind A — typed engine:** Non-empty `RelatedNodeIds` **and** non-empty `RulesApplied` (or engine-specific payload trace that resolves to graph node IDs and rule IDs in the sealed manifest / topology).
3. **Kind B — agent LLM:** Non-empty per-finding `EvidenceRefs` **or** per-finding citations mapped from `AgentResult.Citations` / `AgentExecutionTrace.Citations` that resolve to sealed evidence package rows or allowlisted ref prefixes.
4. **Fail-closed emission:** Missing Kind A or B → **hold or reject** — never silently persist as decision-grade. Quarantine bands and desk copy must name withheld provenance (LP-05 dual-stream honesty).
5. **Exempt tiers:** Checklist coverage (`ChecklistCoverage`), advisory / heuristic rows, insight-density-demoted findings, and explicit low-confidence tiers are **exempt** from decision-grade provenance — they must not be sold as citation-bound (ADR 0078 alignment).
6. **Not ProvenanceKind:** prompt text, Critic confidence labels, run-level `AgentResult.EvidenceRefs` alone, insight-density scores, `TrustLabel` strings, and semantic faithfulness ratios (**TB-1228** / GTM M-209/M-210 — separate lane).
7. **Commit gate (Working Real PilotStrict):** `FindingCitationCoverageRatio` becomes a **commit signal** on Working Real PilotStrict Enforce/Block paths when LP-04 ships — **not** on Simulator default Mode. Simulator rehearsal remains honest via career-artifact labeling (LP-06), not by flipping `AgentExecution:Mode` default.
8. **Implementation waves:** LP-02 wires `IFindingProvenanceValidator` on typed persist; LP-03 holds agent decision-grade rows without citations; LP-04 wires citation coverage on Working Real PilotStrict. This ADR records the contract; validators are follow-on PRs.

## Trade-offs

**Gains:** PR review can answer “may this finding persist as decision-grade?” with one ADR; architects emailing sponsor PDFs defend structural citations, not prompt compliance; hold/reject bands surface missing proof before seal; checklist and advisory tiers stay fast without fake `EvidenceRefs`; honesty CI (TB-1222) and persist gates align.

**Sacrifices:** More hold-band noise when agents omit citations under time pressure; typed engines with sparse graph attachment fail where they previously slipped through; PilotStrict Real commits may block until citation ratio recovers; operators must learn ProvenanceKind A/B vs exempt tiers; LP-02–04 require coordinated TS/C# tests and desk bands.

**Rejected:** Treating prompt instructions or Critic Low as proof; run-level evidence bags as per-finding guarantee; silently downgrading decision-grade to advisory without desk visibility; flipping default `AgentExecution:Mode` from Simulator to Real; semantic faithfulness score as structural provenance; unsealing to backfill citations; adding a 40th coverage engine to “fix” empty refs.

## Constraints

- **Do not** rewrite Accepted ADR bodies 0067–0081 except **Related** pointers in follow-on PRs.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate (ADR 0070).
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** flip `AgentExecution:Mode` default from **Simulator** to Real — career-path honesty uses labeling and gates, not default Mode change.
- **Do not** collapse desktop review workspace tabs behind **More**.
- **Do not** invent per-architecture ACL, live presence, or finding-comment chat (ADR 0037).
- **Do not** claim semantic faithfulness or LLM-as-judge scores prove structural provenance (**TB-1228**).
- **TB-645 vocabulary** on operator-facing hold/reject copy. **TB-2005** on any new form surfaces.
- Terraform for net-new infra — validators should not require infrastructure beyond existing SQL/API paths.

## Expected impact

**System:** LP-02–04 add validators at `FindingsOrchestrator` persist, `AgentResultParser` post-parse, and `AgentOutputQualityGate` PilotStrict commit. Desk shows withheld provenance bands (LP-05). Career exports continue to call ADR 0078 validators; 0082 governs **persist eligibility**, 0078 governs **artifact honesty**.

**Security:** Fail-closed provenance reduces exfiltration of uncited decision-grade claims into sealed manifests and external sponsor artifacts; attackers cannot rely on empty-ref findings entering governance lift paths once gates ship. Simulator default Mode unchanged — rehearsal cannot be mistaken for production proof without explicit waiver (LP-06).

**Operations:** Support distinguishes hold-band (missing citations) vs engine failure vs PilotStrict block; on-call runbooks cite 0082 + TB-1221 contract; CI guard on ADR existence prevents paper-gate regression.

**Cost:** Engineering time for LP-02–04; negligible runtime (validator checks on persist/commit hot paths); possible increase in held findings during pilot until engines and agents attach refs consistently.

**Teams:** Principal architects get defensible “why was this finding withheld?” narrative; GTM must not claim all findings are citation-bound until gates ship (TB-1222 remains); DX insight-density work stays separate from provenance gates.

## Consequences

- **Positive:** Structural provenance becomes a merge-blocking question; TB-1221 contract gains an Accepted/Proposed ADR anchor; livelihood-proof wave can wire persist gates without rewriting 0078.
- **Negative:** Short-term friction on Real PilotStrict commits; hold-band UX must be taught (LP-05, LP-11); ITSM and dual-stream surfaces must stay aligned (LP-17).
- **Follow-ups:** LP-02 typed `IFindingProvenanceValidator`; LP-03 agent hold without citations; LP-04 `FindingCitationCoverageRatio` on Working Real PilotStrict; LP-08 ADR 0083 promote/activate same-tx audit (separate concern).
