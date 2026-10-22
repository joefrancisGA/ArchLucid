<!-- Understand and use, wave H — Luna prompt. Paste the numbered file.
     Origin: 2026-10-18. Sort keys stay off the attack path report and the
     wave list. Operator queues keep Show sort key.
     Do not implement from this index. -->

# Understand and use — Luna prompt set (UU-67)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/understand-use-67-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/UNDERSTAND_USE_WAVE_H_LUNA_PROMPTS.md`](../../docs/architecture/UNDERSTAND_USE_WAVE_H_LUNA_PROMPTS.md).

Wave G is [`understand-use-g-00-index.md`](understand-use-g-00-index.md). Do not redo UU-61–UU-66 here.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Report and waves** | The attack path report shows a Score column and "composite sort". A selected finding prints the sort key in the inspect header. | The report and the wave list omit the sort key. Finding inspect opens it with "Show sort key". The operator queues keep that disclosure. | **UU-67** |

## What this set does not change

Do not change `IE15-priority-v1`, weights, or rank order. Do not delete the sort-key formatters. Do not hide review workspace tabs. Do not create a wave.

## Run order

This session stands alone. It keeps UU-31 and UU-62 on the operator queues.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 67 | `understand-use-67-sort-key-off-the-report.md` | `uu/67-sort-key-off-the-report` |
