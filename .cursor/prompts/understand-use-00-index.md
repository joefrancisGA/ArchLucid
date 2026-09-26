<!-- Understand and use — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-26. Ten UI sessions that make ArchLucid and SecureNow
     easier to understand or easier to use. Do not implement from this index. -->

# Understand and use — Luna prompt set (UU-01–UU-10)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/understand-use-0N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/UNDERSTAND_USE_LUNA_PROMPTS.md`](../../docs/architecture/UNDERSTAND_USE_LUNA_PROMPTS.md).

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Job chooser** | The signed-in home opens whichever product line is already selected. | Two jobs name the outcome: a finalized architecture package, or a ranked path. | **UU-01** |
| **Review progress** | The seven-step first-review guide lives on its own page. | A five-step line stays on every review tab until the review is sealed. | **UU-02** |
| **Object sentence** | Architecture, review, and package are defined in the glossary. | The review header says whether this review is open or sealed. | **UU-03** |
| **Path queue** | Ranked path rows lead with kind, band, and score. | The consequence sentence leads. Kind and band follow. | **UU-04** |
| **Hop sentence** | Path hops are a from / to / edge table. | Each hop is a sentence, with the confidence band and its meaning beside it. | **UU-05** |
| **Diagram jobs** | Data, Data architecture, and Data flow sit in one mode list. | Each of those three labels states the job. Mode ids stay the same. | **UU-06** |
| **Package next action** | After finalize, several artifacts can compete as the primary action. | One next action is primary. The other artifacts are links under it. | **UU-07** |
| **Sample versus yours** | Sample and empty data-flow states are easy to miss. | The first viewport says this is sample data, or why the data-flow canvas is empty. | **UU-08** |
| **What could break** | Cut points and blast-radius prose sit apart from the advisory change. | The advisory change lists what could break, from cited cut points only. | **UU-09** |
| **First-encounter definitions** | Finding, decision, policy pack, evidence trail, and sealed review record are in the glossary. | The first visible label of each noun on the review workspace uses the existing glossary chip. | **UU-10** |

## What this set does not change

Do not hide review workspace tabs. Do not move a primary tab into More. Do not add a numeric confidence or a new buyer score. Do not call Azure write APIs. Do not add an LLM call to render a hop or a queue row. Do not rename URL mode values. Do not edit glossary definition text.

## Run order

The sessions are independent. Run any one on its own branch.

**UU-02** and **UU-03** both touch the review header. Run **UU-02** first when both will land, so the object sentence does not replace the progress line.

**UU-04** and **UU-05** both touch SecureNow path presentation. Either can run first. Do not revert the other if it has already landed.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 01 | `understand-use-01-job-chooser.md` | `uu/01-job-chooser` |
| 02 | `understand-use-02-review-progress-line.md` | `uu/02-review-progress-line` |
| 03 | `understand-use-03-review-object-sentence.md` | `uu/03-review-object-sentence` |
| 04 | `understand-use-04-path-queue-consequence.md` | `uu/04-path-queue-consequence` |
| 05 | `understand-use-05-hop-sentence.md` | `uu/05-hop-sentence` |
| 06 | `understand-use-06-diagram-job-titles.md` | `uu/06-diagram-job-titles` |
| 07 | `understand-use-07-package-next-action.md` | `uu/07-package-next-action` |
| 08 | `understand-use-08-sample-vs-yours.md` | `uu/08-sample-vs-yours` |
| 09 | `understand-use-09-what-could-break.md` | `uu/09-what-could-break` |
| 10 | `understand-use-10-first-encounter-definitions.md` | `uu/10-first-encounter-definitions` |
