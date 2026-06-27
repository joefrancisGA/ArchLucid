> **Scope:** Release engineering program for **offline RAG quality** — sequences existing faithfulness, retrieval IR, and floor-ratchet harnesses into one enforceable gate. Implements assessment **§17 #10 (Deeper RAG quality program)**. Not buyer-facing.

# Deeper RAG quality program

**Last reviewed:** 2026-06-27 · **Disposition:** PASS (offline golden fixtures meet committed floors).

This program answers one question for engineering and release: **are Ask/agent outputs still citing retrieved evidence and retrieving the right chunks on golden fixtures, without silent regression?** It reuses the TB-021 harness stack documented in [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) and [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md); it does not restate retrieval architecture those docs own.

## Program phases (offline, deterministic)

| Phase | Harness | What it measures | Primary artifact |
| --- | --- | --- | --- |
| **1 — Output faithfulness** | `scripts/ci/eval_agent_faithfulness.py` | Citation coverage in agent text (`sourceId` / title substring match; mirrors `RetrievalFaithfulnessEvaluator`) | `docs/quality/faithfulness-report.md`, `faithfulness-summary.json` |
| **2 — Retrieval IR** | `scripts/ci/eval_retrieval_ir.py` | Recall@5, MRR, PolicyPack ordering-sensitive NDCG@10 on golden queries | `docs/quality/retrieval-ir-report.md`, `retrieval-ir-summary.json` |
| **3 — Committed floor ratchet** | `scripts/ci/assert_faithfulness_ir_floor_ratchet.py` | Regression guard vs `tests/eval-datasets/faithfulness-ir-floors.json` | CI stderr on breach |
| **4 — Pilot-proof rollup (optional)** | `scripts/ci/report_retrieval_quality_rollup.py` | Combined IR + faithfulness disposition for first-pilot proof packets | `docs/quality/rag-quality-program-rollup.{md,json}` |

Phase B live-model faithfulness (LLM-graded golden cohort) remains on `scripts/ci/eval_agent_corpus.py --enforce-llm-faithfulness` — outside this offline program by design.

## Unified runner (new)

`scripts/ci/run_rag_quality_program.py` executes phases 1–3 (and phase 4 unless `--skip-rollup`) and writes a program summary:

- `docs/quality/rag-quality-program-summary.json`
- `docs/quality/rag-quality-program-summary.md`

Use `--enforce` for merge-blocking runs (same semantics as the underlying harness `--enforce` flags plus ratchet failure).

## Golden fixture coverage (RAG-V1-005 design half)

Output-side citation faithfulness on policy-pack and Ask-shaped scenarios lives in `tests/eval-datasets/faithfulness-golden/cases.json`:

- **Positive readiness:** policy-pack identity, AI governance, healthcare regulatory, Azure SaaS readiness rows with required `sourceId` citations.
- **Negative controls:** missing citation, wrong corpus, unsupported ROI/cost, deferred-scope compliance claims.

Retrieval-side golden queries live in `tests/eval-datasets/retrieval-golden/cases.json` with per-corpus floors (PolicyPack MRR and ordering-sensitive NDCG@10).

## Verification

```powershell
python scripts/ci/run_rag_quality_program.py
python scripts/ci/run_rag_quality_program.py --enforce
python -m pytest scripts/ci/tests/test_run_rag_quality_program.py
python -m pytest scripts/ci/tests/test_eval_agent_faithfulness.py scripts/ci/tests/test_assert_faithfulness_ir_floor_ratchet.py
```

Nightly golden-cohort workflow already runs faithfulness with `--enforce` on main; this program adds the single entry point for local RC and assessment rescoring.

## Residual (live-model / pilot half)

Offline golden fixtures do **not** prove semantic quality under a customer's deployment model or corpus drift in production. Pair this program with:

- Real-mode golden cohort when credentials are configured (`Invoke-RealLlmGoldenCohort.ps1`).
- First-pilot proof rollup attachment when RAG claims are in the sponsor packet (`collect-first-pilot-proof.ps1`).

Further RAG backlog items (graph RAG, reranker, live corpus freshness dashboards) remain in [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) — pick up via **TB-021** scheduling, not ad hoc in assessment batches.

**Cross-refs:** [`AI_EVIDENCE_APPENDIX.md`](AI_EVIDENCE_APPENDIX.md) · [`../library/RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) · [`../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) · [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
