# PR queue reduction follow-up

CodeQL is moved off the pull-request hot path in this branch.

Recommended follow-up for `.github/workflows/golden-cohort-nightly.yml`:

- Keep `cohort-contract` and `cohort-real-llm-gate` on pull requests because the active ruleset requires `cohort-real-llm-gate`.
- Add PR-aware concurrency with `cancel-in-progress: true` so superseded commits stop consuming runners.
- Run `cohort-faithfulness-phase-b-warn`, `cohort-rag-live-model-faithfulness`, `cohort-simulator-drift`, and `cohort-real-mode-eval-corpus` only for schedule/manual runs, not pull requests.
- Leave `cohort-real-llm-live` schedule/manual-only.

This note can be removed after the golden-cohort workflow is updated.
