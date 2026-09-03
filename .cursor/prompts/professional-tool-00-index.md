<!-- Professional-tool mitigation prompts — paste one prompt per Composer session.
     Origin: owner question that ArchLucid is a working-architect tool (all-day use;
     livelihoods may depend on it), not a casual evaluator product.
     Last updated: 2026-09-03. -->

# Professional-tool mitigations — Composer prompt set

ArchLucid's commercial and foundational story is a **seat for a repeat professional**. Large parts of the shipped UX still default to **first-session / buyer-eval** behavior. These ten prompts mitigate that mismatch.

**Run order:** independent. Prefer **01 → 02 → 10** if you run several in one week (mode + chrome + nav share Workspace mode). **04** must not reintroduce a desktop **More** menu for review workspace tabs. **07** must not change `typed-engine-protected`.

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**).

## Mapping

| # | Prompt file | Concern it mitigates |
|---|-------------|----------------------|
| 01 | `professional-tool-01-working-default.md` | Guided teaching chrome is the default; first paint flashes teaching UI |
| 02 | `professional-tool-02-working-chrome.md` | Production shell is buyer-polished; dense chrome is env-only |
| 03 | `professional-tool-03-expert-start.md` | Experts are forced through a naive first-run funnel |
| 04 | `professional-tool-04-stable-review-tabs.md` | Review workspace tabs re-rank by lifecycle (muscle memory) |
| 05 | `professional-tool-05-durable-undo.md` | 10-second undo; many livelihood actions are irreversible |
| 06 | `professional-tool-06-keyboard-work.md` | Shortcuts are page jumps; header sits outside the shortcut boundary |
| 07 | `professional-tool-07-finding-ranking.md` | Insight density is advisory; professionals cannot triage by judgment |
| 08 | `professional-tool-08-transparency-trail.md` | Liability stance requires a visible asserted/inferred/skipped trail |
| 09 | `professional-tool-09-no-sample-recovery.md` | Live failures and first-run rails can send users into sample/demo data |
| 10 | `professional-tool-10-working-nav.md` | Role-shaped / first-session nav hides the professional's tools |

## Global constraints (every prompt)

- Working-tree safety: run `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip that path and report it.
- **Do not** hide desktop review workspace tabs behind a **More** menu or overflow. Mobile may keep a select. See `.cursor/rules/no-collapse-workspace-tabs.mdc`.
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected` demotion behavior (owner decision). Prompt 07 is presentation/ranking only.
- **Do not** implement GTM V1.1 human cohorts (#2, #3, #5, #6) or SOC 2 CPA / third-party pen-test programs.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. Buyer-visible copy stays in `CONCEPT_VOCABULARY.md` / `VOCABULARY_ROSETTA.md`.
- Verification: focused Vitest (`npx vitest run <files>` from `archlucid-ui/`). Scoped `.\scripts\ci\agent-compile-check.ps1` only when C# changes. No full-solution builds, no dev servers unless the prompt says otherwise.
- UI: Carbon-inspired density (`docs/library/UI_DESIGN_SYSTEM.md`). Sentence case. No ghost/link `Button` variants. Form validation **TB-2005**.
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first line in a method; check nulls; prefer LINQ and concrete types.

## After each prompt

Summarize: files changed, tests run, residual risk, and whether Working vs Guided still behaves as specified.
