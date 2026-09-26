# UU-09 — What could break beside the advisory change

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-10 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** cut points and blast-radius prose already loaded for a path. If UU-05 has landed, keep the hop sentences.

## Goal

The advisory remediation on path inspect lists what could break, using cited cut points and the blast-radius prose already on the rank detail.

## Why

SecureNow already separates the suggested change from blast radius. Those facts are on the path inspect panel in different blocks. The change is easier to judge when the dependents sit with it.

## Read first

- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.test.tsx`
- `archlucid-ui/src/lib/security-evidence-path-types.ts` (`relatedCutPoints`, `dimensionProse.blastRadius`)
- `docs/library/SECURENOW_ARCHITECT_PLANE.md` (advisory remediation, no customer Azure mutation)

## What to build

1. Branch `uu/09-what-could-break` from current `master`.
2. Next to the existing advisory remediation content (cut points and the advisory instance link), add a block titled "What could break".
3. Fill it only from data already loaded:
   - Each `relatedCutPoints` `explanationSummary`, one line each.
   - `dimensionProse.blastRadius` from the rank detail when that query has already succeeded.
4. When both are empty, the block says "No dependent or shared control is cited for this change."
5. Do not add a button that applies, writes, or executes a change in Azure. Keep the existing advisory instance link as a link.
6. Do not create a finding, a path, or a cut point. Do not call a model.

## Acceptance criteria

- A path with one cut-point explanation shows that sentence under "What could break".
- A path with no cut points and no blast-radius prose shows the empty sentence.
- The block does not show a percentage.
- No new mutation endpoint and no Azure write.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The title is "What could break".
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to inspect a path that has a cut point and read "What could break" before opening the advisory instance. Wait for that look before any commit.
