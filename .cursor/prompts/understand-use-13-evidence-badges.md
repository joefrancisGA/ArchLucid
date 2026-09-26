# UU-13 — One evidence-badge vocabulary

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-14 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-13**). **Depends on:** `formatSecurityEvidenceProvenanceKindLabel`.

## Goal

Path provenance uses one label and one meaning line everywhere it appears. Diagram currency words stay a separate set.

## Why

The same hop can read "Observed fact" in one table and the raw enum in another. Configured, observed, and derived also name diagram evidence currency. Those two vocabularies are easy to merge by mistake.

## Read first

- `archlucid-ui/src/lib/security-evidence-path-presentation.ts`
- `archlucid-ui/src/lib/security-evidence-path-presentation.test.ts`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `docs/library/SECURENOW_ARCHITECT_PLANE.md` (epistemic categories)
- The node-relationship evidence labels Current, Configured, Observed, and Derived. Do not change those strings.

## What to build

1. Branch `uu/13-evidence-badges` from current `master`.
2. Keep the enum values. Display labels stay:
   - `ObservedFact` → "Observed fact"
   - `DerivedFact` → "Derived fact"
   - `DeterministicInference` → "Deterministic inference"
   - `AiInference` → "AI inference"
   - `HumanAssertion` → "Human assertion"
3. Add one meaning line per label, in the same presentation module:
   - Observed fact: "This hop was read from collected evidence."
   - Derived fact: "This hop was calculated from collected evidence."
   - Deterministic inference: "A fixed rule produced this hop."
   - AI inference: "A model proposed this hop. It is not an observed fact."
   - Human assertion: "A person recorded this hop."
4. Use the helper in path-hop provenance, the routing provenance column, and any other path surface that still prints the raw enum. Show the meaning the first time that label appears in the panel, not on every repeated row. The chip itself stays on every row.
5. Do not map Configured onto Observed fact. Do not rename diagram currency labels.

## Acceptance criteria

- `ObservedFact` still renders "Observed fact".
- `AiInference` still renders "AI inference" and its meaning says it is not an observed fact.
- An unknown provenance string is unchanged and has no invented meaning.
- No percentage is introduced.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No LLM call. No enum rename. No API change.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/security-evidence-path-presentation.test.ts src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to inspect one path and read an observed-fact chip and an AI-inference chip. Wait for that look before any commit.
