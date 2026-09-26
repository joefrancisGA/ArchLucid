# UU-57 — An insufficient Ask answer is the snapshot

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-58 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-57**). **Depends on:** UU-49. Keep the Ask banner above the question.

## Goal

When Infrastructure Ask marks an answer as insufficient evidence, the page says the snapshot cannot answer and Ask did not query live Azure.

## Why

The response shows an Insufficient evidence tag and the answer text. A reader can still think Ask reached Azure and Azure had no data.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.tsx` (`infra-ask-insufficient-evidence`)

## What to build

1. Branch `uu/57-ask-insufficient-evidence` from current `master`.
2. When `turn.response.insufficientEvidence` is true, under the existing Insufficient evidence tag and before the answer paragraph, show: "This snapshot does not have enough evidence to answer. Ask did not query live Azure."
3. Keep the existing answer text.
4. Do not show that sentence when `insufficientEvidence` is false.
5. Keep the UU-49 banner: "Answers use the inventory snapshot on this page. They do not query live Azure."

## Acceptance criteria

- An insufficient answer shows the new sentence and the existing answer.
- A sufficient answer does not show the new sentence.
- The question-box banner is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to ask a question that returns insufficient evidence and read the new sentence before the answer. Wait for that look before any commit.
