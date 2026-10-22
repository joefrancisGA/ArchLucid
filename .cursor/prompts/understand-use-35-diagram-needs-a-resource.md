# UU-35 — Choose a resource before this diagram draws

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-36 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-35**). **Depends on:** diagram modes `selectedResources` and `dependencyNeighborhood`.

## Goal

When a diagram mode needs a chosen resource and none is chosen, the page says so.

## Why

`selectedResources` and `dependencyNeighborhood` return no canvas when the seed is empty. The mode name stays selected and the page looks broken.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (the branches that return null when the seed is empty)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` (`selectedResources`, `dependencyNeighborhood`)

## What to build

1. Branch `uu/35-diagram-needs-a-resource` from current `master`.
2. When the selected mode is `selectedResources` or `dependencyNeighborhood` and the seed is empty, show: "Choose a resource to draw this diagram."
3. When a seed is present, do not show that sentence.
4. Do not invent a resource. Do not change the mode value in the URL.
5. Do not add a second diagram.

## Acceptance criteria

- Selected resources with an empty seed shows the sentence and no canvas.
- The same mode with a seed does not show the sentence.
- Executive mode does not show the sentence.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to open Selected resources with nothing picked and read the sentence. Wait for that look before any commit.
