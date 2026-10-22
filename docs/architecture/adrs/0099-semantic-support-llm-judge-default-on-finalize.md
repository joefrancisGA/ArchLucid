> **Scope:** ADR 0099 — Semantic support Premium LLM judge is default-on for Working Career Real finalize; emit stays heuristic.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0099: Semantic support LLM judge default-on for Real finalize

- **Status:** Accepted
- **Date:** 2026-09-13
- **Evidence:** `ArchitectureSpineAs099LlmJudgeDefaultOnFinalizeArchitectureTests`, `FindingSemanticSupportBandFinalizeJudgeTests`, `PremiumFindingSemanticSupportBandLlmJudgeTests`

## Context

ADR **0085** (Proposed) put a per-finding **semantic support band** on Working career surfaces and kept **warn-not-block** at finalize. TB-1228 forbids fusing RAG/LLM faithfulness into the **sync emit/commit gate**. AS-074 / LN-025 left the Premium semantic-support judge **default off** so findings merge would not pay a sync LLM tax.

The remaining livelihood defect: Working Career **Real** finalize still stamps **Unchecked** from the quote-overlap heuristic (AS-057) even when cited excerpts actually back a paraphrase. Architects sitting in the seat all day then export or defend an Unchecked strip that a Premium judge would have resolved — or, worse, never see a disjoint citation called **Unsupported** until an ARB. Emit staying heuristic is still correct. Finalize is the honesty moment.

**Rejected alternatives:**

- **Default-on LLM at emit/merge** — rejected by TB-1228 / LN-025; latency and correlated model failure on every findings merge.
- **Block seal on LLM Unchecked/Unsupported** — rejected by ADR 0085; PilotStrict hold on Unsupported stays opt-in (AS-065).
- **Flip host `AgentExecution:Mode` to Real** — G-REAL-06; out of scope.
- **Rewrite ADR 0085 body** — immutability; this ADR supersedes the *finalize default-off* implication of AS-074 / LN-025 only.

**Related (not rewritten):** ADR 0082 (structural provenance persist gate), ADR 0085 (band is not a commit gate), ADR 0070 (insight-density non-fusion), TB-1228 / TB-1229, LN-025 (LN-wave skip remains historically not-shipped).

## Decision

1. **Emit stays heuristic.** `ArchLucid:Findings:SemanticSupportBand:EnableLlmJudge` remains **false**. Findings merge does not call the Premium judge unless an operator opts in.
2. **Finalize/readiness default-on for Real.** `EnableLlmJudgeOnFinalize` defaults **true**. `FindingSemanticSupportBandFinalizeJudge` runs on Unchecked (or null-band) **decision-grade** rows with citations **before** `UnsupportedSemanticSupportFinalizeHoldEvaluator`.
3. **Simulator / Fallback never judge.** `FindingSemanticSupportBandFinalizeJudgePolicy.ShouldRun` is false unless `StructuralExecutionMode` is **Real**, regardless of the flag.
4. **Warn-not-block unchanged.** LLM bands do not become a seal gate. PilotStrict hold on Unsupported stays opt-in default **false**.
5. **Fail-open.** Unparsable JSON, faithfulness reject, or completion errors retain the heuristic band. The judge **must not** invent **Supported** from a disjoint (heuristic **Unsupported**) citation set, and **must not** demote an exact-quote **Supported** heuristic to **Unsupported**.
6. **Persist overlay stamp** `as099-llm-finalize-v1` via the existing overlay table (AS-060). Sealed finding prose is not rewritten.
7. **Host wiring.** Decisioning still `TryAddSingleton` `NoOpFindingSemanticSupportBandLlmJudge`. Non-Simulator agent execution composition replaces it with `PremiumFindingSemanticSupportBandLlmJudge`.

### FAQ (quote in reviews)

| Question | Answer |
|----------|--------|
| Is the LLM judge default-on at emit? | **No.** AS-074 emit flag stays false. |
| Is it default-on at Real finalize? | **Yes.** ADR 0099. Simulator still skips. |
| May we block seal because the judge said Unchecked? | **No.** Warn-not-block (0085). |
| Did LN-025 ship this? | **No.** LN-025 remains an LN-wave skip; this ADR owns finalize default-on. |

