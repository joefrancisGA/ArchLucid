# UU-44 — How to check

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-45 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-44**). **Depends on:** the recommended-action Verification line.

## Goal

The recommended-action check reads as How to check. A raw id is not the lead text.

## Why

The line is labeled Verification. Its value can be an id such as `snapshot:verify-public-closure`, or the words "Not cited." The reader is looking for what to check, not an identifier.

## Read first

- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (`RecommendedActionSection`)
- The inspect header that already has "Show identifiers"

## What to build

1. Branch `uu/44-how-to-check` from current `master`.
2. Change the visible label from "Verification" to "How to check".
3. When the value has spaces, show that sentence under the label.
4. When the value has no spaces, show "A check is recorded for this path." and put the raw value in the existing Show identifiers disclosure.
5. When the value is missing, keep "Not cited."
6. Do not add a check and do not call Azure.

## Acceptance criteria

- `snapshot:verify-public-closure` is not the lead text.
- Show identifiers still shows that raw value.
- A prose verification sentence stays visible under How to check.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The label and the id fallback sentence are exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to read How to check, then open Show identifiers. Wait for that look before any commit.
