# SN-QQ-10 — Make the open-question count readable

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-QQ prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

**Depends on:** SN-QQ-03 and SN-QQ-09. The snapshot promo already exists under the snapshot id. Do not rebuild the queue, the question card, or the neighborhood.

## Goal

When a subscription has open questions, the diagrams workbench shows that count as a status the reader can see, and the control that opens the queue says what it does. When the open count is zero, that row stays empty.

## Why

`SecureNowQuestionQueueSnapshotPromo` renders helper-size secondary gray: `81 open questions`, then an outline button labeled `Review`. That row sits under the monospace snapshot id, so the count reads as a caption of the id. The owner wants it easier to see, and still quieter than **Export PNG**.

The weight that fits is the existing `needs-attention` status tag, the same count in medium helper type, and an outline button labeled `Review questions`. A filled banner, a red count, or a primary button is louder than this row should be.

## Read first

- `archlucid-ui/src/components/infra-evidence/SecureNowQuestionQueue.tsx` (`SecureNowQuestionQueueSnapshotPromo`, `openQuestionsCountLabel`)
- `archlucid-ui/src/components/infra-evidence/SecureNowQuestionQueue.test.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (both `infra-diagrams-snapshot-id-readout` mounts)
- `archlucid-ui/src/components/ui/status-tag.tsx`
- `archlucid-ui/src/lib/design-tokens-status.ts` (`ENTERPRISE_STATUS_LABELS["needs-attention"]` is `Action needed`)
- `docs/library/UI_DESIGN_SYSTEM.md` § Capitalization and status tags

## What to build

Change the snapshot promo and the gap above it. Leave the question bar, answer labels, neighborhood highlight, load-failure copy, and the questions API as they are.

On each `data-testid="infra-diagrams-snapshot-id-readout"` wrapper, set the column gap to `gap-2`. Both mounts in `DiagramsWorkbenchClient.tsx` change. The snapshot id and its copy button stay on the first row, in secondary helper type.

`SecureNowQuestionQueueSnapshotPromo` keeps `data-testid="infra-diagrams-question-snapshot-promo"`. When `openQuestions.length` is greater than zero, render one row, in this order:

1. `<StatusTag kind="needs-attention" />`. Pass no `label`. The visible words are `Action needed`, from `ENTERPRISE_STATUS_LABELS`. The accessible name stays `Status: Action needed`.
2. The existing count: `1 open question` or `{n} open questions`. Keep `OPERATOR_TYPOGRAPHY.helper`. Add `font-medium`. Use the default text color. Remove `text-al-text-secondary` from that span.
3. The existing button. Keep `variant="outline"`, `size="sm"`, and `data-testid="infra-diagrams-question-review"`. The label is `Review questions`. The click still sets the filter to `Open`, the index to `0`, and the drawer open.

When the open count is zero, return null. No tag, no count, and no button.

## Tests

Update `archlucid-ui/src/components/infra-evidence/SecureNowQuestionQueue.test.tsx`.

1. One open question renders the promo with `1 open question`, the status text `Action needed`, and a button named `Review questions`. Clicking that button still opens `infra-diagrams-question-bar`.
2. Every later test in that file that clicks `Review` clicks `Review questions`.
3. Open count zero still renders no promo and no `Action needed` tag.
4. The review button keeps `variant="outline"`.

From `archlucid-ui`, run:

```bash
npx vitest run src/components/infra-evidence/SecureNowQuestionQueue.test.tsx
npx tsc --noEmit -p tsconfig.json
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Keep the count sentence. One subscription still has one count.
- Keep **Export PNG** as the filled action on this page. `Review questions` stays outline.
- Use `StatusTag`. Do not paint a filled amber or yellow banner, a callout card, or a `bg-amber-*` / `bg-teal-*` wash behind the promo.
- Use kind `needs-attention` only. Do not use kind `blocked`, a rose or red count, or a numeric badge.
- Do not set the review button to `primary`, `default`, `secondary`, or `destructive`. Do not use a removed `ghost` or `link` variant.
- Do not restore `SecureNow has {n} questions about this subscription.` or `infra-diagrams-question-hero`.
- Do not change ignore, reopen, answer persistence, or the question compiler.
- Do not commit.
- Do not write to customer Azure.
- Do not hide a diagrams tab behind More.
- Do not add a control named Resolve.

## Done when

A subscription with open questions shows `Action needed`, the open count in medium helper type, and an outline `Review questions` button, on the row under the snapshot id. A subscription with none of those questions shows none of that row.
