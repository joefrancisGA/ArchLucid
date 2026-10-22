# UU-17 — One shape for the recommended action

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-18 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-17**). **Depends on:** path detail, rank prose, cut points, and routing already loaded in path inspect. If UU-09 has landed, keep "What could break".

## Goal

The advisory action on path inspect uses six labeled lines: problem, evidence, consequence, recommended change, owner, and verification.

## Why

The inspect panel already has an architect sentence, cut points, routing, and rank prose. The reader has to decide which paragraph is the problem and which is the change.

## Read first

- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `archlucid-ui/src/lib/security-evidence-path-types.ts`
- `docs/library/SECURENOW_ARCHITECT_PLANE.md` (advisory remediation, no Azure mutation)

## What to build

1. Branch `uu/17-finding-action-shape` from current `master`.
2. Add a block titled "Recommended action" on path inspect, filled only from data already loaded:
   - Problem: architect sentence, else the rank `explanationSummary`.
   - Evidence: the weakest-hop reason, else the first cited evidence reference already on the path.
   - Consequence: rank `dimensionProse.blastRadius` when present.
   - Recommended change: the first cut-point explanation, else the explanation template `proposedChange`.
   - Owner: the first routing display name or role.
   - Verification: the explanation template `verify` field, else the existing verification status line.
3. A missing part says "Not cited." Do not invent an owner, a change, or a verification step.
4. Do not call the simulator endpoint to fill the block. The existing generate-explanation control stays separate.
5. Do not add an apply button or an Azure write.

## Acceptance criteria

- A path with an architect sentence and one routing row shows those values under Problem and Owner.
- A path with none of the source fields shows "Not cited." on every line.
- No new finding and no percentage.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The six labels are exactly Problem, Evidence, Consequence, Recommended change, Owner, Verification.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to inspect one path and read the six lines before the hop table. Wait for that look before any commit.
