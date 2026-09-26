# UU-05 — Path hop sentence

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-06 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** path detail hops already on `SecurityEvidencePathInspectPanel`. If UU-04 has landed, do not revert the queue sentence.

## Goal

Each hop in path inspect reads as a sentence. The confidence band stays a chip, with its meaning on the same row.

## Why

`PathHopsTable` is From, To, Edge, Provenance, and Band. The architect plane already stores those fields. The reader has to assemble the sentence.

## Read first

- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (`PathHopsTable`)
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.test.tsx`
- `archlucid-ui/src/lib/security-evidence-path-presentation.ts`
- `archlucid-ui/src/lib/security-evidence-path-types.ts` (`SecurityEvidencePathHop`)
- `docs/library/SECURENOW_ARCHITECT_PLANE.md` (ordinal bands, capability is not observed flow)

## What to build

1. Branch `uu/05-hop-sentence` from current `master`.
2. Add a Hop column as the first column of `PathHopsTable`. Build the sentence only from the hop fields, with no model call:
   - "{fromNodeLabel} to {toNodeLabel} by {edgeType}. Source: {provenance label}."
   - Provenance uses `formatSecurityEvidenceProvenanceKindLabel`.
3. Keep the existing columns after that sentence, including the weakest-hop marker.
4. Keep the band `StatusTag`. In the same cell, add one meaning line:
   - Confirmed: "The evidence for this hop is confirmed."
   - Highly likely: "The evidence for this hop is highly likely."
   - Probable: "The evidence for this hop is probable."
   - Possible: "The control plane allows this hop. No traffic was seen."
   - Insufficient evidence: "This hop does not have enough evidence."
5. An unknown band shows the existing label and no invented meaning line.
6. Do not call `buildSecurityEvidencePathExplanation` to fill this column. The simulator explanation stays the separate control it already is.

## Acceptance criteria

- A hop from "Internet" to "Storage" with edge "Exposes", provenance `ObservedFact`, and band `Possible` renders "Internet to Storage by Exposes. Source: Observed fact." and "The control plane allows this hop. No traffic was seen."
- The weakest hop is still marked.
- No percentage appears.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No LLM call. No Azure write. No new finding.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to inspect one path and read a hop sentence and its band line. Wait for that look before any commit.
