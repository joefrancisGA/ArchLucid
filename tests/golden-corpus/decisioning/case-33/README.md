> **Scope:** Golden decisioning corpus **case-33** — `DeclarationSecurityBaselineFindingEngine` on declaration-ingested topology properties (`tf.public_network_access` + `httpsOnly`). **No LLM** — JSON fixtures only.

# case-33

**Scenario.** Single `TopologyResource` with public network access enabled and HTTPS disabled exercises **declaration-security-baseline** (fail-open default compliance pack emits both data-protection and transport-security themes). Other harness engines may add topology coverage signals on the same graph.

Regenerate `expected-*.json` by running `GoldenCorpusRegressionTests` and reconciling `.actual` dumps after intentional engine changes.
