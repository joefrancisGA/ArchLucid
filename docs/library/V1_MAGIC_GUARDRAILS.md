> **Scope:** Contributor-reference — product and engineering guidance for bounded V1 AI affordances. This is not a roadmap expansion and does not promote V1.1/V2 items into V1.

# V1 Magic Guardrails

ArchLucid should feel impressive in V1, but the magic must come from **grounded experience design**, not unsupported autonomy. **Note:** These guardrails apply to **buyer-facing magic claims**, not code deletion. Advanced retrieval code can exist under the hood, but we do not over-promise its autonomy to users.

## Shipped Advanced Retrieval (Under-the-hood)

The following advanced retrieval techniques are active in the codebase to improve baseline retrieval quality. They are allowed, provided we do not make unbounded autonomous "magic" claims to buyers about these capabilities:

| Pattern | Guardrail |
| --- | --- |
| Graph-RAG over the provenance graph | Code exists (e.g., `GraphRagNeighborExpander`) and is active. Do not claim it acts as an autonomous agent. |
| Single-pass query expansion (HyDE, query rewrite, semantic rerank) | Code exists (e.g., `AgenticRetrievalQueryExpander`) and is active. **One** LLM completion per transform — not iterative retrieve-critique-retry. Do not claim autonomous multi-hop agentic retrieval. |

## Allowed V1 Magic

These patterns are appropriate for V1 because they reuse finalized architecture package artifacts, deterministic state, or existing bounded Ask/explanation surfaces:

| Pattern | Guardrail |
| --- | --- |
| Sponsor-mode explanations | Use committed manifest, findings, explanation summaries, evidence labels, ROI basis labels, and deferred-scope labels only. |
| Guided review Q&A starters | Ask curated questions over a selected finalized architecture package; show evidence/caveat labels when available. |
| Deterministic next actions | Recommend send sponsor packet, run compare, open evidence chain, collect proof, or run governance dry-run based on existing state. |
| Demo workspace polish | Keep the path fast and compelling while labeling all demo-derived outcomes as illustrative. |
| Evidence-chain reveal | Show evidence -> finding -> manifest -> artifact -> audit links without implying legal attestation. |

## Out Of V1 Magic

Do not pull these into V1 without a scope update:

| Future pattern | Boundary |
| --- | --- |
| Open-ended autonomous planning | V1 agents are orchestrated and bounded; they do not self-direct broad implementation plans. |
| MCP tool membrane | V1.1 candidate; not required for V1 pilot value. |
| Live third-party tool orchestration | V1.1+ connector work; V1 handoff remains REST, CLI, architect workspace, SCIM, and GitHub/Azure DevOps attachment patterns. |
| Unsourced ROI or compliance claims | Never acceptable. ROI and assurance language must carry evidence, estimate, or deferred labels. |

## Copy Rule

Buyer-facing “magic” copy should pass this test:

1. Can the output point to a finalized architecture package artifact or deterministic product state?
2. Is demo-derived or estimated content labeled?
3. Does the wording avoid certification, legal attestation, or autonomous-action claims?

If any answer is no, rewrite the copy before shipping.

## Related

- [`V1_SCOPE.md`](V1_SCOPE.md)
- [`V1_DEFERRED.md`](V1_DEFERRED.md)
- [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md)
- [`CORE_PILOT.md`](../CORE_PILOT.md)
