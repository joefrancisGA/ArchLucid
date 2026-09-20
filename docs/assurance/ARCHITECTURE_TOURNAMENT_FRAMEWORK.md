# Architecture tournament framework

The tournament is a **measurement system**, not a marketing score generator.

## Benchmark layers

1. **Visible development cases** — five deep cases in `tests/architecture-tournament/development-deep-cases.json`. They are allowed to drive engineering iteration and therefore are never held-out evidence.
2. **Sealed holdout slots** — 25 case identifiers in `heldout-slot-registry.json`. Expected findings, rubrics and answer keys remain outside the development repository in an owner-controlled grading store.
3. **External human panel** — senior architects grade blinded outputs independently. This remains external execution, not a repository assertion.

The 25-slot registry deliberately replaces the original proposal to commit 25 visible “held-out” answer keys. Committing the truth would destroy holdout integrity.

## Dimensions

The tournament records these dimensions separately:

- critical issue recall;
- precision / false-positive control;
- severity calibration;
- evidence quality;
- tradeoff recognition;
- recommendation usefulness;
- unsupported-claim control;
- contradiction control;
- consistency;
- elapsed time;
- model/tool cost.

No single Elo-like score is the product of record.

## Hard gates

A run fails its hard-gate layer if it invents evidence or regulation, uses unsupported certainty, or produces contradictory artifacts. High average quality cannot compensate for a hard credibility failure.

## Tooling

- `scripts/assurance/validate_tournament_assets.py` protects holdout isolation.
- `scripts/assurance/architecture_tournament.py` summarizes raw dimension grades and hard gates.
- `scripts/assurance/compare_tournament_runs.py` reports version-to-version dimension deltas without declaring a winner.
- `scripts/assurance/generate_adversarial_architecture_cases.py` creates deterministic adversarial perturbation descriptors.
- `scripts/assurance/credibility_reviewer.py` performs the “that cannot be right” pass.
- `scripts/assurance/cross_surface_consistency.py` checks canonical finding fields across surfaces.
- `scripts/assurance/determinism_audit.py` fingerprints repeated outputs after explicit volatile-field removal.

## Claim boundary

Development-case performance demonstrates development-fixture behavior only. Held-out case performance requires sealed truth. Claims against human experts require actual blinded external grading. Neither may be inferred from visible corpus results.
