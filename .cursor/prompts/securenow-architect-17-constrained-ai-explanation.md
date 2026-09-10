# SA-17 — Constrained AI path explanation

**Do not** let the model mint snapshot rows, edges, ExactMatch, or ObservedFact. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Optional LLM (or simulator template) that **summarizes a cited PathId**: executive explanation, likely business impact *hypotheses* as AiInference, proposed remediation pointing at SA-14 fields. Citations ⊂ hop evidence refs and PathId. IE-08 pattern.

## Why

AI is excellent at explaining paths and terrible at inventing Azure. The loop is deterministic evidence → engines → AI interpretation → deterministic validation.

## Context

- Plane §11
- IE-08 diff narrative
- `IPromptRedactor`; WK-10 simulator honesty
- IE-11 `RemediationPatternMatchGuard` (AI cannot ExactMatch)

## What to build

1. Persist explanation as AiInference with `citations` subset of hop evidence ids. Simulator: deterministic template + SIMULATOR label.
2. Reject explanations that introduce ARM ids not on the path.
3. Do not call LLM on InsufficientEvidence-only paths unless the user explicitly asks (API flag default skip).
4. Tests: citation subset; unknown ARM in model output stripped/rejected; simulator no live network; redaction invoked.

## Acceptance criteria

- Structured path remains authoritative.
- Real-mode host JSON default for this feature is **off** or follows existing Ask/narrative defaults — document which.

## Constraints

- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

A path can be narrated without becoming evidence.
