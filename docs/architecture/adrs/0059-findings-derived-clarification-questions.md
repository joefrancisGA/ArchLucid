# ADR 0059: Findings-derived clarification questions

**Status:** Accepted  
**Date:** 2026-08-21

## Context

Operators reviewing architecture assessments often need to resolve coverage gaps surfaced as findings before sponsors can trust the review. Heuristic clarification gaps (brief length, missing actors) do not track assessment findings and do not close the loop when a second review is started from a prior package.

## Decision

1. Derive up to seven clarification questions from coverage finding payloads (topology, policy, security, capability, baseline completeness, policy applicability when no topology links exist).
2. Expose `GET /v1/architecture/review/{runId}/clarification-questions?priorRunId=` with audit `ReviewClarificationQuestionsAccessed`.
3. Compute a question-id delta when `priorRunId` is supplied (resolved by evidence, resolved by assertion, still open).
4. Format operator inline answers as `[finding-clarification] {answer} [q={questionId}]` assumptions projected through draft intake.
5. Surface findings-derived gaps and an inline answer capture panel on the architecture clarifications tab when a clarification round is available.

## Consequences

- **Security:** Read-only API behind `ReadAuthority`; answers flow through existing draft admission and scope checks.
- **Scalability:** Derivation is in-memory over the findings snapshot; capped at seven surfaced questions.
- **Reliability:** Missing prior run or snapshot degrades to empty delta, not hard failure.
- **Cost:** No additional LLM calls; deterministic rules only.

## Alternatives considered

- LLM-generated follow-up questions (deferred; bounded generative tier ADR 0058 remains separate).
- Persisting clarification questions as first-class rows (deferred; derived view is sufficient for V1 loop).
