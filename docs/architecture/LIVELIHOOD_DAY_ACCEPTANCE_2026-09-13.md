> **Scope:** Close audit — livelihood UX wave 33 (livelihood-day / **LY**). Internal engineering only.

# Livelihood-day acceptance — 2026-09-13

**Wave:** 33 (**LY-001–LY-120**). **ADR:** [0099](adrs/0099-semantic-support-llm-judge-default-on-finalize.md) (**Accepted** 2026-09-13). **Index:** [`.cursor/prompts/livelihood-day-00-index.md`](../../.cursor/prompts/livelihood-day-00-index.md). **Residuals:** [`LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUALS.md`](LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUALS.md). **Inventory:** [`LIVELIHOOD_DAY_UNCHECKED_FINALIZE_INVENTORY.md`](LIVELIHOOD_DAY_UNCHECKED_FINALIZE_INVENTORY.md).

## Kernel shipped in the judge PR (LY-001–012)

| Item | Status |
|------|--------|
| ADR 0099 Real finalize judge default-on; emit stays off | **Shipped** (now **Accepted**) |
| Premium judge wired on non-Simulator composition; NoOp remains Decisioning default | **Shipped** |
| Finalize/readiness call judge before Unsupported hold | **Shipped** |
| Overlay stamp `as099-llm-finalize-v1` | **Shipped** |
| Faithfulness: no invented Supported; no exact-quote demotion; fail-open | **Shipped** |
| Simulator/Fallback skip | **Shipped** |
| Warn-not-block / PilotStrict hold default unchanged | **Shipped** |
| CONFIGURATION_REFERENCE + catalog keys | **Shipped** |
| Contract doc emit vs finalize split | **Shipped** |
| Prompt pack `FindingSemanticSupportBandLlmJudgePrompts` | **Shipped** |

## Honesty / export / help shipped this batch (LY-013–020, 076, 080, 081)

| Item | Prompt | Status |
|------|--------|--------|
| Host JSON opt-out only; no tenant finding-engine-controls key | LY-013 | **Shipped** (documented) |
| Unchecked decision-grade + citations inventory | LY-014 | **Shipped** |
| Prompt pack mitigations | LY-015 | **Shipped** (kernel PR) |
| Cost honesty: reuse `IAgentTierCompletionRouter`; no new wallet; cap leftover | LY-016 | **Shipped** (doc + residual) |
| Workspace Finding engines copy: insight-density ≠ finalize semantic judge | LY-017 | **Shipped** |
| Export/stamp overlay scorer version when present | LY-018 / 076 / 080 / 081 | **Shipped** |
| `/help/findings` Record finalize may rescore Unchecked | LY-019 | **Shipped** |
| Contract emit vs finalize | LY-020 | **Shipped** (kernel + this batch) |
| As075 keeps AS-074 and 0099 | LY-115 | **Shipped** |

## Object leftovers close-confirmed against existing SG tests (do not re-run SG bodies)

LY-021–023 close against `resolve-working-findings-instrument-href`, `finalize-success-desk-href`, and `system-gravity-instrument-after-spawn-guard`. Remaining LY-024–040 stay named leftovers unless a later session finds remaining exile hrefs.

## Collab / reversibility this batch

| Item | Prompt | Status |
|------|--------|--------|
| Work-lease without presence; expiry copy is write-blocked not vanished | LY-056 / 057 / 067 | **Shipped** (copy) |
| Draft undo inventory: in-tab only; do not unseal | LY-041 | **Named leftover** (300s skip is LY-043) |

## Skips (intentional)

| Skip | Prompt |
|------|--------|
| G-REAL-06 / host Mode flip | LY-116 |
| Draft-diff Compare | LY-046 / LY-117 |
| Presence avatars / finding-comment chat | LY-058 / LY-059 / LY-118 |
| Lengthen 300s undo | LY-043 |

## Paste-ready leftovers (do not claim done)

LY-024–040 (except 021–023 close), LY-042, LY-044–045, LY-047–055, LY-060–066, LY-068–075, LY-077–079, LY-082–105 remain one-prompt leftovers. **Do not** claim SG-082–120 shipped. **Do not** claim G-REAL-06. **Do not** claim draft-diff Compare or live presence.

## Ratchets

- `ArchitectureSpineAs074LlmJudgeDefaultOffArchitectureTests` (emit)
- `ArchitectureSpineAs099LlmJudgeDefaultOnFinalizeArchitectureTests` (Accepted)
- `ArchitectureSpineAs075SemanticContractDocArchitectureTests` (AS-074 + 0099)
- `ArchitectureSpineAs071ExportJsonIncludesBandArchitectureTests` (overlay version helpers)
- `archlucid-ui/src/lib/livelihood-day-prompt-inventory.test.ts` (LY-119)
- `archlucid-ui/src/lib/livelihood-day-out-of-wave-residuals.test.ts` (LY-117 / 118)
- `archlucid-ui/src/lib/livelihood-day-sg-leftover-close.test.ts` (LY-021–023)
