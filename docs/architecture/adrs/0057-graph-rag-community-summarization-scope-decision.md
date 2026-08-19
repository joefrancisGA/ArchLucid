> **Scope:** ADR 0057 — Graph-RAG community summarization (`RAG-V2-001` remainder) scope decision — options record, not an implementation.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0057: Graph-RAG community summarization scope decision

- **Status:** Accepted (options record); **recommendation superseded by owner-override addendum below, 2026-07-05**
- **Date:** 2026-07-05
- **Supersedes:** *(none)*
- **Superseded by:** *(none — amended in place by this ADR's own Addendum section, not a separate ADR)*
- **Amends:** [ADR 0036](0036-graph-rag-embedding-strategy.md) (records the community-summarization scope call that ADR 0036's original "Rejected alternatives" table left implicit, and reconciles it against **TB-597**'s later bounded-multi-hop decision)

## Context

`V1_DEFERRED.md` §6q lists **RAG-V2-001** (Graph-RAG over the knowledge/provenance graph) with community summarization named as a V1.1/V2 remainder, but — unlike the bounded-multi-hop depth question, which **TB-597** (2026-07-03) resolved with an explicit owner decision recorded in `TECH_BACKLOG.md`, `V1_SCOPE.md` §2.20, and `V1_DEFERRED.md` §6q — no options record exists comparing implement-now vs. defer vs. ablation-spike-first specifically for community summarization. ADR 0036 (2026-05-26, still **Proposed**) rejected "Microsoft GraphRAG community summarization" at proposal time on cost grounds, but that rejection predates TB-597's later decision to pull bounded multi-hop *into* V1, and was never revisited once that happened.

Two facts constrain any option here:

1. **`GraphRagProductionLikeConfigurationLint`** (`ArchLucid.Core/Hosting/GraphRagProductionLikeConfigurationLint.cs`) fires an advisory — not a hard gate — when `Retrieval:Advanced:EnableGraphRag` is `true` but Azure AI Search vector posture is not configured, with message text *"Graph-RAG neighbor expansion quality is unproven without a production vector index."* This is a **hosting-configuration** advisory (in-memory vector index vs. Azure AI Search), not a statement that Graph-RAG has never been quality-tested at all — **TB-595**'s offline ablation (`retrieval_ablation_profiles.py`, `ablation-attribution.v1.json`) already isolates bounded multi-hop's contribution on golden fixtures. A community-summarization layer sitting on the same `GraphSnapshot`/`AzureAiSearchVectorIndex` plumbing would inherit the identical advisory the day it ships, for the identical reason (no live tenant is yet confirmed running Azure AI Search in production).
2. Graphs are **per-project, bounded** (`FullGraphResponseMaxNodes` default 500 — `docs/library/KNOWLEDGE_GRAPH.md`), so community-detection compute itself (Leiden/Louvain over ≤500 nodes) is cheap; the cost driver is **hierarchical LLM summarization per detected community per run**, which is a new, recurring Azure OpenAI spend surface, not a one-time indexing cost.

## Decision

This ADR does **not** authorize implementation. It records three options, evaluated against the same cost/risk/impact axes ADR 0056 and TB-597 used, with an explicit recommendation for **today** that is revisitable the moment G-REAL-06 (first real-mode pilots) produces buyer signal.

### Option (a) — Implement community detection + hierarchical summarization now, pull into V1

Add a community-detection pass (Leiden or Louvain) over the existing `GraphSnapshot` provenance graph, then one hierarchical LLM summarization call per detected community, cached and re-embedded on the same ADR 0004 outbox refresh cadence as node embeddings.

- **Cost:** New indexing sub-pipeline (community detection + summarization job) touching `GraphSnapshotCanonicalFingerprint` invalidation rules; incremental Azure OpenAI summarization spend **per community per graph refresh**, scaling with tenant run volume, not just node count; new cache-invalidation surface when the graph changes between runs (a stale community summary is a *silent* correctness risk — it would look confident and be wrong).
- **Risk:** Inherits `GraphRagProductionLikeConfigurationLint`'s "unproven without a production vector index" advisory immediately (same underlying posture gap as bounded multi-hop), *plus* a second, harder-to-ablate quality question — TB-595's methodology ablates a retrieval flag that is either on or off for an *existing* query; community summarization changes *what is indexed*, so isolating its quality contribution requires a live-model ablation (re-embedding, re-summarizing, then re-querying), not a fixture-level toggle.
- **Expected impact:** Best case, materially deepens Graph-RAG's differentiability claim (§13 of `docs/assessments/LATEST_GPT55.md`) by surfacing cross-node thematic context bounded multi-hop cannot reach in 1–2 hops. Worst case, ships a second unproven-quality retrieval layer before the first (bounded multi-hop) has any live-buyer signal, compounding the exact risk §16's Stop Doing List already flags: "community-summarization Graph-RAG *implementation* before pilot feedback."

### Option (b) — Keep deferred to V1.1/V2, unchanged (status quo)

No engineering change. `V1_DEFERRED.md` §6q and `V1_SCOPE.md` §2.20 continue to state community summarization as out of V1 scope, with the "unproven without a production vector index" caveat carried on the shipped bounded-multi-hop feature only.

- **Cost:** Zero engineering cost. Opportunity cost only: if a technical evaluator in a live pilot specifically probes for community-level (not just 1–2-hop) Graph-RAG context and treats its absence as a dismissal trigger, ArchLucid has no counter beyond "bounded multi-hop ships today, community summarization is roadmapped."
- **Risk:** Lowest risk of the three — no new unproven-quality surface, no new recurring Azure OpenAI spend, no new cache-invalidation correctness surface.
- **Expected impact:** No change to any §2/§7 score in the current assessment. Preserves engineering capacity for G-REAL-06-blocking work (§17 Tier 1).

### Option (c) — Ablation-only spike before full implementation

Build a minimal, non-production community-detection + summarization prototype (behind a flag never exposed to buyers) solely to measure whether community-level context changes finding quality on the existing golden-cohort corpus (mirroring TB-595's ablation methodology), before committing to option (a)'s full implementation.

- **Cost:** Materially less than option (a) — no production cache-invalidation design, no buyer-facing config surface, no `GraphRagProductionLikeConfigurationLint` exposure (the spike would run offline against golden fixtures, not live tenant graphs) — but **not free**, because unlike TB-595's existing ablations (which toggle an already-shipped flag), community summarization does not exist yet; a spike must still build a throwaway detection + summarization pass to have anything to ablate. Rough sizing: comparable to TB-595's original ablation-harness build (M), not to a one-line config toggle.
- **Risk:** Spike code must be clearly marked non-production and excluded from `GraphRagProductionLikeConfigurationLint`/production-posture surfaces to avoid the false signal of "community summarization is production-ready" leaking into buyer-facing docs before it is.
- **Expected impact:** Produces a measured "does community summarization move faithfulness/finding-quality on the golden cohort" number — closing the "offline fixtures, not live-model" gap named in §7 Decision-Changing Insight Density for this specific question — without the ongoing cost/risk surface of option (a). Result would directly inform whether option (a) is worth pursuing later.

### Recommendation

**Option (b): keep deferred, unchanged, for now.** Rationale: zero completed real-mode pilots exist as of this ADR's date (`docs/assessments/LATEST_GPT55.md` §3), so there is no buyer evidence that community-level graph context is a purchase-relevant gap rather than a hypothetical one — the same validation-first reasoning `TB-598` used to defer the iterative retrieve-critique-retry loop pending G-REAL-06 signal. Option (c) is the pre-authorized next step **specifically if** a G-REAL-06 pilot surfaces a technical evaluator asking about graph depth beyond bounded multi-hop; option (a) requires that plus a positive option (c) ablation result before it is worth the recurring-cost and cache-invalidation-correctness surface it adds. This recommendation is advisory only — per the Tier 3 classification this ADR originates from, actual scope pull-forward requires a separate, explicit owner decision (mirroring how TB-597 was decided), and this ADR does not itself schedule that follow-up TB row.

## Trade-offs

Choosing option (b) trades a theoretical differentiability ceiling (deeper graph context than 1–2 hops) for zero incremental engineering cost, zero new unproven-quality surface, and preserved capacity for G-REAL-06-blocking work — the dominant weighted deficiency in the current assessment (§3, §8 weakness #1). Choosing option (a) instead would trade that preserved capacity, plus a new recurring Azure OpenAI summarization spend and a new silent-staleness correctness risk (stale community summaries surviving a graph change), for a differentiability claim that has zero buyer validation behind it today. Option (c) trades a smaller, bounded engineering cost (comparable to TB-595's original harness build) for a measured answer to whether option (a)'s trade-off would even be worth making.

## Constraints

- **Azure-native posture (owner default):** any future community-summarization implementation must reuse `AzureOpenAiEmbeddingService`/`AzureAiSearchVectorIndex` per ADR 0036 — no new vector/graph subprocessor.
- **Cost gate:** any live summarization spend must route through the existing `LlmMonthlyTenantDollarBudgetTracker` per-tenant ceiling (same as ADR 0036 item 8).
- **Validation-first ordering:** per `docs/assessments/LATEST_GPT55.md` §16 Stop Doing List, full implementation before pilot feedback is explicitly out of scope until this ADR's recommendation is revisited.
- **Fingerprint stability:** any indexed community-summary artifact must follow ADR 0036's norm of exclusion from `GraphSnapshotCanonicalFingerprint` (summaries are derived, not canonical graph content) to avoid unrelated fingerprint churn on every re-summarization.
- **No production posture claim ahead of evidence:** if option (c) is picked up, its spike must not be surfaced through `GraphRagProductionLikeConfigurationLint`, `GraphRagQualityPosture`, or any buyer-facing doc as a shipped capability.

## Expected impact

- **System:** No code change from this ADR alone. If option (c) or (a) is later picked up, the affected qualities are AI/Agent Readiness (§7) and Differentiability/Defensibility (§13) — see each option's Expected impact above.
- **Security:** No change under option (b). Options (a)/(c) would need the same tenant-scoping and redaction posture already applied to node embeddings (ADR 0036) and fine-tuning export (ADR 0056) if picked up later.
- **Operations:** No change under option (b) — the `GraphRagProductionLikeConfigurationLint` advisory continues to apply only to the shipped bounded-multi-hop feature as it does today.
- **Cost:** Zero incremental cost under option (b), the recommended path. Option (a) adds a recurring, run-volume-scaled Azure OpenAI summarization cost; option (c) adds a bounded, one-time engineering cost with no recurring spend (offline spike only).
- **Teams:** No new ownership surface under option (b). This ADR's recommendation and its trigger condition (G-REAL-06 pilot signal specifically about graph depth) are the artifact future owners should consult before re-opening this question, avoiding re-litigating the same trade-offs from scratch.

## Consequences

- **Positive:** `V1_DEFERRED.md` §6q's RAG-V2-001 remainder now has an explicit, evidence-based options record instead of an implicit "someday" deferral — closing the doc-drift gap this ADR was commissioned to fix.
- **Negative:** The underlying question (does community-level graph context matter to buyers) remains unanswered until G-REAL-06 produces pilot signal; this ADR is a decision-quality improvement, not a product-capability improvement.
- **Follow-ups:** If a G-REAL-06 pilot surfaces a technical evaluator specifically probing graph depth beyond bounded multi-hop, revisit this ADR and consider option (c) first; do not jump directly to option (a) without a positive option (c) result. Authoring the TB row for whichever option the owner picks is explicitly out of scope for this ADR (mirrors how TB-597's follow-up was scoped separately).

## Addendum — owner override (2026-07-05)

The owner reviewed this ADR's recommendation (option (b), keep deferred) during a V1.1/V2 backlog promotion pass and **explicitly overrode it in favor of option (a)** — implement community detection + hierarchical summarization now, ahead of G-REAL-06 pilot signal. This addendum records the override; it does not retroactively change the recommendation's reasoning above, which remains valid analysis of the trade-off the owner chose to accept.

**What this means for implementation:**

- Option (a)'s full scope (§ "Option (a)" above) is now authorized: community-detection pass (Leiden or Louvain) over the existing `GraphSnapshot`, one hierarchical LLM summarization call per detected community, cached and re-embedded on the ADR 0004 outbox refresh cadence.
- All constraints in the **Constraints** section above remain binding: Azure-native embedding/vector reuse, `LlmMonthlyTenantDollarBudgetTracker` cost gate, exclusion of derived summaries from `GraphSnapshotCanonicalFingerprint`, and no production-posture claim in buyer-facing docs ahead of the same live-model validation bar bounded multi-hop cleared.
- The risk this ADR flagged — shipping a second unproven-quality retrieval layer before the first has live-buyer signal — is now an **accepted, owner-directed risk**, not an oversight. Assessments should reflect that community summarization is **in-flight V1 engineering**, not a hypothetical roadmap item, but should still flag its live-model quality as unproven until an ablation equivalent to TB-595's methodology exists for this feature specifically.
- Assign a new TB number at implementation start and cross-link it here and in `V1_DEFERRED.md` §6q.

**Status update:** This ADR's own **Status** field is left as **Accepted** (the options record itself remains valid); the **recommendation** is superseded by this addendum, not the ADR's analysis.

## Related

- [ADR 0036](0036-graph-rag-embedding-strategy.md) — Graph-RAG embedding strategy (original community-summarization rejection, predates TB-597)
- [ADR 0056](0056-manifest-online-fine-tuning-governance.md) — sibling RAG-V2 decision-record pattern (phased, cost-gated, opt-in)
- `docs/library/V1_DEFERRED.md` §6q — RAG-V2-001 row (cross-referenced to this ADR)
- `docs/library/V1_SCOPE.md` §2.20 — Advanced RAG scope
- `docs/library/TECH_BACKLOG.md` **TB-595** (ablation methodology to reuse for option (c)), **TB-596** (Graph-RAG production posture), **TB-597** (sibling bounded-multi-hop depth decision)
- `docs/assessments/LATEST_GPT55.md` §16 (Stop Doing List), §17 Tier 3 (this ADR's originating candidate)
