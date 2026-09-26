# UU-52 — Name the missing recommended-action lines

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-53 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-52**). **Depends on:** UU-44 How to check. Keep that behavior.

## Goal

When more than one recommended-action line would say "Not cited.", those empty lines become one sentence that names the gaps. Lines that have real text stay.

## Why

Problem, Evidence, Consequence, Recommended change, Owner, and How to check can each say "Not cited." Six identical lines look like a form that failed to load.

## Read first

- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (`RecommendedActionSection`)

## What to build

1. Branch `uu/52-not-cited-summary` from current `master`.
2. Keep a labeled line when its visible text is not "Not cited." That includes a prose How to check sentence and the UU-44 fallback "A check is recorded for this path."
3. When exactly one line would show "Not cited.", keep that one labeled line.
4. When two or more lines would show "Not cited.", omit those labeled lines and show one sentence under the Recommended action heading: "Not cited: " plus the missing labels in their current order, separated by ", ". Example: "Not cited: Problem, Evidence, Consequence."
5. A raw How to check id still stays behind Show identifiers. Do not invent a problem, an owner, or a check. Do not call Azure.

## Acceptance criteria

- Three empty lines render as one "Not cited: …" sentence and do not each say "Not cited."
- A line with real text stays under its own label.
- "A check is recorded for this path." still appears when How to check is a raw id, and that line is not folded into the Not cited sentence.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The "Not cited: " prefix is exact. Label names stay the current labels.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to open a path whose recommended action is mostly empty and read the single Not cited sentence. Wait for that look before any commit.
