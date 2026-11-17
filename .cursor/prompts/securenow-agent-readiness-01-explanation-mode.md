# SN-AIR-01 — Label the path-explanation mode

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-AIR prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_AGENT_READINESS_COMPOSER_PROMPTS.md`

## Goal

Path inspect asks for a live explanation when this browser session is in Real agent-execution mode, and for the simulator explanation otherwise. The panel label follows the returned provenance.

## Why

AI/Agent Readiness is **66** (weight 8, weighted deficiency 272) on the 1 November 2026 desk pass. `SecurityEvidencePathExplanationService` already accepts `useSimulator: false` and stores `ProvenanceKind.AiInference`. `SecurityEvidencePathInspectPanel` always posts `useSimulator: true` and always renders `SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_TAG`.

## Read first

- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (`generateExplanation`, `PathExplanationSection`)
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`
- `archlucid-ui/src/lib/security-evidence-path-api.ts` (`buildSecurityEvidencePathExplanation`, `mapExplanation`)
- `archlucid-ui/src/hooks/use-agent-execution-mode.ts`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.test.tsx`

## What to build

1. Branch `sn-air/01-explanation-mode` from current `master`.
2. In the path-inspect panel, call `useAgentExecutionMode`.
3. Post `useSimulator: false` only when `mode` is `Real` and `isLoading` is false. When `mode` is null, still loading, or simulator, post `useSimulator: true`.
4. Change the button label to `Generate explanation`. Keep a loading label.
5. Change the lead so it names the mode that this click will use: simulator when the post will set `useSimulator: true`, and model when the post will set `useSimulator: false`. State that structured hops stay authoritative.
6. After a result returns:
   - `provenanceKind` `AiInference`: status tag `Model — cited stored path`. Do not also show `Simulator — not live LLM`.
   - `provenanceKind` `DeterministicInference`, or a non-empty `simulatorLabel`: keep `Simulator — not live LLM`.
7. Add the new copy constants next to the existing explanation constants in `securenow-path-inspect-copy.ts`.
8. Extend `SecurityEvidencePathInspectPanel.test.tsx`. Mock `useAgentExecutionMode` if the file does not already mock it.
   - Simulator mode posts `useSimulator: true` and shows `Simulator — not live LLM` after a deterministic result.
   - Real mode posts `useSimulator: false` and shows `Model — cited stored path` when the mapped explanation has `provenanceKind` `AiInference`.
   - While `isLoading` is true, a click still posts `useSimulator: true`.

## Tests

From `archlucid-ui`:

`npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not change `SecurityEvidencePathExplanationService` in this session. Fallback and the token cap are later prompts.
- Do not edit `PathRankingEngine`, `CutPointAnalysisEngine`, or `SecurityEvidencePathRankCalculator`.
- Do not add a keyword topic, a probability, or a second rank.
- Do not commit.

## Done when

A Real session posts `useSimulator: false` and labels an `AiInference` result as a model explanation. A simulator session still posts `useSimulator: true` and keeps the simulator label.
