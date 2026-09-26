> **Scope:** Paste-ready GPT-5.6 Luna prompts for the sixth ten understand-and-use sessions. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/understand-use-51-control-this-finding-cites.md`](../../.cursor/prompts/understand-use-51-control-this-finding-cites.md), [`.cursor/prompts/understand-use-52-not-cited-summary.md`](../../.cursor/prompts/understand-use-52-not-cited-summary.md), [`.cursor/prompts/understand-use-53-snapshot-baseline.md`](../../.cursor/prompts/understand-use-53-snapshot-baseline.md), [`.cursor/prompts/understand-use-54-finding-queue-rank.md`](../../.cursor/prompts/understand-use-54-finding-queue-rank.md), [`.cursor/prompts/understand-use-55-exception-stops-covering.md`](../../.cursor/prompts/understand-use-55-exception-stops-covering.md), [`.cursor/prompts/understand-use-56-see-decision-register.md`](../../.cursor/prompts/understand-use-56-see-decision-register.md), [`.cursor/prompts/understand-use-57-ask-insufficient-evidence.md`](../../.cursor/prompts/understand-use-57-ask-insufficient-evidence.md), [`.cursor/prompts/understand-use-58-one-resource-group.md`](../../.cursor/prompts/understand-use-58-one-resource-group.md), [`.cursor/prompts/understand-use-59-review-evidence-used.md`](../../.cursor/prompts/understand-use-59-review-evidence-used.md), [`.cursor/prompts/understand-use-60-open-resource-evidence.md`](../../.cursor/prompts/understand-use-60-open-resource-evidence.md)

# Understand and use, wave F — Luna prompts

**Created:** 2026-09-26 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index. Wave E is [`UNDERSTAND_USE_WAVE_E_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_E_LUNA_PROMPTS.md).

| ID | Prompt | Intent |
|----|--------|--------|
| **UU-51** | [understand-use-51-control-this-finding-cites.md](../../.cursor/prompts/understand-use-51-control-this-finding-cites.md) | The control id is the control this finding cites |
| **UU-52** | [understand-use-52-not-cited-summary.md](../../.cursor/prompts/understand-use-52-not-cited-summary.md) | Empty recommended-action lines become one named gap |
| **UU-53** | [understand-use-53-snapshot-baseline.md](../../.cursor/prompts/understand-use-53-snapshot-baseline.md) | From is the baseline and To is the comparison snapshot |
| **UU-54** | [understand-use-54-finding-queue-rank.md](../../.cursor/prompts/understand-use-54-finding-queue-rank.md) | Finding-queue rank is not the path-list rank |
| **UU-55** | [understand-use-55-exception-stops-covering.md](../../.cursor/prompts/understand-use-55-exception-stops-covering.md) | An exception stops covering the finding after it expires |
| **UU-56** | [understand-use-56-see-decision-register.md](../../.cursor/prompts/understand-use-56-see-decision-register.md) | A saved disposition links to the decision register |
| **UU-57** | [understand-use-57-ask-insufficient-evidence.md](../../.cursor/prompts/understand-use-57-ask-insufficient-evidence.md) | An insufficient Ask answer is the snapshot, not live Azure |
| **UU-58** | [understand-use-58-one-resource-group.md](../../.cursor/prompts/understand-use-58-one-resource-group.md) | A selected resource-group diagram says it is one group |
| **UU-59** | [understand-use-59-review-evidence-used.md](../../.cursor/prompts/understand-use-59-review-evidence-used.md) | The review Evidence tab is what this review used |
| **UU-60** | [understand-use-60-open-resource-evidence.md](../../.cursor/prompts/understand-use-60-open-resource-evidence.md) | A hop with a resource id opens resource evidence |

The sessions are independent. **UU-52** keeps UU-44. **UU-54** keeps the path-list rank sentence. **UU-56** keeps UU-45. **UU-57** keeps UU-49. **UU-58** does not replace the resource-group map caption. **UU-60** keeps the Internet boundary sentence.

## Do not pull into these sessions

- Hiding review workspace tabs, or moving a primary tab into More
- A new metric, percentage, or buyer-facing score
- Azure write APIs, terraform apply, or a new collector
- Renaming disposition enums, `PathKind`, `ProvenanceKind`, or `PathConfidenceBand`
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
