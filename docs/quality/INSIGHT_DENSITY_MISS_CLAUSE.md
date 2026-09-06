> **Scope:** Honesty note for insight-density scoring (WK-15). Production gate behavior per ADR 0070 (IS-05).

# Insight density miss clause

**Production gate (ADR 0070, DX-01):** `DeterministicInsightDensityGate` applies the demotion predicate to **typed-engine** and agent findings in **all categories** (Security, Topology, Compliance included). Generic rows without **resolvable** package evidence (`doc:`, ARM paths, `policy-rule:`, etc.) become `ChecklistCoverage`; bare `RelatedNodeIds` and category name do not prevent demotion. Rows remain on the package snapshot.

## Pillar clauses vs current mechanisms

| Pillar clause (assessment language) | Current mechanism |
|-------------------------------------|-------------------|
| Miss | Partial — dismiss / mute flows; no automatic "miss" demotion label |
| Dismiss | Operator disposition + insight-density classification bands |
| Operationalize | Governance queue / ITSM — not density-score gated |
| Package | Sealed snapshot + exports — classification counts on stamp (IS-06) |

A **filter cannot raise density** by itself; raising the headline score requires **new information** (engines, parsers, intake actors) — not relabeling.

## Corpus limit

The distribution report lists engine types that produced findings on the golden corpus graphs. The harness registers **sixteen** engines (`GoldenCorpusHarness.CreateEngines`); only a subset appear in the distribution table on any given record pass. **23** built-in product engines are absent from the harness slice (39 − 16). `WouldDemoteIfUnprotectedCount` reflects **production** demotion after ADR 0070.

## Forbidden without owner decision

- Adding a 40th coverage-shaped engine from weakness remediation prompts — see [`HOLD_NO_COVERAGE_ENGINES.md`](HOLD_NO_COVERAGE_ENGINES.md)
- Checking in fake frontier LLM transcripts (`tests/eval-corpus/insight-density-frontier-delta/`)

**Superseded:** The `typed-engine-protected` Promote short-circuit (always Promote regardless of score) was forbidden until ADR 0070; production now applies `DemotionThreshold` to typed-engine findings (IS-05).

## Related

- [`insight-density-engine-distribution.md`](insight-density-engine-distribution.md)
- [`../architecture/adrs/0070-insight-density-controls-typed-engines.md`](../architecture/adrs/0070-insight-density-controls-typed-engines.md)
- [`../architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](../architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) ID-11
