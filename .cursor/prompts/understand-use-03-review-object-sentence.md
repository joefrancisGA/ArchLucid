# UU-03 — Review object sentence

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-04 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** the review headers. If UU-02 has landed, keep its progress line.

## Goal

The review header states what object is on screen: an open review, or a sealed architecture package.

## Why

Architecture, review, snapshot, architecture package, and sealed review record already collide. The glossary defines them. The header does not say which one this screen is.

## Read first

- `docs/library/CONCEPT_VOCABULARY.md` (UI glossary)
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.tsx` (`RunDetailWorkspaceHeader`)
- `archlucid-ui/src/components/architecture/ArchitectureCreatedWorkspaceHeader.tsx`
- `docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md`

## What to build

1. Branch `uu/03-review-object-sentence` from current `master`. If you are continuing after UU-02, branch from that branch instead.
2. Under the review title, and above the tab strip, show one sentence:
   - Open review: "This review is still open. Finalize locks the architecture package."
   - Sealed review: "This review is sealed. The architecture package is locked."
3. Use the same sealed signal the workspace already uses for a sealed review record. Do not invent a second lifecycle.
4. If the UU-02 progress line is present, keep it. Put the object sentence above that line. Do not remove the line to make room.
5. Put the sentence on both headers: the committed review workspace and the architecture-created workspace.

## Acceptance criteria

- An open review shows the open sentence.
- A sealed review shows the sealed sentence.
- The sentence does not say "signed", "run", or "decision record".
- Tab labels and tab order are unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. One sentence, not a banner stack.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.test.tsx"
```

There is no `ArchitectureCreatedWorkspaceHeader.test.tsx` yet. Add one for the object sentence and run it. If UU-02 already added that file, extend it. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to read the sentence on an open review and on a sealed review. Wait for that look before any commit.
