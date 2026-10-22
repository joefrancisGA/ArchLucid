# UU-55 — When an exception stops covering the finding

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-56 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-55**). **Depends on:** UU-46. Keep the exception-versus-disposition lead.

## Goal

The risk-exception Expires header says the exception stops covering the finding after that time.

## Why

The column shows a date. It does not say what happens at that time. A reader can treat the date as a reminder instead of the end of coverage.

## Read first

- `archlucid-ui/src/components/governance/RiskExceptionsTable.tsx` (Expires header)
- `archlucid-ui/src/components/governance/RiskExceptionsClient.tsx` (keep the existing lead)

## What to build

1. Branch `uu/55-exception-stops-covering` from current `master`.
2. On the Expires column header, keep the word Expires and add this helper once: "After this time the exception no longer covers the finding."
3. Do not repeat that sentence on every row. Do not change `formatRiskExceptionExpiresAtUtc`.
4. Keep the UU-46 lead: "An exception is temporary. A disposition is the decision."

## Acceptance criteria

- The Expires header shows the new sentence once.
- A row still shows its formatted expiry time.
- The exception-versus-disposition lead is still present.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The helper is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/governance/RiskExceptionsClient.test.tsx src/components/governance/RiskExceptionsClient.buyer-polished.test.tsx
```

Add a header assertion in the suite that already renders the table. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to read the Expires header, then one expiry time. Wait for that look before any commit.
