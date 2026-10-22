# UU-39 — Which export the sponsor receives

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-40 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-39**). **Depends on:** the finalized review export menu. If UU-24 has landed, keep Reviewed, Sharing, and Send.

## Goal

The export menu says which file to send a sponsor.

## Why

The menu offers Markdown and other downloads. The buttons name formats. They do not say which one is the architecture package a sponsor should receive.

## Read first

- `archlucid-ui/src/components/GoldenManifestExportMenu.tsx`
- The sponsor sharing panel that already mounts that menu on a sealed review
- `docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md`

## What to build

1. Branch `uu/39-what-to-send` from current `master`.
2. Above the existing download controls on a sealed review, add one sentence: "Send the sponsor the architecture package export. Markdown is a summary of the sealed review record."
3. Do not add an export. Do not remove an export. Do not change which button is primary.
4. Do not show the sentence on an unsealed review.
5. Do not put a CLI command or `runId` in the sentence. Do not say the package is signed.

## Acceptance criteria

- A sealed review export menu shows the sentence once.
- An unsealed review does not show it.
- The existing download actions are still present.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/GoldenManifestExportMenu.test.tsx
```

Add a sealed-review test if that suite does not render the menu both ways. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open a sealed review export menu and read the sentence before choosing a file. Wait for that look before any commit.
