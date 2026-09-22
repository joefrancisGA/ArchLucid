> **Scope:** Copy-paste Composer prompts — Livelihood-day Composer prompts (LY-001–LY-120). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/livelihood-day-00-index.md`](../../.cursor/prompts/livelihood-day-00-index.md) (**LY-001–LY-120**)
> **Predecessor:** [`SYSTEM_GRAVITY_COMPOSER_PROMPTS.md`](SYSTEM_GRAVITY_COMPOSER_PROMPTS.md) (**SG**, shipped) · [`LIVELIHOOD_GRADE_NO_COMPOSER_PROMPTS.md`](LIVELIHOOD_GRADE_NO_COMPOSER_PROMPTS.md) (**LN**, shipped)

# Livelihood-day Composer prompts (LY-001–LY-120)

**Created:** 2026-09-13 · **Status:** in progress (ADR **0099** **Accepted**; kernel LY-001–012 plus honesty/export/help/object leftover close including LY-101–103/skips) · **Do not re-run** SG-001–081 except as a numbered leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record.

Paste **one** `.cursor/prompts/livelihood-day-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

**Stamp leftover:** Working Career Real finalize still used the quote-overlap heuristic with the Premium semantic-support judge **default off** (AS-074 / LN-025). Unchecked paraphrase rows reached seal honesty without a fail-open LLM pass. ADR **0099** turns the judge **on for Real finalize only**. Emit stays off. Warn-not-block stays.

**Also named (not re-run as SG bodies):** remaining desk-object leftovers after SG-001–081, reversibility (in-tab undo, no 300s lengthen, no draft-diff Compare), collab (lease without presence), density/extraction honesty, throughput.

### Done test (kernel)

After LY-001–012:

1. Real finalize/readiness runs the Premium semantic-support judge on Unchecked decision-grade rows with citations.
2. Emit `EnableLlmJudge` remains false. Simulator/Fallback skip the finalize judge.
3. Faithfulness rejects invented Supported and exact-quote demotion. Fail-open keeps heuristic on errors.
4. Overlay stamp `as099-llm-finalize-v1`. No new SQL table.
5. Host `AgentExecution:Mode` default unchanged. No G-REAL-06.

## Diagnosis → prompt

| Cluster | Prompts |
|---------|---------|
| Kernel + judge (ADR 0099) | **LY-001–020** |
| Object leftovers (do not paste SG-082–120 bodies) | **LY-021–040** |
| Reversibility | **LY-041–055** |
| Collab (lease honesty; **no** presence/chat) | **LY-056–070** |
| Stamp / density / extraction | **LY-071–090** |
| Throughput | **LY-091–105** |
| Ratchets | **LY-106–115** |
| Skips / close | **LY-116–120** |

## Sequencing

See [`.cursor/prompts/livelihood-day-00-index.md`](../../.cursor/prompts/livelihood-day-00-index.md). **ADR → wiring → faithfulness → contract → leftovers → ratchets → close.**

Load-bearing: **LY-001** (contract) and **LY-005** (call sites). Without 005, the flag is theater.

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s.
- ADR 0068 two kernels and two SQL tables stay.
- Sealed records stay immutable.
- Guided / demo / trial **remain** eval sessions.
- `AgentExecution:Mode` host default **Simulator** stays; Record vs Practice is chrome + stamp (no G-REAL-06).
- No live presence / finding-comment chat / per-architecture ACL beyond RestrictToShares (0087).
- No 40th coverage engine.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Do **not** remount CE Sketch runner. Do **not** draft-diff Compare. Do **not** re-run DW wait.
- Do **not** re-run SG-001–081.

## Global constraints

See the index. Working-tree safety; TB-645; TB-2005; focused tests; scoped compile; OpenAPI when wire changes.
