> **Scope:** Generated simulator-vs-real drift artifacts for golden cohort scenarios — operator-only; not a CI gate on every PR.

# Drift reports (`*-drift.json`)

Files named `{scenario-id}-drift.json` are produced by `ArchLucid.AgentRuntime.Tests` **`SimulatorVsRealDriftTests`** when Azure OpenAI credentials are configured (see `SkipIfNoRealMode` / `GoldenCohortRealModeGate` in source).

They are **gitignored** by default so local runs do not churn binary-ish JSON in PRs. Upload artifacts from the manual workflow **golden-cohort-simulator-real-drift** when you need to retain outputs.

## Sample schema

See `gc-001-drift.sample.json` for a checked-in example shape (synthetic numbers).
