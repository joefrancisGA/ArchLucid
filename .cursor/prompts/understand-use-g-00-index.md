<!-- Understand and use, wave G — Luna prompts. Paste one numbered file per session.
     Origin: 2026-10-17. Priorities and waves readability: a plain reason,
     the sort key behind it, week/month/later from rank, waves on the
     workbench, one open-findings count, and the resource name on the row.
     Do not implement from this index. -->

# Understand and use — Luna prompt set (UU-61–UU-66)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/understand-use-6N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/UNDERSTAND_USE_WAVE_G_LUNA_PROMPTS.md`](../../docs/architecture/UNDERSTAND_USE_WAVE_G_LUNA_PROMPTS.md).

Wave F is [`understand-use-f-00-index.md`](understand-use-f-00-index.md). Do not redo UU-01–UU-60 here.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Why first** | The summary cell shows `Rule=IE15-priority-v1; Total=0.4200; Factors=11`. | Two short clauses from the existing factor breakdown. The rule string stays in the disclosure. | **UU-61** |
| **Sort key** | The Score cell shows four decimals in the row. | The reason is visible. The sort key and its existing disclaimer open on demand. | **UU-62** |
| **When** | Rank is a number. | The same order also says this week, this month, or later. | **UU-63** |
| **Waves** | The factory subtitle says wave planning. The workbench prints `name: count / cap members`. | The factory links to the workbench. The workbench line says how many findings are in the wave. | **UU-64** |
| **Open findings** | Scope notes repeat the rule version and that another queue may differ. | One count stays visible. Those notes move into one disclosure. | **UU-65** |
| **Resource** | The row has a control id and the word Pattern. | The row also shows the resource name from the existing display helper. | **UU-66** |

## What this set does not change

Do not change `IE15-priority-v1`, weights, or rank order. Do not add a score. Do not call a model to write a sentence. Do not create a wave. Do not hide review workspace tabs.

## Run order

**UU-62** after **UU-61**. The other sessions are independent. **UU-66** keeps the UU-61 sentence. **UU-63** keeps the rank number. Do not revert another UU change that has already landed.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 61 | `understand-use-61-why-this-is-first.md` | `uu/61-why-this-is-first` |
| 62 | `understand-use-62-score-behind-the-reason.md` | `uu/62-score-behind-the-reason` |
| 63 | `understand-use-63-week-month-later.md` | `uu/63-week-month-later` |
| 64 | `understand-use-64-waves-are-on-the-workbench.md` | `uu/64-waves-are-on-the-workbench` |
| 65 | `understand-use-65-one-open-findings-count.md` | `uu/65-one-open-findings-count` |
| 66 | `understand-use-66-resource-on-the-row.md` | `uu/66-resource-on-the-row` |

Wave H is [`understand-use-h-00-index.md`](understand-use-h-00-index.md). Paste that file on its own. Do not implement it from this page.
