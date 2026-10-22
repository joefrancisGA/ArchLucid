# UU-66 — The row names the resource

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement another UU prompt in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave G (**UU-66**). **Depends on:** `cloudResourceId` already on the ranked finding. Keep the UU-61 sentence if it has landed.

## Goal

The finding priority queue names the resource. The full resource id stays in a disclosure.

## Why

The row shows rank, a score, a control id, and the word Pattern. The person reading it still has to leave the row to learn which resource the finding is about. `formatCloudResourceDisplayName` already turns an ARM id into the display name used on other SecureNow lists.

## Read first

- `archlucid-ui/src/lib/remediation-factory-types.ts` (`cloudResourceId`)
- `archlucid-ui/src/lib/infra-evidence/format-azure-resource-display.ts` (`formatCloudResourceDisplayName`, `AZURE_RESOURCE_NAME_NOT_RECORDED_LABEL`)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryPriorityTable.tsx`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (the rendered priority queue)

## What to build

1. Branch `uu/66-resource-on-the-row` from current `master`.
2. Add a Resource column after Rank on the finding priority queue.
3. When `cloudResourceId` is present, the cell text is `formatCloudResourceDisplayName({ externalResourceId: cloudResourceId })`. Do not pass a display name unless the ranked payload already has one. Do not add an API field.
4. On that cell, a disclosure labeled "Show resource id" reveals the full `cloudResourceId`. Closed by default.
5. When `cloudResourceId` is missing, the cell text is `AZURE_RESOURCE_NAME_NOT_RECORDED_LABEL` and there is no disclosure.
6. Do not replace the summary sentence. If UU-61 has landed, that sentence stays. If it has not, leave the summary cell as it is.
7. Do not put the raw pattern key back into the Pattern cell.

## Acceptance criteria

- An id ending in `/storageAccounts/customerdata` shows `customerdata` in the Resource cell.
- Show resource id reveals the full id.
- A row with no `cloudResourceId` shows "Name not recorded".

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. "Show resource id" is the exact disclosure label.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx" src/lib/infra-evidence/format-azure-resource-display.ts
```

Run the display helper's existing test file if the path above is not the test. Add a queue assertion for the resource cell.

## Done when

Tests pass. Tell the owner to read the Resource cell on the first row and open Show resource id. Wait for that look before any commit.
