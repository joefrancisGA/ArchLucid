# Risk & Tradeoffs — Step 7: Execution-Context Elicitation Questions

## Context

Implement the 7 durable execution-context intake questions described in
`docs/architecture/analyzer_component.md` §7 (rev 7). These are a new
`execution-context` question group added to the existing elicitation system.
They are intake questions, not governance controls.

Prerequisites: Step 1 (Contracts) must be complete. Familiarity with
`UniversalIntakeQuestions.cs` and `QuestionSelectionEngine.cs` required.

## What the 7 questions are

Add these as constants to a new `ExecutionContextIntakeQuestions.cs` in
`ArchLucid.Application/Drafts/QuestionSelection/`:

```
exec.sponsor        — Executive sponsor + tenure
exec.tech-lead      — Technical leadership clarity and continuity
exec.staffing       — Skills and staffing for this specific architecture style
exec.business-case  — Business case with measurable, time-bound benefits
exec.adoption       — End-user / business-unit adoption plan
exec.schedule       — Schedule and budget realism relative to scope
exec.dependencies   — External dependencies (vendors, business units, regulators) and readiness
```

Each question must have:
- A stable `QuestionKey` (e.g. `"exec.sponsor"`)
- A `QuestionText` phrased to elicit a clear positive/negative/skipped response
- A `PillarGroup` of `"execution-context"` (new value, distinct from WAF pillar groups)
- `IsMust = true` for all 7 — an unanswered execution-context question appears as
  `DisclosureState.Undisclosed` in the `RiskSnapshot.ExecutionContext` list

## Disclosure mapping

After intake, map each answer to a `DisclosureState`:

| Answer | DisclosureState |
|--------|----------------|
| Positive/affirmed | `DisclosedOk` — articulated, not flagged |
| Negative/at-risk | `DisclosedRisk` → passed to concern synthesizer as grounding |
| Skipped MUST | `Undisclosed` — appears in snapshot as `Unknown` state |

This mapping is performed in `RiskSnapshotService.BuildAndSaveAsync` (Step 6)
before calling the concern synthesizer.

## Orphaned-outcome clarification

Add a clarification question to `QuestionSelectionEngine` that fires when the
stated `BusinessOutcome` has no traceable design element in the manifest.

Output: a clarification prompt surfaced to the architect: *"We couldn't trace
your outcome '[outcome text]' to any element in the design — can you confirm
which part of the design addresses it?"*

This is a **clarification question, not a risk**. It does not produce a
`RequirementSmell` or an `ArchitectureTradeoff`. It is displayed once and
dismissed after the architect responds or skips.

## Unit tests

- All 7 question keys resolve correctly from `QuestionSelectionEngine`.
- A skipped `exec.sponsor` question → `DisclosureState.Undisclosed` in the
  `ExecutionContextItem` for that key.
- A negative `exec.adoption` answer → `DisclosureState.DisclosedRisk`, which
  is forwarded to the concern synthesizer as a grounding fact.
- Orphaned-outcome clarification fires when no manifest element traces to the outcome.
- Orphaned-outcome clarification does NOT produce a `RequirementSmell` or tradeoff.

## Guardrails

- No new elicitation questions beyond the 7 listed. Do not expand into general
  project-management questions.
- Question text must be phrased to elicit a clear factual answer, not an opinion.
- `PillarGroup = "execution-context"` is separate from WAF pillar groups and
  must not appear in WAF pillar scoring.
- Follow the existing style in `UniversalIntakeQuestions.cs` exactly.