## Trade-offs

**Gains:** Working Career Real finalize can resolve paraphrase Unchecked rows to Supported when excerpts actually back the claim, and can keep Unsupported honest when excerpts are disjoint. Overlay stamp distinguishes heuristic emit (`as057-v1`) from finalize LLM (`as099-llm-finalize-v1`). Architects defending a sealed record see a band that is not only exact-quote overlap.

**Sacrifices:** Real finalize pays Premium completions for Unchecked decision-grade rows (latency and Azure OpenAI cost). Fail-open means a downed model leaves heuristic Unchecked in place (warn strip still shows). Operators who want zero finalize LLM spend must set `EnableLlmJudgeOnFinalize` to false. Faithfulness rules refuse some true-semantic Supported upgrades when the heuristic already scored Unsupported (disjoint token overlap) — those stay Unsupported rather than risk invented green chips.

**Rejected:** Sync LLM on merge; blocking seal on judge output; Simulator judging as if Real; rewriting 0085 to claim default-on emit.

## Constraints

- Do not rewrite ADR 0085, 0082, or 0070 bodies — Related pointers only.
- Do not flip host `AgentExecution:Mode` (no G-REAL-06).
- Do not merge `DraftRequests` and `Runs`. Do not unseal sealed records (ADR 0039).
- Do not fuse support band into `DeterministicInsightDensityGate` (AS-066).
- Do not add a 40th coverage engine. Do not lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- Do not invent live presence or finding-comment chat.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Tenant isolation on overlay upsert (ADR 0037); no cross-tenant overlay write.
- SQL stays in `ArchLucid.Persistence/Scripts/ArchLucid.sql` — this ADR adds no table (reuses `dbo.FindingSemanticSupportBandOverlays`).
- Prompt pack in `FindingSemanticSupportBandLlmJudgePrompts` must forbid invented citations and seal language.

## Expected impact

**System:** Real finalize/readiness call `IFindingSemanticSupportBandFinalizeJudge` before Unsupported hold; overlays persist `as099-llm-finalize-v1` for rescored rows. Emit/merge path unchanged. Simulator finalize still presents rehearsal honesty (AS-068).

**Security:** Completions send finding claim text and already-cited excerpts to Azure OpenAI on Real finalize only. No new secrets. No tenant identifiers in the user prompt beyond claim/excerpt content already in the findings snapshot. Fail-open prevents a poisoned or malformed model reply from minting Supported out of disjoint citations. Overlay writes stay workspace-scoped.

**Operations:** Host JSON default `EnableLlmJudgeOnFinalize=true`; operators disable per environment. No SQL migration. Architecture ratchet `ArchitectureSpineAs099LlmJudgeDefaultOnFinalizeArchitectureTests`.

**Cost:** Extra Premium completions proportional to Unchecked decision-grade rows with citations at Real finalize, billed through the existing `IAgentTierCompletionRouter` pipeline (no separate judge wallet). Emit path adds none. Simulator adds none. Operators disable spend with host JSON `ArchLucid:Findings:SemanticSupportBand:EnableLlmJudgeOnFinalize=false`. There is no tenant `finding-engine-controls` key for this flag — do not confuse it with insight-density `EnableLlmJudge`. No per-snapshot Unchecked-row cap shipped; leftover if a hard cap is later required.

**Teams:** Engineering ships LY-001–012 with this ADR; remaining LY prompts own desk/reversibility/collab leftovers without re-running SG-001–081. Overlay scorer version `as099-llm-finalize-v1` is the export stamp when present.

## Consequences

- **Positive:** Finalize honesty can confirm paraphrase support without making LLM faithfulness a commit gate; emit stays cheap and deterministic.
- **Negative:** Real finalize latency and spend increase with Unchecked row count; fail-open can leave Unchecked when the model is down.
- **Follow-ups:** LY prompt set (wave 33) for remaining livelihood-day leftovers; tenant override UI copy; stamp/export may show `as099-llm-finalize-v1` when overlays are present.
