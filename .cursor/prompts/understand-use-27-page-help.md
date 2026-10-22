# UU-27 — Help opens the page topic

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-28 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-27**). **Depends on:** the existing help registry and `PageContextualHelpButton`.

## Goal

Help on the remediation factory and on inventory diagrams opens the help topic for that page.

## Why

A help control that opens `/help` leaves the reader to search for the page they were already on.

## Read first

- `archlucid-ui/src/components/usability/PageContextualHelpButton.tsx`
- `archlucid-ui/src/lib/help/help-index.generated.ts` (search for remediation and diagram topics; do not hand-edit the generated index)
- The help topic source markdown that already documents remediation factory and infrastructure diagrams
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx`

## What to build

1. Branch `uu/27-page-help` from current `master`.
2. Point the existing help button on those two pages at the help topic that already describes that page. Use the topic slug from the registry. Do not create a new help article.
3. If one of those pages has no matching topic, leave its button unchanged and say which page had no topic. Do not write a new article in this session.
4. The opened topic is an in-app `/help/{topic}` route. Do not link to a GitHub blob.
5. Do not change help for every other page.

## Acceptance criteria

- The remediation factory help href is the matching `/help/` topic when one exists.
- The diagrams help href is the matching `/help/` topic when one exists.
- A missing topic is reported instead of a guessed slug.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Help links stay links. Do not style them as filled buttons if they only navigate.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/usability/PageContextualHelpButton.test.tsx
```

Add a test that each wired page resolves to its topic. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to use Help on both pages and confirm the topic title matches the page. Wait for that look before any commit.
