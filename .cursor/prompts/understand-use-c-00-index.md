<!-- Understand and use, wave C — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-26. Plain path kinds, resource names, view counts,
     sponsor read-first, finding audiences, failed-load recovery, page help,
     analysis delta, sticky next action, and severity meanings.
     Do not implement from this index. -->

# Understand and use — Luna prompt set (UU-21–UU-30)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/understand-use-2N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/UNDERSTAND_USE_WAVE_C_LUNA_PROMPTS.md`](../../docs/architecture/UNDERSTAND_USE_WAVE_C_LUNA_PROMPTS.md).

Wave A is [`understand-use-00-index.md`](understand-use-00-index.md). Wave B is [`understand-use-b-00-index.md`](understand-use-b-00-index.md). Do not redo UU-01–UU-20 here.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Path kind words** | Ranked rows show the engine kind string. | The row shows a plain kind label. The enum stays in the data. | **UU-21** |
| **Resource names** | Hop ends can lead with an ARM id. | The display name leads. The id stays in the existing identifier disclosure. | **UU-22** |
| **View counts** | A path view says its name and then the table changes. | Each view says how many loaded rows it keeps. | **UU-23** |
| **Sponsor read-first** | A sealed package opens on actions and artifacts. | Three sentences say what was reviewed, what blocks sharing, and what to send. | **UU-24** |
| **Two finding audiences** | "Findings" names both architecture review findings and SecureNow paths. | Each queue says which kind of finding it holds. | **UU-25** |
| **Failed load** | A failed path list is a status chip. | The failure says what failed, what is still intact, and the retry. | **UU-26** |
| **Page help** | Help can open the help home. | Remediation factory and inventory diagrams open their own help topic. | **UU-27** |
| **Analysis delta** | Activity lists events. | The activity lead says how many findings this analysis added, from counts already on the page. | **UU-28** |
| **Sticky next action** | The next action scrolls away. | The one primary next action stays visible. The tab strip stays put. | **UU-29** |
| **Severity meaning** | Severity is a chip. | The first severity chip on a finding row includes one sentence of what that severity asks the reader to do. | **UU-30** |

## What this set does not change

Do not hide review workspace tabs. Do not add a numeric confidence or a new score. Do not call Azure write APIs. Do not rename path-kind enums. Do not invent findings, owners, or traffic.

## Run order

The sessions are independent. **UU-21** before **UU-23** when both will land, so the count sits on the plain label. Do not revert another UU change that has already landed.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 21 | `understand-use-21-path-kind-words.md` | `uu/21-path-kind-words` |
| 22 | `understand-use-22-resource-names.md` | `uu/22-resource-names` |
| 23 | `understand-use-23-view-counts.md` | `uu/23-view-counts` |
| 24 | `understand-use-24-sponsor-read-first.md` | `uu/24-sponsor-read-first` |
| 25 | `understand-use-25-two-finding-audiences.md` | `uu/25-two-finding-audiences` |
| 26 | `understand-use-26-failed-load.md` | `uu/26-failed-load` |
| 27 | `understand-use-27-page-help.md` | `uu/27-page-help` |
| 28 | `understand-use-28-analysis-delta.md` | `uu/28-analysis-delta` |
| 29 | `understand-use-29-sticky-next-action.md` | `uu/29-sticky-next-action` |
| 30 | `understand-use-30-severity-meaning.md` | `uu/30-severity-meaning` |
