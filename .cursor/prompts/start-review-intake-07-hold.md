# SRI-HOLD — Do not put the empty picker back

**Wave:** start-review-intake (**SRI**). **Not an implementation prompt.**

Follow [`.cursor/prompts/start-review-intake-00-index.md`](start-review-intake-00-index.md) global constraints.

Paste this file only when a session is about to undo the wave. Do not build from it.

## Hold

1. **Do not** render "Pick an architecture to start a review" or "No architectures in this workspace yet." when the architecture list is empty. The empty screen is guided questions (SRI-01).

2. **Do not** delete the picker when the list has rows. Choosing a row still opens the nested start-review URL (AO-22, non-empty clause).

3. **Do not** start a review with a blank architecture id. System Name on the empty screen is required, and submit carries the id created or chosen for that name (SRI-02).

4. **Do not** move the upload zone off the first screen, and do not require a file to continue (SRI-03).

5. **Do not** make the three templates the only control. **Use template** keeps `path=guided-intake` and a `preset` (SRI-04). A preset URL with no `path` is the desk redirect — do not ship it again.

6. **Do not** put `PathChooserCreateObjectVocabularyRail` back on Working Start review (SRI-05).

7. **Do not** merge Create architecture into this screen, and do not mount the wizard on Working `/architecture/reviews/new` when `path` is absent.

8. **Do not** collapse desktop review workspace tabs. **Do not** merge `DraftRequests` and `Runs`.

## If you were sent here to "simplify" Start review

The simplification that belongs on an empty workspace is the questions, the name, and the upload. The picker belongs only where there is something to pick.
