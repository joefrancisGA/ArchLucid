> **Scope:** Contributor-reference — internal engineering assurance guidance and operational controls; not buyer-facing proof or a correctness/superiority claim.

# ArchLucid decision kernel

ArchLucid should separate deterministic evidence facts from bounded inference and from human/model judgment.

## Layer 1 — Evidence facts

Deterministic:

- artifact/snapshot identity and hashes;
- parsed fields and graph structure;
- policy-pack/rule identity;
- evidence-reference existence and resolvability;
- provenance labels;
- tenant/workspace/project scope;
- engine execution status;
- sealed/committed record identity.

## Layer 2 — Bounded deterministic inference

Examples:

- graph reachability and structural contradictions;
- requirement/topology diffs;
- rule predicates;
- coverage/missing-evidence state;
- deterministic severity tables where explicitly versioned;
- checklist versus decision-grade routing predicates.

Every Layer-2 inference must be reproducible from pinned Layer-1 inputs and a versioned rule/algorithm.

## Layer 3 — Semantic judgment

Model/human reasoning:

- whether evidence semantically supports a broad architectural conclusion;
- tradeoff quality;
- recommendation choice among multiple valid designs;
- business consequence not explicitly asserted;
- ambiguous requirement interpretation;
- narrative/explanation.

Layer 3 may cite Layers 1–2 but may not silently rewrite them.

## Output invariant

A decision-grade conclusion should expose the chain:

`pinned input → deterministic fact/inference → semantic conclusion → recommendation/governance disposition`

Missing Layer-1 evidence weakens or blocks a strong conclusion; it never becomes proof of absence.

## Existing enforcement

Decision-grade provenance validators, evidence refs, generation-status/engine-failure channels, insight-density routing, policy/rule identity, sealed manifests and claim-boundary guards already implement pieces of this kernel. The assurance program documents them as one boundary rather than creating a duplicate decision engine.
