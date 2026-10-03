> **Scope:** Paste-ready GPT-5.6 Luna prompts for one SecureNow question queue on the diagrams workbench. Internal engineering only. Prompts only — do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-question-queue-00-index.md`](../../.cursor/prompts/securenow-question-queue-00-index.md)

# SecureNow question queue — Luna prompts

**Created:** 2026-10-03 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

The diagrams workbench already has two different "questions." `InferenceQuestionnairePanel` lists proposed operator-inferred connections. The outline's Unknown notice and Problem column are diagram evidence. A policy pack can also force a question that has no node. The reader gets one queue, one count, and one drawer.

Paste **one** prompt per Luna session. Run them in order. Do not implement from this index.

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **SN-QQ-01** | [securenow-question-queue-01-store.md](../../.cursor/prompts/securenow-question-queue-01-store.md) | — | Persist answer, ignore, and reopen across snapshots |
| **SN-QQ-02** | [securenow-question-queue-02-sources.md](../../.cursor/prompts/securenow-question-queue-02-sources.md) | SN-QQ-01 | Compile the open list. A missing link stays a finding unless an answer changes the next action |
| **SN-QQ-03** | [securenow-question-queue-03-hero-drawer.md](../../.cursor/prompts/securenow-question-queue-03-hero-drawer.md) | SN-QQ-02 | Hero only when the open count is greater than zero. One question at a time |
| **SN-QQ-04** | [securenow-question-queue-04-outline-column.md](../../.cursor/prompts/securenow-question-queue-04-outline-column.md) | SN-QQ-03 | Outline button opens that same drawer |
| **SN-QQ-05** | [securenow-question-queue-05-pack-questions.md](../../.cursor/prompts/securenow-question-queue-05-pack-questions.md) | SN-QQ-02 | Pack `elicitationQuestions` enter the same queue with no node |
| **SN-QQ-06** | [securenow-question-queue-06-assertions.md](../../.cursor/prompts/securenow-question-queue-06-assertions.md) | SN-QQ-01, SN-QQ-02 | Asserting answers become expiring `HumanAssertion`. Ignore does not change the diagram |
| **SN-QQ-HOLD** | [securenow-question-queue-hold.md](../../.cursor/prompts/securenow-question-queue-hold.md) | — | Forbidden scope |

**SN-QQ-05** can follow **SN-QQ-02** before the drawer exists. **SN-QQ-03** and **SN-QQ-04** stay in order. **SN-QQ-06** follows the store and the compiler. It can land before the drawer.

## Settled reading

- A question exists only when a person's answer changes what SecureNow does next.
- The queue is the surface. An outline button is a shortcut into that queue.
- The count is one number per subscription. Full subscription and Network do not double it.
- Skip lasts for the browser session. Don't ask again is stored, requires a reason, and expires.
- Don't ask again does not change the diagram, a path, or a risk rank.
- An answer that asserts a fact is `HumanAssertion` with a required expiration. It is never `ObservedFact`.
- Yellow questionable cards stay a pack finding. Ignoring the question does not clear the yellow.
- NR-12 still shows why an Unknown resource is unknown. It does not grow a form.
- NR-16 still paints the card and the click panel. It does not grow an answer form on the card.

## Do not pull into these sessions

- A question for every "Missing a required link" row
- A second questionnaire panel beside this queue
- A control named Resolve
- A permanent ignore, or an ignore with no reason
- An AI answer, or an AI that marks a question answered
- Customer Azure mutation, ARM writes, or a collector change
- SQL row-level security. [ADR 0037](adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) stands
- Hiding a diagrams workspace tab behind More
- Re-running NR-01 through NR-16, SN-RT-12, or SN-RT-13 as greenfield
