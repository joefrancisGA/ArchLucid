# UU-40 — This finding does not cite a path

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-40**). **Depends on:** `SECURENOW_PATH_INSPECT_EMPTY_NO_PATH`. If UU-25 has landed, keep the SecureNow audience line.

## Goal

When path inspect has a finding and no path, the empty line says the finding does not cite a path.

## Why

The current empty line says "No architect path cited — this finding is resource-scoped." That tells the reader the engine's scope. It does not tell them why inspect has no hops.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts` (`SECURENOW_PATH_INSPECT_EMPTY_NO_PATH`)
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (the empty branch when `resolvedPathId` is null)

## What to build

1. Branch `uu/40-finding-cites-a-path` from current `master`.
2. Change the reader-facing empty string to: "This finding does not cite a path."
3. Show it only in the existing empty branch, when a finding is selected and no path id is resolved.
4. When a path id is resolved, do not show the sentence.
5. Do not invent a path. Do not merge the findings queues. Do not say "operator".

## Acceptance criteria

- A selected finding with no path shows the new sentence.
- A selected path does not show it.
- The audience line from UU-25, if present, is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx src/lib/product-line/securenow-path-inspect-copy.test.ts
```

Add a copy test if the copy suite does not exist. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to select a finding that has no path and read the empty line. Wait for that look before any commit.
