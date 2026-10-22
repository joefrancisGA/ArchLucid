# UU-36 — The remaining diagram modes say their job

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-37 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-36**). **Depends on:** `INFRA_DIAGRAMS_MODE_OPTIONS`. If UU-06 has landed, keep its data labels.

## Goal

Diagram modes that are still a single word say the question that mode answers.

## Why

Data, data flow, and data architecture already say their jobs. Executive, Network, Security, and Identity do not, so the picker looks like a list of departments.

## Read first

- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` (`INFRA_DIAGRAMS_MODE_OPTIONS`)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (the mode picker)

## What to build

1. Branch `uu/36-diagram-job-phrases` from current `master`.
2. Change only these visible labels. Leave the `value` strings unchanged.
   - executive → "Executive — the sponsor view"
   - architecture → "Architecture — how parts fit"
   - network → "Network — what can reach what"
   - security → "Security — where controls sit"
   - businessContinuity → "Business continuity — what can be restored"
   - identity → "Identity — who can act"
   - full → "Full subscription — every resource in scope"
   - resourceGroup → "One resource group"
   - selectedResources → "Resources you picked"
   - dependencyNeighborhood → "What depends on one resource"
3. Do not change `data`, `dataFlow`, `dataArchitecture`, or `avd`.
4. Do not say a network line is observed traffic.

## Acceptance criteria

- The identity option reads "Identity — who can act".
- The URL value for that option is still `identity`.
- The data-flow label is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The new labels above are the exact strings.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts "src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx"
```

Add a label test if the filter-url suite does not exist. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open the diagram picker and read Identity, Network, and Data flow. Wait for that look before any commit.
