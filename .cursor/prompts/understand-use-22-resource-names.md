# UU-22 — Resource name before the ARM id

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-23 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-22**). **Depends on:** hop `fromNodeLabel` and `toNodeLabel`. If UU-05 has landed, keep the hop sentence.

## Goal

A path hop leads with the resource name. The ARM id stays available in the existing identifier disclosure.

## Why

Hop ends sometimes render a long resource id as the name of the thing. The reader is trying to recognize the storage account or the identity, not parse the id.

## Read first

- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (`PathHopsTable`)
- `archlucid-ui/src/lib/security-evidence-path-types.ts` (`fromNodeLabel`, `toNodeLabel`, `cloudResourceId`)
- The inspect identity header that already has "Show identifiers"

## What to build

1. Branch `uu/22-resource-names` from current `master`.
2. When a hop label contains a slash-delimited ARM id and also has a shorter trailing name segment, show the trailing name in the From and To cells and in the hop sentence.
3. Keep the full label and `cloudResourceId` behind the existing "Show identifiers" disclosure for that path. Do not remove the id.
4. A label that is already a short name stays unchanged.
5. Do not call Azure to resolve a friendlier name. Use only fields on the hop.

## Acceptance criteria

- A label ending in `/storageAccounts/logs` renders "logs" in the hop sentence.
- Expanding identifiers still shows the full id.
- A short label such as "Internet" stays "Internet".

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No new API and no collector.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

Add a unit test for the name helper. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to inspect a hop whose label is an ARM id and confirm the short name leads. Wait for that look before any commit.
