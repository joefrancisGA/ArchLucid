> **Scope:** Golden decisioning corpus **case-34** — `DeclarationPremiseConflictFindingEngine` when a `SecurityBaseline` intent conflicts with linked declaration properties. **No LLM** — JSON fixtures only.

# case-34

**Scenario.** `SecurityBaseline` ("Private only network access") **PROTECTS** a `TopologyResource` whose `tf.public_network_access` is enabled — exercises **declaration-premise-conflict** on the data-protection theme.

Regenerate `expected-*.json` by running `GoldenCorpusRegressionTests` and reconciling `.actual` dumps after intentional engine changes.
