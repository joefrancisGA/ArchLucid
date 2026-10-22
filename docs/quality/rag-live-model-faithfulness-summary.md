> **Scope:** Committed real-mode LLM faithfulness signal for the RAG quality program; does not invoke live models in CI.

# RAG live-model faithfulness signal

- **Disposition:** **PASS**
- **Positive real-mode scenarios scored:** 18
- **LLM faithfulness p50:** 0.72
- **p50 floor:** 0.65
- **Absolute floor:** 0.5
- **Adversarial ceiling:** 0.4

Phase B scores come from committed real-mode exemplars with semanticScore.llmFaithfulnessScore — not a live deployment-model run in this job.

## Graph-RAG ablation (TB-883)

- **Status:** computed
Citation support ratio recomputed offline by filtering sourceType='KnowledgeGraphNodeNeighbor' hits (EnableGraphRag=false simulation). Negative mean Δ vs all-on means Graph-RAG neighbor expansion contributed cited hits on captured live-model exemplars; positive Δ means neighbors were uncited or diluted ratio.

- **Exemplars with retrievalHits:** 1
- **Mean all-on citation support ratio:** 0.666667
- **Mean Graph-RAG-off citation support ratio:** 1.0
- **Mean Δ vs all-on (Graph-RAG-off − all-on):** 0.333333

| Exemplar | All-on | Graph-RAG off | Δ vs all-on | Neighbor hits removed |
| --- | ---: | ---: | ---: | ---: |
| `corpus-real-mode-smoke.real.json` | 0.666667 | 1.0 | 0.333333 | 1 |

Exemplars without `retrievalHits` skipped: 17 (HyDE/query-rewrite live ablation remains a separate follow-up).

