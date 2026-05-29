> **Scope:** Product and engineering guidance for bounded V1 AI affordances. This is not a roadmap expansion and does not promote V1.1/V2 items into V1.

# V1 Magic Guardrails

ArchLucid should feel impressive in V1, but the magic must come from **grounded experience design**, not unsupported autonomy.

## Allowed V1 Magic

These patterns are appropriate for V1 because they reuse committed review artifacts, deterministic state, or existing bounded Ask/explanation surfaces:

| Pattern | Guardrail |
| --- | --- |
| Sponsor-mode explanations | Use committed manifest, findings, explanation summaries, evidence labels, ROI basis labels, and deferred-scope labels only. |
| Guided review Q&A starters | Ask curated questions over a selected committed review; show evidence/caveat labels when available. |
| Deterministic next actions | Recommend send sponsor packet, run compare, open evidence chain, collect proof, or run governance dry-run based on existing state. |
| Demo workspace polish | Keep the path fast and compelling while labeling all demo-derived outcomes as illustrative. |
| Evidence-chain reveal | Show evidence -> finding -> manifest -> artifact -> audit links without implying legal attestation. |

## Out Of V1 Magic

Do not pull these into V1 without a scope update:

| Future pattern | Boundary |
| --- | --- |
| Open-ended autonomous planning | V1 agents are orchestrated and bounded; they do not self-direct broad implementation plans. |
| Graph-RAG over the provenance graph | V2 candidate after V1 retrieval quality proves insufficient. |
| Agentic retrieval such as HyDE, query rewrite, or multi-hop retrieval | V2 candidate unless explicitly promoted. |
| MCP tool membrane | V1.1 candidate; not required for V1 pilot value. |
| Live third-party tool orchestration | V1.1+ connector work; V1 handoff remains REST, CLI, operator UI, SCIM, and GitHub/Azure DevOps attachment patterns. |
| Unsourced ROI or compliance claims | Never acceptable. ROI and assurance language must carry evidence, estimate, or deferred labels. |

## Copy Rule

Buyer-facing “magic” copy should pass this test:

1. Can the output point to a committed review artifact or deterministic product state?
2. Is demo-derived or estimated content labeled?
3. Does the wording avoid certification, legal attestation, or autonomous-action claims?

If any answer is no, rewrite the copy before shipping.

## Related

- [`V1_SCOPE.md`](V1_SCOPE.md)
- [`V1_DEFERRED.md`](V1_DEFERRED.md)
- [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md)
- [`CORE_PILOT.md`](../CORE_PILOT.md)
