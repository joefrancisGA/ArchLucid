> **Scope:** Paste-ready GPT-5.6 Luna prompts for the fifth ten understand-and-use sessions. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/understand-use-41-metric-meanings.md`](../../.cursor/prompts/understand-use-41-metric-meanings.md), [`.cursor/prompts/understand-use-42-pattern-not-key.md`](../../.cursor/prompts/understand-use-42-pattern-not-key.md), [`.cursor/prompts/understand-use-43-rank-means-first.md`](../../.cursor/prompts/understand-use-43-rank-means-first.md), [`.cursor/prompts/understand-use-44-how-to-check.md`](../../.cursor/prompts/understand-use-44-how-to-check.md), [`.cursor/prompts/understand-use-45-disposition-saved.md`](../../.cursor/prompts/understand-use-45-disposition-saved.md), [`.cursor/prompts/understand-use-46-exception-vs-disposition.md`](../../.cursor/prompts/understand-use-46-exception-vs-disposition.md), [`.cursor/prompts/understand-use-47-compare-this-review.md`](../../.cursor/prompts/understand-use-47-compare-this-review.md), [`.cursor/prompts/understand-use-48-internet-boundary.md`](../../.cursor/prompts/understand-use-48-internet-boundary.md), [`.cursor/prompts/understand-use-49-ask-reads-snapshot.md`](../../.cursor/prompts/understand-use-49-ask-reads-snapshot.md), [`.cursor/prompts/understand-use-50-stale-refresh.md`](../../.cursor/prompts/understand-use-50-stale-refresh.md)

# Understand and use, wave E — Luna prompts

**Created:** 2026-09-26 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index. Wave D is [`UNDERSTAND_USE_WAVE_D_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_D_LUNA_PROMPTS.md).

| ID | Prompt | Intent |
|----|--------|--------|
| **UU-41** | [understand-use-41-metric-meanings.md](../../.cursor/prompts/understand-use-41-metric-meanings.md) | Each remediation metric says what it counts |
| **UU-42** | [understand-use-42-pattern-not-key.md](../../.cursor/prompts/understand-use-42-pattern-not-key.md) | The priority queue leads with Pattern, not the key |
| **UU-43** | [understand-use-43-rank-means-first.md](../../.cursor/prompts/understand-use-43-rank-means-first.md) | Rank 1 means the first path to inspect |
| **UU-44** | [understand-use-44-how-to-check.md](../../.cursor/prompts/understand-use-44-how-to-check.md) | Verification reads as How to check |
| **UU-45** | [understand-use-45-disposition-saved.md](../../.cursor/prompts/understand-use-45-disposition-saved.md) | A saved disposition says where it went |
| **UU-46** | [understand-use-46-exception-vs-disposition.md](../../.cursor/prompts/understand-use-46-exception-vs-disposition.md) | An exception is temporary; a disposition is the decision |
| **UU-47** | [understand-use-47-compare-this-review.md](../../.cursor/prompts/understand-use-47-compare-this-review.md) | The sealed package shows Compare this review |
| **UU-48** | [understand-use-48-internet-boundary.md](../../.cursor/prompts/understand-use-48-internet-boundary.md) | Internet means the public boundary |
| **UU-49** | [understand-use-49-ask-reads-snapshot.md](../../.cursor/prompts/understand-use-49-ask-reads-snapshot.md) | Infrastructure Ask reads the inventory snapshot |
| **UU-50** | [understand-use-50-stale-refresh.md](../../.cursor/prompts/understand-use-50-stale-refresh.md) | A stale SecureNow refresh does not change Azure |

The sessions are independent. **UU-50** uses SecureNow wording.

## Do not pull into these sessions

- Hiding review workspace tabs, or moving a primary tab into More
- A new metric, percentage, or buyer-facing score
- Azure write APIs, terraform apply, or a new collector
- Renaming disposition enums, `PathKind`, `ProvenanceKind`, or `PathConfidenceBand`
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
