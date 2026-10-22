# CD-06 — Print and meeting packet carry the same coverage honesty

**Do not fork WA-08** for sponsor KPI/ROI export helpers. This file is **print and meeting packet**: `PackagePrintPageView` still branches on buyer-polish; printed findings/synopsis can omit quiet engines, skipped MUST, and typed-engine-protected. Conference-room paper is the career artifact.

## Goal

Working-mode package print and the existing meeting packet include the same coverage honesty the review already has (quiet engines, skipped MUST, typed-engine-protected / infeasible). Print must not look cleaner than the on-screen stamp. Guided/demo may keep buyer print chrome via `resolveProductionEvalChrome`, not buyer-polish alone.

## Why

R4’s liability stance requires the transparency trail on every output. A printed package that drops the trail is how an architect walks into a board with a lie of omission.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageView.tsx`
- `archlucid-ui/src/lib/package-print-view.ts` / `package-print-page-copy.ts`
- `ReviewMeetingPacketButton.tsx`
- Reuse `ActorDependentFindingsQuietEnginesHint` / sponsor coverage honesty (`sponsor-review-coverage-honesty.ts`) — do not fork sentences
- CD-04 migrates print off buyer-polish; this file is the **honesty content**. If CD-04 has not run, still use the resolver for the honesty branch, not a new flag.

## What to build

1. Working print: hoist existing coverage/quiet-engine/skipped-MUST/infeasible lines into the print document (visible in print CSS, not `print:hidden`).
2. Meeting packet: same honesty block if the packet summarizes findings or a yes/no.
3. Vitest: print fixture with quiet engines renders the reused hint; buyer-polish is not the only gate. Gate `.cs` empty diff.

## Acceptance criteria

- Printed Working package cannot screenshot as all-clear when the on-screen review is not.
- Eval print chrome remains for Guided/demo via the resolver.
- Desktop tabs unchanged.

## Constraints

- Do not invent a second density scale.
- Do not change `typed-engine-protected`.
- Do not start a dev server.
