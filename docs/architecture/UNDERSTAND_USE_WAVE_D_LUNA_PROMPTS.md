> **Scope:** Paste-ready GPT-5.6 Luna prompts for the fourth ten understand-and-use sessions. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/understand-use-31-score-is-sort-key.md`](../../.cursor/prompts/understand-use-31-score-is-sort-key.md), [`.cursor/prompts/understand-use-32-disposition-words.md`](../../.cursor/prompts/understand-use-32-disposition-words.md), [`.cursor/prompts/understand-use-33-findings-shortcuts.md`](../../.cursor/prompts/understand-use-33-findings-shortcuts.md), [`.cursor/prompts/understand-use-34-ranked-path-time.md`](../../.cursor/prompts/understand-use-34-ranked-path-time.md), [`.cursor/prompts/understand-use-35-diagram-needs-a-resource.md`](../../.cursor/prompts/understand-use-35-diagram-needs-a-resource.md), [`.cursor/prompts/understand-use-36-diagram-job-phrases.md`](../../.cursor/prompts/understand-use-36-diagram-job-phrases.md), [`.cursor/prompts/understand-use-37-no-owner-recorded.md`](../../.cursor/prompts/understand-use-37-no-owner-recorded.md), [`.cursor/prompts/understand-use-38-filter-emptied-the-list.md`](../../.cursor/prompts/understand-use-38-filter-emptied-the-list.md), [`.cursor/prompts/understand-use-39-what-to-send.md`](../../.cursor/prompts/understand-use-39-what-to-send.md), [`.cursor/prompts/understand-use-40-finding-cites-a-path.md`](../../.cursor/prompts/understand-use-40-finding-cites-a-path.md)

# Understand and use, wave D — Luna prompts

**Created:** 2026-09-26 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index. Wave A is [`UNDERSTAND_USE_LUNA_PROMPTS.md`](UNDERSTAND_USE_LUNA_PROMPTS.md). Wave B is [`UNDERSTAND_USE_WAVE_B_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_B_LUNA_PROMPTS.md). Wave C is [`UNDERSTAND_USE_WAVE_C_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_C_LUNA_PROMPTS.md).

| ID | Prompt | Intent |
|----|--------|--------|
| **UU-31** | [understand-use-31-score-is-sort-key.md](../../.cursor/prompts/understand-use-31-score-is-sort-key.md) | The path score column says it is a sort key |
| **UU-32** | [understand-use-32-disposition-words.md](../../.cursor/prompts/understand-use-32-disposition-words.md) | Disposition choices use plain labels |
| **UU-33** | [understand-use-33-findings-shortcuts.md](../../.cursor/prompts/understand-use-33-findings-shortcuts.md) | The findings queue shows its existing shortcut keys |
| **UU-34** | [understand-use-34-ranked-path-time.md](../../.cursor/prompts/understand-use-34-ranked-path-time.md) | Ranked paths say when the loaded page was computed |
| **UU-35** | [understand-use-35-diagram-needs-a-resource.md](../../.cursor/prompts/understand-use-35-diagram-needs-a-resource.md) | An empty selected-resource diagram asks for a resource |
| **UU-36** | [understand-use-36-diagram-job-phrases.md](../../.cursor/prompts/understand-use-36-diagram-job-phrases.md) | Remaining diagram modes say the question they answer |
| **UU-37** | [understand-use-37-no-owner-recorded.md](../../.cursor/prompts/understand-use-37-no-owner-recorded.md) | A finding with no owner says so |
| **UU-38** | [understand-use-38-filter-emptied-the-list.md](../../.cursor/prompts/understand-use-38-filter-emptied-the-list.md) | A filter that matches nothing says the filter is the reason |
| **UU-39** | [understand-use-39-what-to-send.md](../../.cursor/prompts/understand-use-39-what-to-send.md) | The export menu says which file the sponsor receives |
| **UU-40** | [understand-use-40-finding-cites-a-path.md](../../.cursor/prompts/understand-use-40-finding-cites-a-path.md) | A finding with no path says it does not cite one |

The sessions are independent. **UU-36** keeps the UU-06 data labels. **UU-40** keeps the UU-25 audience line.

## Do not pull into these sessions

- Hiding review workspace tabs, or moving a primary tab into More
- A new confidence percentage, or turning the path sort key into a percentage
- Azure write APIs, terraform apply, or a new collector
- Renaming disposition enums, `PathKind`, `ProvenanceKind`, or `PathConfidenceBand`
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
