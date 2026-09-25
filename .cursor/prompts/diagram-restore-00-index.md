<!-- Diagram restore — Composer prompts. Paste one numbered file per session.
     Origin: 2026-09-23. #3585–#3587 and #3592 mangled SecureNow inventory
     diagrams. Commit 32b3a17eb8 on revert/diagram-icon-layout-3585-3592
     restored the pre-change look. These prompts bring the useful pieces
     back without replaying those four pull requests.
     Do not implement from this index. -->

# Diagram restore — Composer prompt set (DRS-01–DRS-04 + hold)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/diagram-restore-0N-*.md` file per session.

Canonical wave doc: [`docs/architecture/DIAGRAM_RESTORE_COMPOSER_PROMPTS.md`](../../docs/architecture/DIAGRAM_RESTORE_COMPOSER_PROMPTS.md).

**Base branch:** `revert/diagram-icon-layout-3585-3592` (commit `32b3a17eb8`). Create each implementation branch from that branch. Do **not** branch from `master`. `master` still contains the mangled diagram commits.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Diagnosis (already closed — do not re-diagnose)

The owner demoed the Diagrams page and the picture was wrong. Rolling back four commits fixed it. Those commits were:

| Commit | PR | What it did | Restore? |
|--------|----|-------------|----------|
| `1460498a65` | #3585 | 18×18 Azure PNG pack and manifest. No canvas change by itself. | **No.** Official art is the Architecture Center **SVG** zip. |
| `f49c801263` | #3586 | Replaced category pictograms with those PNGs. | **No,** not as PNGs. That is the blurry color block on a zoomed card. |
| `084b91e2d2` | #3587 | Removed the subscription frame, darkened every edge including dark mode to `#111827`, added a crude data-flow column layout, and split the outline into connected and unconnected nodes. | **Split.** Outline only in DRS-01. Edge color, corrected, in DRS-02. Data flow, using the later router, in DRS-03. Frame stays. |
| `bfc0ca30e7` | #3592 | Data-flow gutter router, stage labels, dark-mode edge correction, outline sort helpers. Also the state the owner rejected as a whole. | **Pieces only.** Do not `git revert` this revert, and do not `git cherry-pick` this commit. |

`git show <sha> -- <path>` is allowed as a reference. Copying a whole commit back is not.

## What this set does change

| Bet | From (current revert branch) | To | Prompt |
|-----|------------------------------|----|--------|
| **Outline** | One node table | Connected nodes, then unconnected nodes. Sort order still asserted on the first data row. | **DRS-01** |
| **Edge ink** | `#94a3b8` light and dark | Light `#111827`, dark `#e2e8f0` | **DRS-02** |
| **Data flow layout** | Same packer as inventory | Stage columns, gutters, sky lane, stage labels, only when the title contains `(DataFlow)` | **DRS-03** |
| **Icons** | Category pictograms | Official Azure SVGs for mapped ARM types. Pictogram stays when there is no official icon. | **DRS-04** |

## What this set does not change

Keep the subscription frame (`class="subscription-frame"` on full Azure inventory). Keep category pictograms until DRS-04 and only when the official zip is already in the tree. Keep Full subscription packing, resource-group frames, and the viewer zoom control.

Do **not** remove `DiagramForestSubscriptionFrameResolver` drawing. Do **not** restore `Assets/AzureIcons/*.png`. Do **not** set dark-mode edges to `#111827`. Do **not** change layout for any title that does not contain `(DataFlow)` in DRS-03.

## Run order

**01 → owner look → 02 → owner look → 03 → owner look → 04.** **04** does not start until the owner has placed the official SVG zip. **05** is a written hold, not an implementation session.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 01 | `diagram-restore-01-outline-connected.md` | `drs/01-outline-sections` |
| 02 | `diagram-restore-02-edge-ink.md` | `drs/02-edge-ink` |
| 03 | `diagram-restore-03-data-flow-layout.md` | `drs/03-data-flow-layout` |
| 04 | `diagram-restore-04-official-svg-icons.md` | `drs/04-official-svg-icons` |
| 05 | `diagram-restore-05-hold.md` | none — do not implement |

## After each prompt

Summarize files changed, tests run, and the one thing the owner must look at. Say whether the subscription frame is still drawn (must be **yes**) and whether any PNG icon returned (must be **no**).
