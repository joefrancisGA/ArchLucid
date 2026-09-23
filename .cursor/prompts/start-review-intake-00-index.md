<!-- Start review intake — Composer prompts.
     Origin: 2026-09-22 owner screenshot of Working Start review on an
     empty workspace. The header promises a diagram, brief, or document.
     The body asks for a named architecture that does not exist, then
     offers three templates. Owner asked for prompts that put guided
     questions, the architecture name, and uploads back on the first
     screen, with templates as a shortcut. Do not implement from this
     index. -->

# Start review intake — Composer prompt set (SRI-01–SRI-06 + hold)

ArchLucid sells a **seat for a repeat professional**. Start review is how that seat begins a package. On an empty workspace the current screen is a gate: pick an architecture, then learn there are none.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/start-review-intake-NN-*.md` file per Composer / Cloud Agent session.

Canonical wave doc: [`docs/architecture/START_REVIEW_INTAKE_COMPOSER_PROMPTS.md`](../../docs/architecture/START_REVIEW_INTAKE_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

## Locked diagnosis (do not re-diagnose)

Owner screen (2026-09-22, Record, Development — Primary project):

1. **The header describes the old job.** `ReviewsNewPageChrome` leads with a review from a diagram, brief, or document, and an optional cloud connection or inventory ZIP.
2. **The body is AO-22's empty picker.** `ReviewsNewRouteBody` returns `ReviewsNewWorkingArchitecturePicker` when Working `path=guided-intake` has no `sourceArchitectureId`. The list query is empty, so the screen says "No architectures in this workspace yet."
3. **Guided questions never mount.** `SocraticIntakeWizardStepScope` already has System Name, the brief, and `GuidedIntakeEvidenceSection`. The picker returns before that wizard.
4. **Templates are the only controls.** `ReviewsNewStarterTemplateGallery` renders three cards. **Use template** pushes `/architecture/reviews/new?preset=…` with no `path`. A missing `path` redirects to the architecture desk (`resolveWorkingStartHref`).
5. **The footer is internal taxonomy.** `PathChooserCreateObjectVocabularyRail` explains path chooser, drafts, and Start review under the cards.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Empty workspace** | Picker heading and a dead sentence | Guided questions | SRI-01 |
| **Architecture name** | Optional, and only after a parent exists | Required on the first screen; review stays parented | SRI-02 |
| **Upload** | Header promise; wizard control never shown | Same first screen as the name and the brief | SRI-03 |
| **Templates** | The only way forward; preset drops `path` | Shortcut under the questions; preset keeps `path=guided-intake` | SRI-04 |
| **Chrome** | Picker title on an empty list; path-chooser footer | Lead matches the controls; footer rail hidden on Working | SRI-05 |
| **Ratchet** | One test that the non-empty picker appears | Empty, non-empty, name, upload, preset, parent id | SRI-06 |

## What this set does *not* change

- A review still belongs to a named architecture. Submit still carries `ArchitectureId`. No orphan review.
- When the architecture list is **non-empty**, the picker stays. Its heading stays. Choosing a row still opens the nested desk URL.
- Start review from an architecture desk (`/architecture/architectures/{id}/reviews/new`) still prefills that architecture. Do not ask the person to name it again.
- Create architecture (`/architecture/architectures/new`, `CREATE_ARCHITECTURE_INTENT`) stays the draft editor. This wave does not merge it with Start review.
- Working `/architecture/reviews/new` **with no `path`** still follows `resolveWorkingStartHref`. Do not mount the wizard on that redirect.
- Guided / eval path switcher stays. This wave changes the Working `path=guided-intake` empty branch only.
- Do not merge `DraftRequests` and `Runs`. Use the existing draft create and `START_REVIEW_INTENT`.
- Desktop review workspace tabs stay a full strip.

## Run order

**01 first. 02 and 03 after 01 (they may run together). 04 and 05 after 01. 06 last.**

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SRI-01** Empty workspace opens guided questions | First | — |
| **SRI-02** Name binds the architecture | After 01 | Wizard is the empty body |
| **SRI-03** Upload on the first screen | After 01; parallel with 02 | Wizard is mounted |
| **SRI-04** Templates are a shortcut | After 01 | `path=guided-intake` stays on the URL |
| **SRI-05** Lead matches the screen | After 01 | Empty picker heading is gone |
| **SRI-06** Ratchet | Last | 01–05 merged, or failing tests for unmerged slices |
| **SRI-HOLD** | Not implementation | — |

**SRI-HOLD** is not implementation. Paste `start-review-intake-07-hold.md` only if a session deletes the non-empty picker, starts a review with no architecture id, or makes the three templates the only control again.

Suggested branch per prompt: `cursor/start-review-intake-<short-name>-sri1`. Name the branch in any commit request.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `start-review-intake-01-empty-workspace-guided-questions.md` | Empty list shows the picker |
| 02 | `start-review-intake-02-name-binds-architecture.md` | Name is optional and the review can be unparented |
| 03 | `start-review-intake-03-upload-on-first-screen.md` | Upload exists only inside a wizard that does not mount |
| 04 | `start-review-intake-04-templates-are-a-shortcut.md` | Templates are the only CTA; preset drops `path` |
| 05 | `start-review-intake-05-lead-matches-the-screen.md` | Header and footer describe a different screen |
| 06 | `start-review-intake-06-ratchet.md` | Tests only lock the non-empty picker |
| HOLD | `start-review-intake-07-hold.md` | Picker deleted, or a review with no architecture |

## After each prompt

Summarize: files changed, tests run, whether an empty architecture list still shows the picker heading (it must not), whether a non-empty list still shows the picker, and whether a review submit still includes an architecture id.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report. Cloud Agent VMs: if `pwsh` is missing, install per `AGENTS.md` or skip the script on a clean branch and say so.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** start a review with an empty architecture id.
- **Do not** delete the picker when the architecture list has rows.
- **Do not** change Working `/architecture/reviews/new` with no `path` (desk resume redirect).
- **Do not** replace Create architecture with this screen.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case for headings and buttons. Form field labels stay Title Case (`System Name`). **TB-2005:** disable continue until the required name is valid; upload stays optional; no validation toast for a missing file.
- Visible-boundary `Button` (no ghost/link). Navigation stays a link.
- Verification: focused Vitest from `archlucid-ui/` named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
