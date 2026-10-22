# SRI-05 — The header and the footer match the first screen

**Wave:** start-review-intake (**SRI**). **Depends on:** SRI-01.

Follow [`.cursor/prompts/start-review-intake-00-index.md`](start-review-intake-00-index.md) global constraints.

## Goal

Working Start review copy describes the screen that is actually mounted. An empty list does not say "Pick an architecture." The path-chooser vocabulary rail is not the footer of this page.

## Why

`ReviewsNewPageChrome` promises a diagram, brief, or document, then an optional cloud connection. Under that, an empty picker contradicts the promise. `PathChooserCreateObjectVocabularyRail` (`currentSurfaceId="reviews-new"`) then prints "Path chooser orients next steps; drafts save pre-review work; Start review creates a review." That line explains three products. It is not a way to start.

## Context

- Picker strings: `REVIEWS_NEW_WORKING_ARCHITECTURE_PICKER_TITLE`, `REVIEWS_NEW_WORKING_ARCHITECTURE_PICKER_BODY` in `ReviewsNewWorkingArchitecturePicker.tsx`. They may remain for the **non-empty** table.
- Page lead: `REVIEWS_NEW_PAGE_LEAD` and `REVIEWS_NEW_OPTIONAL_CLOUD_LEAD` in the page chrome. Keep both. The cloud sentence stays a hint with the existing help and hub links. Do not turn it into a required connector step.
- Rail: `ReviewsNewPageShell.tsx` renders `PathChooserCreateObjectVocabularyRail` when the shell is not buyer-polished and not on a path tab. Working Start review hits that branch.
- Guided / eval path switcher may keep the rail if that surface still explains the three paths. This prompt hides it on **Working** `/architecture/reviews/new` only.

## What to build

1. Empty architecture list: the picker title and the "No architectures in this workspace yet." sentence are absent (SRI-01). Add a shell-level assertion so a later gallery or rail cannot reintroduce the title.

2. Non-empty list: the picker title and body stay, because the person is choosing among real rows.

3. Working Start review page: do not render `PathChooserCreateObjectVocabularyRail`. Eval / Guided path switcher behavior stays as it is today.

4. Do not rewrite the page lead into a template pitch. The lead stays about a diagram, brief, or document. The cloud hint stays optional.

5. Tests:
   - Working empty guided-intake: picker title absent; vocabulary rail absent; page lead still present.
   - Working non-empty guided-intake: picker title present; vocabulary rail still absent.
   - Eval path switcher: rail behavior unchanged from the current test, or explicitly still mounted if a current test says it is.

## Acceptance criteria

- The first screen a new workspace sees talks about the questions and the files, and the footer does not explain the path chooser.

## Constraints

- **Do not** delete the picker copy constants. The non-empty table still uses them.
- **Do not** remove the cloud-connections help link.
- **Do not** restore breadcrumbs.

## Done when

Empty Working Start review has no picker heading and no path-chooser footer. The non-empty picker still has its heading.
