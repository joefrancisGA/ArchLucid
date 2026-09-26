# UU-16 — Named SecureNow views

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-17 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-16**). **Depends on:** ranked path rows and their `pathKind` and `pathConfidenceBand`.

## Goal

The ranked-path list can be opened on a named view. The choice is stored in the URL and filters rows the page already loaded.

## Why

Public exposure, privilege, shared controls, and thin evidence are the jobs people return to. Rebuilding that filter from kind and band on every visit is the hard part.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx`
- The remediation-factory client that owns the path query and the URL
- `archlucid-ui/src/lib/security-evidence-path-types.ts`
- `ArchLucid.Core/InfraEvidence/PathKind.cs` if the UI kind strings are unclear

## What to build

1. Branch `uu/16-saved-views` from current `master`.
2. Add a view control above the ranked paths. Views that match fields already on `SecurityEvidencePathRankSummary`:
   - All paths. No extra filter.
   - Public exposure. Keep rows whose `pathKind` is the intended-reachability kind.
   - Privilege paths. Keep rows whose `pathKind` is the privilege kind.
   - Insufficient evidence. Keep rows whose `pathConfidenceBand` is `InsufficientEvidence`.
   - Shared controls. Keep rows that already have a related cut point. If the summary has no cut-point data, do not add this view.
3. Do not add a "sensitive assets" view unless the loaded row already has a sensitivity or assertion field. If it does not, omit that view and say so.
4. Store the selected view in a query parameter such as `pathView`. Refresh and back-forward keep it.
5. Filter only the rows already returned. Do not add a collector, a rank change, or a new score.
6. An empty filtered list says which view is on and that no loaded path matches it.

## Acceptance criteria

- `?pathView=privilege` shows privilege rows and hides a reachability row in the test data.
- `?pathView=insufficient-evidence` shows only that band.
- All paths clears the filter.
- Rank values on the remaining rows are unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The view control is a group of `outline` or `default` buttons, or a select. Do not use `ghost`.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

Add a filter test with two fake rows. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to switch Public exposure and Insufficient evidence and refresh. The same view should still be selected. Wait for that look before any commit.
