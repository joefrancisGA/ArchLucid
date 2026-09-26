# UU-58 — This diagram shows one resource group

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-59 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-58**). **Depends on:** a selected resource-group diagram. Do not change the resource-group map caption.

## Goal

When a resource group is selected and its diagram is drawn, the page says the drawing is one resource group.

## Why

The mode can already be labeled "One resource group." The drawn canvas still does not say that this picture is that one group. A different caption already describes the map of many groups, and that caption must stay.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (`resourceGroupPickerAwaitingSelection`, `selectedResourceGroupName`, `isResourceGroupMapDiagram`)
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` (`GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_MAP_CAPTION`)

## What to build

1. Branch `uu/58-one-resource-group` from current `master`.
2. When resource-group mode is selected, `selectedResourceGroupName` is non-empty, and the diagram canvas is shown, add: "This diagram shows one resource group."
3. Do not show that sentence while the picker is still waiting for a group.
4. Do not show that sentence on the resource-group map. Keep `GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_MAP_CAPTION`.
5. Do not change other diagram modes. Do not change the mode value `resourceGroup`.

## Acceptance criteria

- A drawn diagram for a named resource group shows the new sentence.
- The picker-waiting state does not show it.
- The resource-group map still shows its existing caption and does not show the new sentence.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx"
```

Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to select one resource group and read the sentence above that drawing, then open the resource-group map and confirm its caption is unchanged. Wait for that look before any commit.
