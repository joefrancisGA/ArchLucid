# FS-20 — Lead with platform Azure OpenAI

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

Workspace AI settings lead with ArchLucid-managed Azure OpenAI as the ready path. Customer-supplied credentials sit in the existing optional disclosure.

## Why

ArchLucid Customer Self-Sufficiency is **68** (weight 1). The availability panel explains the managed probe after the operator is already in diagnostics. The ready path should be the first line.

## Read first

- `archlucid-ui/src/components/reviews/WorkspaceAiAvailabilityPanel.tsx`
- `docs/library/V1_SCOPE.md` section 2.4 (platform-provisioned Azure OpenAI)
- `archlucid-ui/src/components/reviews/WorkspaceAiAvailabilityPanel.test.tsx`

## What to build

1. Branch `fresh-score/20-platform-llm` from current `master`.
2. At the top of `WorkspaceAiAvailabilityPanel`, add `data-testid="workspace-ai-ready-path"` with the sentence `ArchLucid-managed Azure OpenAI is the ready path for this workspace.`
3. Keep the live probe result under that sentence.
4. Move customer-supplied credential fields into the existing `AdvancedOptionsAccordion`. Do not remove them.
5. The accordion label stays an optional disclosure. Do not require a sales engineer, a customer key, or a deployment name before the ready-path sentence renders.
6. Extend the panel test: the ready-path sentence is present, and the credential fields are inside the accordion.

## Tests

From `archlucid-ui`, run `WorkspaceAiAvailabilityPanel.test.tsx`.

## Done when

The panel leads with the managed Azure OpenAI sentence, and customer credentials remain available inside the optional disclosure.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/fresh-score-hold.md` before editing.
- Do not implement another FS prompt in this session.
- Do not commit.
- Beta remains **NO_GO**. Do not publish a fee, a public list price, a CPA SOC 2 report, or a third-party pen-test claim.
- Do not write a customer result, a timed SLA, or a minutes-to-value claim.
- Do not hide review workspace tabs behind a More menu.
- Do not call `PathRankingEngine` or change rank weights.
