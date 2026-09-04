# AD-01 — Finding inspect dirty fields use the livelihood navigation guard

**Do not fork LD-12, RS-07, or CD-10.** LD-12 wired remaining admin/policy dirty forms. RS-07 owns the CI inventory. CD-10 owns post-300s **Record correction** mounts. This file is the leftover **finding inspect document**: rationale, evidence request, remediation owner/due, and other guarded fields can sit unsaved until submit while the architect hits Alt+R or a sidebar link.

## Goal

`FindingInspectDispositionForm` (and any sibling inspect field that is dirty before submit) uses `useLivelihoodDocumentGuards` + `LivelihoodDocumentGuardDialog` when typed work would be lost. Add the inspect surface to `LIVELIHOOD_DOCUMENT_GUARD_SURFACES`. Do not guard URL-only `reviewTab` / `findingId` filters. Do not double-prompt with the existing disposition `ConfirmationDialog`.

## Why

Professionals write a rationale, get interrupted, and click Reviews. Casual SPAs drop the textarea. Architecture drafts already block leave. Finding inspect — the livelihood write on a package — still does not. Submit confirm is not a substitute for leave-without-save.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionForm.tsx`
- `archlucid-ui/src/hooks/use-livelihood-document-guards.tsx`
- `archlucid-ui/src/lib/livelihood-document-guard-inventory.ts` — inspect is **not** listed
- Disposition submit already uses `ConfirmationDialog` — keep that for apply; leave-guard is separate
- `formatLivelihoodLastSavedLabel` already exists on the form — last-saved chrome is WA-16; this prompt is leave-guard only

## What to build

1. Compute dirty as “local fields differ from last successful submit / last-saved baseline,” not “any keystroke after mount while saved.”
2. Wire `useLivelihoodDocumentGuards` when dirty and `canMutate`. Show `LivelihoodDocumentGuardDialog`.
3. Add a `finding-inspect-disposition` (or equivalent) row to `LIVELIHOOD_DOCUMENT_GUARD_SURFACES`. Update `livelihood-document-guard-guard.test.ts` allowlists if needed.
4. Do not intercept the in-page Confirm/Cancel on disposition apply. Do not use `window.confirm`.
5. Vitest: dirty rationale + in-app navigation opens the guard; after successful submit it does not; existing inventory surfaces still import the helper.

## Acceptance criteria

- Dirty finding inspect fields cannot silently lose work via sidebar, Alt+R, or in-app links.
- Tab close still uses `beforeunload` (browser-controlled text).
- Disposition apply still uses `ConfirmationDialog` (no double modal on Confirm).
- RS-07 inventory fails if inspect later drops the helper.

## Constraints

- Do not persist finding drafts in a cross-tenant store.
- Do not collapse review tabs as a “simpler dirty model.”
- Do not implement CD-10 Record correction here.
- Do not add a second navigation-guard library.
