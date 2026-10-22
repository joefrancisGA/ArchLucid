# UU-41 — What each remediation metric counts

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-42 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-41**). **Depends on:** the remediation factory metric tiles.

## Goal

Each remediation metric tile says what its number counts.

## Why

The tiles already show values such as a risk-weighted decimal and a pattern percent. The scope notes are technical. A reader cannot tell a weighted count from a grade.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/remediation-factory-metric-presentation.ts`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (`ExecutiveMetricTile`)

## What to build

1. Branch `uu/41-metric-meanings` from current `master`.
2. Keep every existing tile and its numeric value. Replace the reader-facing helper on these tiles with:
   - Open findings: "SecureNow findings that are still open."
   - Risk-weighted open: "A weighted count of those open findings. Not a percentage."
   - Critical exposure: "Open findings marked critical."
   - Net burn (7d): "Findings opened minus findings closed in seven days."
   - Pattern exact match: "Share of open findings whose pattern matched exactly."
   - Automation: "Share of open findings with an automated check."
   - Exceptions active: "Risk exceptions still in force."
   - Average age: "Average age of the open findings, in days."
3. Do not add a tile. Do not change a value or a percent that is already measured.
4. If a second metrics grid is also visible on this page, use the same sentences. Do not render a second copy of the same grid.

## Acceptance criteria

- Risk-weighted open still shows its decimal and the new helper.
- Open findings still shows its count.
- No tile label becomes a new score.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The helpers above are the exact strings.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/remediation-factory-metric-presentation.test.ts" "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

Add a helper test if the presentation suite does not exist. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to read Risk-weighted open and Net burn before using the numbers. Wait for that look before any commit.
