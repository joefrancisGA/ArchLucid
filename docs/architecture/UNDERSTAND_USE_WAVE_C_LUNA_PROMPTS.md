> **Scope:** Paste-ready GPT-5.6 Luna prompts for the third ten understand-and-use sessions. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/understand-use-21-path-kind-words.md`](../../.cursor/prompts/understand-use-21-path-kind-words.md), [`.cursor/prompts/understand-use-22-resource-names.md`](../../.cursor/prompts/understand-use-22-resource-names.md), [`.cursor/prompts/understand-use-23-view-counts.md`](../../.cursor/prompts/understand-use-23-view-counts.md), [`.cursor/prompts/understand-use-24-sponsor-read-first.md`](../../.cursor/prompts/understand-use-24-sponsor-read-first.md), [`.cursor/prompts/understand-use-25-two-finding-audiences.md`](../../.cursor/prompts/understand-use-25-two-finding-audiences.md), [`.cursor/prompts/understand-use-26-failed-load.md`](../../.cursor/prompts/understand-use-26-failed-load.md), [`.cursor/prompts/understand-use-27-page-help.md`](../../.cursor/prompts/understand-use-27-page-help.md), [`.cursor/prompts/understand-use-28-analysis-delta.md`](../../.cursor/prompts/understand-use-28-analysis-delta.md), [`.cursor/prompts/understand-use-29-sticky-next-action.md`](../../.cursor/prompts/understand-use-29-sticky-next-action.md), [`.cursor/prompts/understand-use-30-severity-meaning.md`](../../.cursor/prompts/understand-use-30-severity-meaning.md)

# Understand and use, wave C — Luna prompts

**Created:** 2026-09-26 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index. Wave A is [`UNDERSTAND_USE_LUNA_PROMPTS.md`](UNDERSTAND_USE_LUNA_PROMPTS.md). Wave B is [`UNDERSTAND_USE_WAVE_B_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_B_LUNA_PROMPTS.md).

| ID | Prompt | Intent |
|----|--------|--------|
| **UU-21** | [understand-use-21-path-kind-words.md](../../.cursor/prompts/understand-use-21-path-kind-words.md) | Ranked rows use a plain path-kind label |
| **UU-22** | [understand-use-22-resource-names.md](../../.cursor/prompts/understand-use-22-resource-names.md) | Hop ends lead with the resource name |
| **UU-23** | [understand-use-23-view-counts.md](../../.cursor/prompts/understand-use-23-view-counts.md) | Each path view says how many rows it keeps |
| **UU-24** | [understand-use-24-sponsor-read-first.md](../../.cursor/prompts/understand-use-24-sponsor-read-first.md) | A sealed package opens with three sponsor sentences |
| **UU-25** | [understand-use-25-two-finding-audiences.md](../../.cursor/prompts/understand-use-25-two-finding-audiences.md) | Architecture findings and SecureNow findings say which queue they are |
| **UU-26** | [understand-use-26-failed-load.md](../../.cursor/prompts/understand-use-26-failed-load.md) | A failed path load says what failed, what remains, and the retry |
| **UU-27** | [understand-use-27-page-help.md](../../.cursor/prompts/understand-use-27-page-help.md) | Remediation factory and diagrams open their own help topic |
| **UU-28** | [understand-use-28-analysis-delta.md](../../.cursor/prompts/understand-use-28-analysis-delta.md) | Activity says how many findings this analysis added |
| **UU-29** | [understand-use-29-sticky-next-action.md](../../.cursor/prompts/understand-use-29-sticky-next-action.md) | The one next action stays visible while the review scrolls |
| **UU-30** | [understand-use-30-severity-meaning.md](../../.cursor/prompts/understand-use-30-severity-meaning.md) | The first severity chip says what that severity asks for |

**UU-21** before **UU-23** when both will land. Every other prompt can run alone.

## Do not pull into these sessions

- Hiding review workspace tabs, or moving a primary tab into More
- A new confidence percentage or a new buyer-facing composite score
- Azure write APIs, terraform apply, or a new collector
- Renaming `PathKind`, `ProvenanceKind`, or `PathConfidenceBand` enum values
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**

## Wave D

The next ten sessions live in [`UNDERSTAND_USE_WAVE_D_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_D_LUNA_PROMPTS.md). Paste those files one at a time. Do not implement them from this page.
