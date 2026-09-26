# UU-50 — A stale SecureNow refresh does not change Azure

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-50**). **Depends on:** `remediationFactoryDataStaleCue` on the SecureNow remediation factory.

## Goal

When the remediation factory is stale, the page says that refresh rereads the SecureNow lists and does not change Azure.

## Why

The stale cue says the page is old. Refresh on this page rereads the priority queue, ranked paths, metrics, and snapshot comparison. It does not write to Azure. The sentence has to name SecureNow, because this page is not an architecture review.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/remediation-factory-freshness.ts`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (the stale cue and `refreshAll`)

## What to build

1. Branch `uu/50-stale-refresh` from current `master`.
2. When the existing stale cue is showing, add one sentence beside it: "Refresh rereads the SecureNow lists on this page. It does not change Azure."
3. Do not show the sentence when the cue is absent.
4. Keep the existing Refresh button. Do not add a second refresh and do not call an Azure write API.
5. Do not use the word ArchLucid in this sentence.

## Acceptance criteria

- A stale page shows the SecureNow sentence next to the existing cue.
- A fresh page does not show the sentence.
- Refresh still calls the existing refetch.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/remediation-factory-freshness.test.ts" "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to wait until the stale cue appears and read the SecureNow sentence before refreshing. Wait for that look before any commit.
