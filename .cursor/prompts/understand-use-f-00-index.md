<!-- Understand and use, wave F — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-26. Control ids, missing action lines, snapshot roles,
     finding-queue rank, exception expiry, decision register, Ask, one resource
     group, review evidence, and resource evidence links.
     Do not implement from this index. -->

# Understand and use — Luna prompt set (UU-51–UU-60)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/understand-use-5N-*.md` or `understand-use-60-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/UNDERSTAND_USE_WAVE_F_LUNA_PROMPTS.md`](../../docs/architecture/UNDERSTAND_USE_WAVE_F_LUNA_PROMPTS.md).

Wave E is [`understand-use-e-00-index.md`](understand-use-e-00-index.md). Do not redo UU-01–UU-50 here.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Control id** | The priority queue shows a control id with no meaning. | The Control header says the id is the control this finding cites. | **UU-51** |
| **Not cited** | Several recommended-action lines can each say "Not cited." | Two or more empty lines become one sentence that names the gaps. | **UU-52** |
| **Snapshot roles** | From and To are labels. | The comparison says From is the baseline and To is the snapshot you compare against. | **UU-53** |
| **Finding rank** | The finding queue and the path list both show Rank. | The finding queue says its rank is not the path list. | **UU-54** |
| **Exception expiry** | Expires is a date. | The header says the exception stops covering the finding after that time. | **UU-55** |
| **Decision register** | A saved disposition shows a sentence and stops. | The save also links to the existing decision register. | **UU-56** |
| **Ask gap** | Insufficient evidence is a tag plus the answer. | The gap says this snapshot cannot answer and Ask did not query live Azure. | **UU-57** |
| **One group** | A selected resource-group diagram does not say it is one group. | That drawing says it shows one resource group. | **UU-58** |
| **Review evidence** | The review Evidence tab opens on coverage. | The tab says this evidence is what the review used. | **UU-59** |
| **Resource evidence** | A hop name does not open the resource. | A hop with a resource id links to the existing resource page. | **UU-60** |

## What this set does not change

Do not hide review workspace tabs. Do not add a metric, a percentage, or a new score. Do not call Azure write APIs. Do not rename disposition or path enums. Do not invent owners, paths, or resources.

## Run order

The sessions are independent. **UU-52** keeps the UU-44 How to check behavior. **UU-54** keeps the path-list sentence "1 is the first path to inspect." **UU-56** keeps the UU-45 saved sentence. **UU-57** keeps the UU-49 Ask banner. **UU-58** does not replace the resource-group map caption. Do not revert another UU change that has already landed.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 51 | `understand-use-51-control-this-finding-cites.md` | `uu/51-control-this-finding-cites` |
| 52 | `understand-use-52-not-cited-summary.md` | `uu/52-not-cited-summary` |
| 53 | `understand-use-53-snapshot-baseline.md` | `uu/53-snapshot-baseline` |
| 54 | `understand-use-54-finding-queue-rank.md` | `uu/54-finding-queue-rank` |
| 55 | `understand-use-55-exception-stops-covering.md` | `uu/55-exception-stops-covering` |
| 56 | `understand-use-56-see-decision-register.md` | `uu/56-see-decision-register` |
| 57 | `understand-use-57-ask-insufficient-evidence.md` | `uu/57-ask-insufficient-evidence` |
| 58 | `understand-use-58-one-resource-group.md` | `uu/58-one-resource-group` |
| 59 | `understand-use-59-review-evidence-used.md` | `uu/59-review-evidence-used` |
| 60 | `understand-use-60-open-resource-evidence.md` | `uu/60-open-resource-evidence` |
