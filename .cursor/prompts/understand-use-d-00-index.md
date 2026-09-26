<!-- Understand and use, wave D — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-26. Sort-key honesty, disposition words, findings shortcuts,
     ranked-path time, diagram selection, remaining diagram jobs, owner gap,
     filtered empty, sponsor export sentence, and path citation.
     Do not implement from this index. -->

# Understand and use — Luna prompt set (UU-31–UU-40)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/understand-use-3N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/UNDERSTAND_USE_WAVE_D_LUNA_PROMPTS.md`](../../docs/architecture/UNDERSTAND_USE_WAVE_D_LUNA_PROMPTS.md).

Wave A is [`understand-use-00-index.md`](understand-use-00-index.md). Wave B is [`understand-use-b-00-index.md`](understand-use-b-00-index.md). Wave C is [`understand-use-c-00-index.md`](understand-use-c-00-index.md). Do not redo UU-01–UU-30 here.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Sort key** | The Score column looks like a grade. | The column says it is a sort key, not a percentage. | **UU-31** |
| **Disposition words** | The disposition list shows enum names. | Each choice uses a plain label. The stored value stays the enum. | **UU-32** |
| **Findings keys** | Findings shortcuts exist in the registry and stay hidden. | The findings queue shows the keys it already binds. | **UU-33** |
| **Ranked-path time** | Ranked paths do not say when they were computed. | The loaded page says the computed time it already has. | **UU-34** |
| **Diagram needs a resource** | Selected-resource modes draw nothing and say nothing. | The empty canvas says to choose a resource. | **UU-35** |
| **Diagram jobs** | Several diagram modes are still one word. | Those modes say the question they answer. Data labels from UU-06 stay. | **UU-36** |
| **No owner** | A finding with no owner shows a dash. | The cell says no owner is recorded. | **UU-37** |
| **Filter emptied the list** | A filter that matches nothing looks like an empty review. | The empty line says the filter matched nothing. | **UU-38** |
| **What to send** | Export buttons name file types. | One sentence says which export the sponsor receives. | **UU-39** |
| **Path citation** | A finding with no path uses engine wording. | The empty inspect line says the finding does not cite a path. | **UU-40** |

## What this set does not change

Do not hide review workspace tabs. Do not add a numeric confidence or turn the sort key into a percentage. Do not call Azure write APIs. Do not rename disposition or path-kind enums. Do not invent owners, paths, or resources.

## Run order

The sessions are independent. **UU-36** keeps the data, data-flow, and data-architecture labels from UU-06. **UU-40** keeps the audience line from UU-25. Do not revert another UU change that has already landed.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 31 | `understand-use-31-score-is-sort-key.md` | `uu/31-score-is-sort-key` |
| 32 | `understand-use-32-disposition-words.md` | `uu/32-disposition-words` |
| 33 | `understand-use-33-findings-shortcuts.md` | `uu/33-findings-shortcuts` |
| 34 | `understand-use-34-ranked-path-time.md` | `uu/34-ranked-path-time` |
| 35 | `understand-use-35-diagram-needs-a-resource.md` | `uu/35-diagram-needs-a-resource` |
| 36 | `understand-use-36-diagram-job-phrases.md` | `uu/36-diagram-job-phrases` |
| 37 | `understand-use-37-no-owner-recorded.md` | `uu/37-no-owner-recorded` |
| 38 | `understand-use-38-filter-emptied-the-list.md` | `uu/38-filter-emptied-the-list` |
| 39 | `understand-use-39-what-to-send.md` | `uu/39-what-to-send` |
| 40 | `understand-use-40-finding-cites-a-path.md` | `uu/40-finding-cites-a-path` |
