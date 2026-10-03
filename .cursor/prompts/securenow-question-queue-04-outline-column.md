# SN-QQ-04 — Outline Answer control opens the same drawer

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-QQ-05 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

**Depends on:** SN-QQ-03. The drawer already exists.

## Goal

A node or edge row that has an open question gets one button. The button opens the drawer on that question. Rows with no question stay as they are.

## Why

The reader is already looking at "Missing a required link" and "Needs evidence." A button there is a shortcut. It is not a second queue. Pack questions have no row, so the hero remains the way to start those.

## Read first

- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-outline-node-label.tsx`
- The SN-QQ-03 drawer component

## What to build

On Orphaned and Unknown node tables, add a column after Problem. Header: `Question`.

When the row's resource id and an open question key match a queue row, render a button labeled `Answer`. `data-testid="infra-diagrams-question-answer"`. The click opens the SN-QQ-03 drawer on that question and focuses the node the same way the drawer already does.

When the row has no open question, the cell is empty. Do not render a disabled button. Do not render `Answer` on Connected, Used, or Unconnected rows.

Edge rows use the same rule. An edge with an open question shows `Review`. A node button says `Answer`. Neither label is Resolve.

The Problem column, the resource-name helper, and the JSON download buttons stay as they are. NR-12's Unknown notice stays a count of Unknown resources. It is not the queue count.

Do not add a form, a checkbox, or a reason field in the table. Those stay in the drawer.

## Tests

1. An orphaned row whose resource has `orphan-still-needed@v1` open shows `Answer` and does not repeat the problem in the name cell.
2. Activating `Answer` opens `infra-diagrams-question-drawer` on that question key.
3. An orphaned row with no queue item has an empty Question cell and no button.
4. A Connected row has no Question button.
5. An edge with an open question shows `Review`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- From `archlucid-ui`, run the outline tests and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.
- Do not add a route or a tab.
- Do not write to customer Azure.

## Done when

Only rows with an open question offer Answer or Review, and that control opens the existing drawer.
