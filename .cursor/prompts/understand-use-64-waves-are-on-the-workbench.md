# UU-64 — Waves stay on the workbench

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-65 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave G (**UU-64**). **Depends on:** the read-only wave list. Do not create a wave.

## Goal

The remediation factory stops saying it plans waves. It links to the workbench list. That list says how many findings are in each wave.

## Why

The factory subtitle says "Explainable prioritization, wave planning, and executive metrics." The factory does not load waves. The workbench section "Wave planner (read-only)" prints `name: 2 / 5 members`. A reader cannot tell the cap from the count, and the factory has promised a planner it does not contain.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (page subtitle)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx` (the section whose aria-label is "Wave planner read-only")
- `archlucid-ui/src/lib/product-line/securenow-remediation-instances-route.ts`

## What to build

1. Branch `uu/64-waves-are-on-the-workbench` from current `master`.
2. Replace the factory subtitle with: "Fix these findings first. Advisory only — this page does not change Azure."
3. Under the Priority queue heading, add one link, "Open remediation waves", to `remediationInstancesPathForProductLine` for the current product line plus `#remediation-waves`. Style it as a link, not a button.
4. On the workbench section, set `id="remediation-waves"`. Change the heading to "Remediation waves".
5. Each list item reads "{name}: {memberCount} findings in this wave." When `targetSize` is present, add a second line on that item: "Cap {targetSize}."
6. When the list is empty, keep "No remediation waves yet." Add one helper: "This list shows waves that already exist."
7. Do not add a create, assign, or resize control. Do not fetch waves on the factory page.

## Acceptance criteria

- The factory subtitle does not contain "wave planning".
- The factory link href ends in `#remediation-waves`.
- A wave with name "Wave A", memberCount 2, and targetSize 5 shows "Wave A: 2 findings in this wave." and "Cap 5."
- The workbench has no new button.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The strings above are exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx" "src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to read the factory subtitle and the workbench wave line. Wait for that look before any commit.
