# Diagram AI usability acceptance — 2026-09-13

Wave: **DAU-01–DAU-12** (diagram-ai-usability). This file records honest ship status after the first implementation pass.

| Prompt | Title | Status | Notes |
|--------|-------|--------|-------|
| DAU-01 | ADR 0101 assist compiles to controls | **Shipped** | ADR + README + input-contract pointer |
| DAU-02 | Ask returns validated DiagramViewPlan | **Shipped** | Contracts, validator, intent, collector, prompt builder, grounding, unit tests |
| DAU-03 | Workbench apply + density coach | **Shipped** | `applyDiagramViewPlanToSearch`, Apply button, density coach strip |
| DAU-04 | Smart camera fit subgraph | **Shipped** | `focusNodeIds` / `focusNonce` on viewer; focus fit helper in `help-mermaid.ts` |
| DAU-05 | Walkthrough + click-to-explain | **Partial** | Deterministic walkthrough + explain helpers; inventory walkthrough line wired; review architecture panel not wired |
| DAU-06 | Path highlight X→Y | **Not started** | Requires `DiagramVisiblePathFinder` C#/TS |
| DAU-07 | Finding spotlight narration | **Shipped** | `buildFindingDiagramSpotlight` + dual-pane status line |
| DAU-08 | Reconcile MatchKind overlay | **Not started** | Table-only reconcile unchanged on canvas |
| DAU-09 | NL model patches | **Not started** | |
| DAU-10 | Inferred + regenerate merge | **Not started** | |
| DAU-11 | Vision opt-in side-by-side | **Not started** | Vision default remains off |
| DAU-12 | Honesty ratchet + close | **Partial** | This acceptance doc only |

## Verification run (this pass)

- `dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InfraEvidenceAsk|DiagramViewPlanValidator'`
- Focused Vitest on new helpers and touched clients

## Deferred intentionally

DAU-06–DAU-11 remain follow-on PRs. No LLM Mermaid SoT, no default-on vision, no review-tab collapse.
