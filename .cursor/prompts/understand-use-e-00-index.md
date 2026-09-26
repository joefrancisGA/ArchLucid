<!-- Understand and use, wave E — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-26. Metric meanings, pattern keys, rank, verification,
     disposition confirmation, exceptions, compare, Internet, Ask, and stale refresh.
     Do not implement from this index. -->

# Understand and use — Luna prompt set (UU-41–UU-50)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/understand-use-4N-*.md` or `understand-use-50-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/UNDERSTAND_USE_WAVE_E_LUNA_PROMPTS.md`](../../docs/architecture/UNDERSTAND_USE_WAVE_E_LUNA_PROMPTS.md).

Wave D is [`understand-use-d-00-index.md`](understand-use-d-00-index.md). Do not redo UU-01–UU-40 here.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Metric meanings** | Factory tiles show a number and a technical scope note. | Each tile says what that number counts. | **UU-41** |
| **Pattern key** | The priority queue leads with a pattern key. | The cell says Pattern. The key stays in the identifier disclosure. | **UU-42** |
| **Rank 1** | Rank is a bare number. | The header says 1 is the first path to inspect. | **UU-43** |
| **How to check** | Verification can lead with an id. | The line is How to check. A raw id stays behind Show identifiers. | **UU-44** |
| **Disposition saved** | A save shows a timestamp. | The save also says the finding was recorded and the sealed record is unchanged. | **UU-45** |
| **Exception vs disposition** | The exceptions page opens on a long claim paragraph. | The first line separates a temporary exception from a disposition. | **UU-46** |
| **Compare this review** | Compare is off the package actions. | The sealed package shows the existing compare link and `alt+c`. | **UU-47** |
| **Internet** | A hop can say Internet with no meaning. | The first such hop says Internet is the public boundary. | **UU-48** |
| **Infrastructure Ask** | Ask does not say what it reads. | The question box says it uses the inventory snapshot, not live Azure. | **UU-49** |
| **Stale refresh** | A stale cue names staleness and stops. | The cue says refresh rereads the SecureNow lists and does not change Azure. | **UU-50** |

## What this set does not change

Do not hide review workspace tabs. Do not add a metric, a percentage, or a new score. Do not call Azure write APIs. Do not rename disposition or path enums. Do not invent owners, paths, or resources.

## Run order

The sessions are independent. **UU-43** keeps the UU-31 sort-key helper. **UU-50** is SecureNow wording. Do not revert another UU change that has already landed.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 41 | `understand-use-41-metric-meanings.md` | `uu/41-metric-meanings` |
| 42 | `understand-use-42-pattern-not-key.md` | `uu/42-pattern-not-key` |
| 43 | `understand-use-43-rank-means-first.md` | `uu/43-rank-means-first` |
| 44 | `understand-use-44-how-to-check.md` | `uu/44-how-to-check` |
| 45 | `understand-use-45-disposition-saved.md` | `uu/45-disposition-saved` |
| 46 | `understand-use-46-exception-vs-disposition.md` | `uu/46-exception-vs-disposition` |
| 47 | `understand-use-47-compare-this-review.md` | `uu/47-compare-this-review` |
| 48 | `understand-use-48-internet-boundary.md` | `uu/48-internet-boundary` |
| 49 | `understand-use-49-ask-reads-snapshot.md` | `uu/49-ask-reads-snapshot` |
| 50 | `understand-use-50-stale-refresh.md` | `uu/50-stale-refresh` |
