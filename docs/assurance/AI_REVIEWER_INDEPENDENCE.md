> **Scope:** Contributor-reference — internal engineering assurance guidance and operational controls; not buyer-facing proof or a correctness/superiority claim.

# AI reviewer independence

Two calls to similar frontier models with the same context are **correlated evidence**, not independent proof.

## Reviewer roles

Use deliberately different objectives:

- **Builder** — produce the implementation or architecture analysis.
- **Skeptic** — search for false assumptions, missing evidence, contradictions and unsupported certainty.
- **Reference checker** — compare bounded deterministic questions against a simple independent oracle.
- **Adversary** — perturb inputs and search for invariant violations.
- **Human adjudicator** — resolve important disagreements on held-out cases.

## Independence requirements

An independent AI review should vary at least one of:

- model family/provider when available;
- system instructions/objective;
- context selection;
- tool path;
- evidence order;
- algorithm (e.g. brute-force reference versus optimized production traversal).

Do not call a self-critique pass independent simply because it is a second completion.

## Escalation

AI disagreement is a **trigger for evidence review**, not a vote. For security paths, RBAC inheritance, tenant isolation, sealed evidence and other deterministic kernels, reference algorithms and structural checks outrank model consensus.
