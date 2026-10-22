# UU-46 — An exception is not a disposition

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-47 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-46**). **Depends on:** the risk-exceptions claim discipline.

## Goal

The risk-exceptions page leads with the difference between an exception and a disposition.

## Why

The page already says exceptions are temporary approvals. That fact is inside a longer claim paragraph. A reader can still treat an exception as the same act as recording a disposition.

## Read first

- `archlucid-ui/src/lib/risk-exceptions-evidence-copy.ts` (`RISK_EXCEPTIONS_CLAIM_DISCIPLINE`)
- `archlucid-ui/src/components/governance/RiskExceptionsClient.tsx`

## What to build

1. Branch `uu/46-exception-vs-disposition` from current `master`.
2. Above the existing claim-discipline paragraph, show: "An exception is temporary. A disposition is the decision."
3. Keep the existing paragraph under that line. Do not delete it.
4. Do not merge the exceptions page with the findings queue. Do not add an exception action.

## Acceptance criteria

- The exceptions page shows the new line first.
- The existing claim paragraph is still present.
- The findings queue does not show the new line.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The line is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/risk-exceptions-evidence-copy.test.ts src/components/governance/RiskExceptionsClient.test.tsx
```

Add a client test if that suite does not exist. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open risk exceptions and read the first line before the claim paragraph. Wait for that look before any commit.
