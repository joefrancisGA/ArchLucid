> **Scope:** Copy-paste Composer prompts that restore guided questions and uploads as the empty-workspace Start review screen. A review still belongs to a named architecture. Internal engineering only — not buyer-facing copy. **Do not implement from this file.** Paste one numbered prompt per session.
> **Paste files:** [`.cursor/prompts/start-review-intake-00-index.md`](../../.cursor/prompts/start-review-intake-00-index.md)
> **Narrows:** AO-22 empty-workspace picker only. Nested desk start and the non-empty picker stay.

# Start review intake — Composer prompts (SRI-01–SRI-06 + hold)

**Observed (2026-09-22):** Working Start review (`/architecture/reviews/new?path=guided-intake`, no `sourceArchitectureId`) on an empty workspace. The header says a review starts from a diagram, brief, or document. The body says "Pick an architecture to start a review" and "No architectures in this workspace yet." The only controls are three reference templates. Guided questions and the upload zone exist on `SocraticIntakeWizardStepScope` and never mount, because `ReviewsNewRouteBody` returns `ReviewsNewWorkingArchitecturePicker` first.

**Owner decision:** Keep the named-architecture rule. On an empty list, drop the picker heading and open guided questions. The architecture name is a required field on that first screen. The upload area is on that same screen. Template cards sit under the questions as a shortcut. When the list already has architectures, the picker stays.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Empty list renders the picker | **SRI-01** | First visit still dead-ends on "No architectures in this workspace yet." |
| Name is optional and unbound | **SRI-02** | A review can start without a parent architecture |
| Upload is below the fold of a wizard that does not mount | **SRI-03** | Diagram, brief, and inventory ZIP stay a sentence in the header |
| Use template drops `path` and the gallery is the only way forward | **SRI-04** | Template click redirects to the architecture desk |
| Header and footer describe a different screen | **SRI-05** | Path-chooser vocabulary sits under a start form |
| Tests cover only the non-empty picker | **SRI-06** | The next session restores the empty picker |
| Picker deleted, or reviews with no architecture id | **SRI-HOLD** | AO-22 parent rule is gone |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SRI-01** Empty workspace opens guided questions | First | — |
| **SRI-02** Name binds the architecture | After 01 | Wizard is the empty-workspace body |
| **SRI-03** Upload on the first screen | After 01; parallel with 02 | Wizard is mounted |
| **SRI-04** Templates are a shortcut | After 01 | Wizard route accepts `path=guided-intake` |
| **SRI-05** Lead matches the screen | After 01 | Empty picker heading is already gone |
| **SRI-06** Ratchet | Last | 01–05 merged, or failing tests for unmerged slices |
| **SRI-HOLD** | Not implementation | — |

## Prompt files

| # | File |
|---|------|
| 00 | [`.cursor/prompts/start-review-intake-00-index.md`](../../.cursor/prompts/start-review-intake-00-index.md) |
| 01 | [`.cursor/prompts/start-review-intake-01-empty-workspace-guided-questions.md`](../../.cursor/prompts/start-review-intake-01-empty-workspace-guided-questions.md) |
| 02 | [`.cursor/prompts/start-review-intake-02-name-binds-architecture.md`](../../.cursor/prompts/start-review-intake-02-name-binds-architecture.md) |
| 03 | [`.cursor/prompts/start-review-intake-03-upload-on-first-screen.md`](../../.cursor/prompts/start-review-intake-03-upload-on-first-screen.md) |
| 04 | [`.cursor/prompts/start-review-intake-04-templates-are-a-shortcut.md`](../../.cursor/prompts/start-review-intake-04-templates-are-a-shortcut.md) |
| 05 | [`.cursor/prompts/start-review-intake-05-lead-matches-the-screen.md`](../../.cursor/prompts/start-review-intake-05-lead-matches-the-screen.md) |
| 06 | [`.cursor/prompts/start-review-intake-06-ratchet.md`](../../.cursor/prompts/start-review-intake-06-ratchet.md) |
| HOLD | [`.cursor/prompts/start-review-intake-07-hold.md`](../../.cursor/prompts/start-review-intake-07-hold.md) |
