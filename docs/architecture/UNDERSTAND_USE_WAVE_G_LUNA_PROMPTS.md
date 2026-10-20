> **Scope:** Paste-ready GPT-5.6 Luna prompts for the priorities-and-waves readability sessions. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/understand-use-61-why-this-is-first.md`](../../.cursor/prompts/understand-use-61-why-this-is-first.md), [`.cursor/prompts/understand-use-62-score-behind-the-reason.md`](../../.cursor/prompts/understand-use-62-score-behind-the-reason.md), [`.cursor/prompts/understand-use-63-week-month-later.md`](../../.cursor/prompts/understand-use-63-week-month-later.md), [`.cursor/prompts/understand-use-64-waves-are-on-the-workbench.md`](../../.cursor/prompts/understand-use-64-waves-are-on-the-workbench.md), [`.cursor/prompts/understand-use-65-one-open-findings-count.md`](../../.cursor/prompts/understand-use-65-one-open-findings-count.md), [`.cursor/prompts/understand-use-66-resource-on-the-row.md`](../../.cursor/prompts/understand-use-66-resource-on-the-row.md)

# Understand and use, wave G — priorities and waves

**Created:** 2026-10-17 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index. Wave F is [`UNDERSTAND_USE_WAVE_F_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_F_LUNA_PROMPTS.md).

The remediation factory ranks findings with rule `IE15-priority-v1`. The rank can stay. A reader currently sees `Rule=IE15-priority-v1; Total=0.4200; Factors=11`, a four-decimal sort key, a subtitle that promises wave planning, and metric notes that argue with the numbers. This wave changes that reading. It does not change the score, the weights, or wave membership.

| ID | Prompt | Intent |
|----|--------|--------|
| **UU-61** | [understand-use-61-why-this-is-first.md](../../.cursor/prompts/understand-use-61-why-this-is-first.md) | The priority row says why it is first, in two short clauses |
| **UU-62** | [understand-use-62-score-behind-the-reason.md](../../.cursor/prompts/understand-use-62-score-behind-the-reason.md) | The four-decimal sort key sits behind that reason |
| **UU-63** | [understand-use-63-week-month-later.md](../../.cursor/prompts/understand-use-63-week-month-later.md) | Queue order reads as this week, this month, or later |
| **UU-64** | [understand-use-64-waves-are-on-the-workbench.md](../../.cursor/prompts/understand-use-64-waves-are-on-the-workbench.md) | The factory stops promising a wave planner it does not have |
| **UU-65** | [understand-use-65-one-open-findings-count.md](../../.cursor/prompts/understand-use-65-one-open-findings-count.md) | One open-findings number; measurement notes sit in one disclosure |
| **UU-66** | [understand-use-66-resource-on-the-row.md](../../.cursor/prompts/understand-use-66-resource-on-the-row.md) | The row names the resource |

**UU-62** after **UU-61**. The other sessions can run alone. **UU-66** must not replace the UU-61 sentence. **UU-63** must not replace rank.

## Do not pull into these sessions

- Hiding review workspace tabs, or moving a primary tab into More
- A new metric, a new weight, a percentage, or a second score formula
- An LLM call to write the row sentence
- Creating, assigning, or resizing a remediation wave
- Azure write APIs, terraform apply, or a new collector
- Renaming `RemediationRiskFactor`, disposition enums, `PathKind`, `ProvenanceKind`, or `PathConfidenceBand`
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**

This wave stops at **UU-66**.

## Wave H

The report-and-waves follow-on lives in [`UNDERSTAND_USE_WAVE_H_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_H_LUNA_PROMPTS.md). Paste that file on its own. Do not implement it from this page.
