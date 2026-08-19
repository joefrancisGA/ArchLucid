> **Scope:** Contributor-reference — Tier 3 assessment holds with explicit reassessment criteria (not implementation commitments).

# Assessment hold reassessment criteria

**Last reviewed:** 2026-06-07

## Improvement 14 — AI eval baseline merge-blocking

Promote only when:

- Ten consecutive main-branch green runs with zero false-positive PR failures from LLM/judge noise
- Improvements 2, 3, and strict RC evidence capture are complete
- Branch protection owners approve adding the eval gate as required

## Improvement 15 — Automatic retry on quality gate reject

Promote only when:

- Production pilot traces show quality rejects are transient (not systematic schema/faithfulness failures)
- Owner approves retry budget cap and cost envelope

## Improvement 16 — Broader AI assistive features

Promote only when:

- Tier 1 claim/proof/evidence gates are green for the active release candidate
- Feature scope is claim-safe and does not widen trust boundaries
