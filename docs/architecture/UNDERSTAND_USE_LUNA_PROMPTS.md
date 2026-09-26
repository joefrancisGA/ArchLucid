> **Scope:** Paste-ready GPT-5.6 Luna prompts for ten UI sessions that make ArchLucid and SecureNow easier to understand or easier to use. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/understand-use-01-job-chooser.md`](../../.cursor/prompts/understand-use-01-job-chooser.md), [`.cursor/prompts/understand-use-02-review-progress-line.md`](../../.cursor/prompts/understand-use-02-review-progress-line.md), [`.cursor/prompts/understand-use-03-review-object-sentence.md`](../../.cursor/prompts/understand-use-03-review-object-sentence.md), [`.cursor/prompts/understand-use-04-path-queue-consequence.md`](../../.cursor/prompts/understand-use-04-path-queue-consequence.md), [`.cursor/prompts/understand-use-05-hop-sentence.md`](../../.cursor/prompts/understand-use-05-hop-sentence.md), [`.cursor/prompts/understand-use-06-diagram-job-titles.md`](../../.cursor/prompts/understand-use-06-diagram-job-titles.md), [`.cursor/prompts/understand-use-07-package-next-action.md`](../../.cursor/prompts/understand-use-07-package-next-action.md), [`.cursor/prompts/understand-use-08-sample-vs-yours.md`](../../.cursor/prompts/understand-use-08-sample-vs-yours.md), [`.cursor/prompts/understand-use-09-what-could-break.md`](../../.cursor/prompts/understand-use-09-what-could-break.md), [`.cursor/prompts/understand-use-10-first-encounter-definitions.md`](../../.cursor/prompts/understand-use-10-first-encounter-definitions.md)

# Understand and use — Luna prompts

**Created:** 2026-09-26 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

| ID | Prompt | Intent |
|----|--------|--------|
| **UU-01** | [understand-use-01-job-chooser.md](../../.cursor/prompts/understand-use-01-job-chooser.md) | Signed-in home names two jobs and the outcome of each |
| **UU-02** | [understand-use-02-review-progress-line.md](../../.cursor/prompts/understand-use-02-review-progress-line.md) | Five-step progress line on every review tab until seal |
| **UU-03** | [understand-use-03-review-object-sentence.md](../../.cursor/prompts/understand-use-03-review-object-sentence.md) | Header sentence: this review is open, or it is sealed |
| **UU-04** | [understand-use-04-path-queue-consequence.md](../../.cursor/prompts/understand-use-04-path-queue-consequence.md) | Ranked path rows lead with the consequence sentence |
| **UU-05** | [understand-use-05-hop-sentence.md](../../.cursor/prompts/understand-use-05-hop-sentence.md) | Each path hop reads as a sentence, with band meaning |
| **UU-06** | [understand-use-06-diagram-job-titles.md](../../.cursor/prompts/understand-use-06-diagram-job-titles.md) | Data, data architecture, and data flow labels state the job |
| **UU-07** | [understand-use-07-package-next-action.md](../../.cursor/prompts/understand-use-07-package-next-action.md) | One primary next action on a sealed package |
| **UU-08** | [understand-use-08-sample-vs-yours.md](../../.cursor/prompts/understand-use-08-sample-vs-yours.md) | Sample package banner and empty data-flow explanation |
| **UU-09** | [understand-use-09-what-could-break.md](../../.cursor/prompts/understand-use-09-what-could-break.md) | Advisory change lists cited dependents and shared controls |
| **UU-10** | [understand-use-10-first-encounter-definitions.md](../../.cursor/prompts/understand-use-10-first-encounter-definitions.md) | Existing glossary chips on the first label of five nouns |

**UU-02** before **UU-03** when both will land. Every other prompt can run alone.

## Do not pull into these sessions

- Hiding review workspace tabs, or moving a primary tab into More
- A new confidence percentage or a new buyer-facing composite score
- Azure write APIs, terraform apply, or a new collector
- An LLM call to compose a queue row or a hop sentence
- Glossary definition rewrites
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**

## Wave B

The next ten sessions live in [`UNDERSTAND_USE_WAVE_B_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_B_LUNA_PROMPTS.md). Paste those files one at a time. Do not implement them from this page.
