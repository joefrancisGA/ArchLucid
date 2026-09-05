> **Scope:** Contributor-reference — deterministic remediation pattern matching rules (IE-11).

# Remediation pattern matching (IE-11)

Deterministic matcher from `OperationalSecurityFinding` to **Approved** `RemediationPattern` versions. AI may propose `PossibleMatch` only; it cannot record `ExactMatch`.

## Match kinds

| Kind | Rule |
|------|------|
| **ExactMatch** | Finding `Provider` + `ResourceType` + `ControlId` align with pattern match fields; severity meets `MatchSeverityMin` when set |
| **ProbableMatch** | Finding has `ResourceType` + `ControlFramework` but **no** `ControlId`; pattern `MatchResourceType` + `MatchControlId` (framework key) align |
| **PossibleMatch** | Metadata `propertyEquals` all match, or keyword overlap in title/description/control objective |
| **Conflict** | Two or more ExactMatches, contradictory automation strategies, or version skew on the same pattern |
| **NoMatch** | No candidate satisfies the above |

## Explain string format

`Pattern {patternKey} v{version} matched because {reason}.`

## Conflict handling

Conflicts are **persisted** (`RemediationPatternMatchConflicts`) and the active match result is `Conflict`. Execution preflight (IE-13) must **fail closed** when `MatchKind = Conflict`.

## AI proposals

`RemediationPatternMatchGuard` rejects `AIProposed` + `ExactMatch`. AI may record `PossibleMatch` (or `ProbableMatch`) via `TryRecordProposedMatchAsync`.

## Non-goals

- Not `IFindingEngine`
- Does not start remediation instances
- LLM cannot mint `ExactMatch`
