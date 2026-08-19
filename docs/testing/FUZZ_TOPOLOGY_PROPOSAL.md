# Topology proposal fuzz harness (Prompt 12)

CI uses a **deterministic seeded byte mutator** in `TopologyProposalFuzzTests` (filter `TopologyProposalFuzz`).

- Default iterations: **32** (`ARCHLUCID_FUZZ_ITERATIONS` overrides for local runs).
- Expected outcomes: parsed proposal, documented `JsonException`, or empty merge with invariant checker pass.

**SharpFuzz / libFuzzer follow-up:** not wired in CI yet — Windows/Linux agents do not install native libFuzzer today. When infra allows, add `SharpFuzz.CommandLine` harness reusing `tests/fuzz/topology-proposal/` seeds.
