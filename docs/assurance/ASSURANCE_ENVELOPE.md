# Assurance envelope

Important ArchLucid/SecureNow conclusions should retain enough context to answer: **what was evaluated, by what logic, against which evidence, with what certainty, and did evaluation actually complete?**

## Required envelope dimensions

| Dimension | Minimum evidence |
|---|---|
| Input identity | Run/context/graph or inventory snapshot identity |
| Engine identity | `EngineType` / path kind |
| Rule identity | Policy/rule id when applicable |
| Engine/rule version | Stable implementation/rule version where available |
| Evidence | Package-resolvable evidence refs or path-hop evidence |
| Provenance | ObservedFact / DerivedFact / DeterministicInference / AiInference / HumanAssertion where applicable |
| Evaluation state | finding / no finding / evaluation failed; degraded coverage visible |
| Scope | tenant/workspace/project where persisted |
| Uncertainty | confidence/support band or explicit insufficient-evidence state |
| Assumptions/limitations | visible when a conclusion depends on missing or inferred evidence |
| Model provenance | model deployment/version/prompt version for AI-sourced findings |

## Current mapping

`Finding` already carries run/input refs, engine, rule, evidence refs, model/prompt provenance, confidence, classification and semantic-support fields. `FindingsSnapshot` carries generation status and engine failures. SecureNow path records retain snapshot, path kind, confidence and per-hop provenance/evidence.

This envelope is intentionally distributed across the canonical records rather than duplicated into one giant DTO. New surfaces should map from these records rather than invent parallel truth.

## Tripwire

A surface may simplify presentation, but it must not silently strengthen the conclusion beyond the envelope. In particular, AI prose cannot upgrade `DeterministicInference` to `ObservedFact`, and missing evaluation cannot become a clean negative.
