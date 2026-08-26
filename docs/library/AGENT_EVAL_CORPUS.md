> **Scope:** Contributor-reference — Maintain authors of the synthetic **`tests/eval-corpus`** and **`eval_agent_corpus.py`** heuristic — structure, thresholds, CI posture; not ground-truth human labels from production tenants or Azure OpenAI cost accounting.

# Agent evaluation corpus (synthetic)

This document describes **`tests/eval-corpus/`** — a deliberately **small, synthetic** set of scenarios used to regress **finding-quality expectations** offline without Azure OpenAI or customer payloads.

Companion scripts:

- **`scripts/ci/eval_agent_corpus.py`** — synthetic scenarios under **`tests/eval-corpus/`** (finding recall vs recordings).
- **`scripts/ci/policy_pack_attribution_signal.py`** — offline policy-pack attribution signal over **`tests/eval-corpus/policy-pack-attribution/`** (TB-884).
- **`scripts/ci/insight_density_frontier_delta.py`** — offline frontier-baseline delta over **`tests/eval-corpus/insight-density-frontier-delta/`** (insight-density pillar instrument). Hand-authored baseline fixtures only — not evidence against any named frontier model.
- **`scripts/ci/assert_technology_consistency_corpus.py`** — manifest drift guard for **`tests/technology-consistency-corpus/`** (deterministic Technology Ledger finding-engine and artifact-prose lint regression; see that folder’s **`README.md`**).
- **`scripts/ci/eval_agent_quality.py`** — validates **`tests/eval-datasets/`** (manifest **`schemaVersion` 2**): topology/cost/compliance/critic eval JSON **must** include per-case **`architecturalContext`**, **`expect.requiredCategories`**, and **`expect.forbiddenCategories`**. Prompt-injection fixtures declare **`expectedBlockedAt`** as **`precheck`**, **`redactor`**, **`evaluator`**, or **`judge`**, **or** honest residual **`expectedContained: true`** with **`containmentNotes`** (TB-951 indirect doc/repo shapes that phrase precheck may miss). CI passes **`--strict`** on PR and nightly workflows so schema drift fails the build.

Release-candidate automation:

- **`.github/workflows/agent-eval-corpus-rc.yml`** — runs on **`workflow_dispatch`**, tags **`v*-rc*`**, and branches **`release/**`**; asserts committed **`tests/eval-corpus/agent-results/*.real.json`** exemplars (four original agent families **plus six expanded topology/cost/compliance slices**) and **`scripts/ci/run_eval_agent_corpus_rc.sh`** (strict recall + simulator/real quality-gate enforcement + required real-mode evidence paths); uploads Markdown artifact **`eval-corpus-rc`**.
- **`.github/workflows/golden-cohort-expanded-nightly.yml`** — weekly job that scores **all** real-mode rows by pinning every **`ARCHLUCID_EVAL_CORPUS_REAL_MODE_*`** env var to repo exemplars and running **`--enforce-quality-gate`** / **`--enforce-real-quality-gate`** (informational recall remains off unless you add **`--enforce`** manually), then **`scripts/ci/assert_hallucination_resistance.py`** (TB-257) which reuses **`eval_agent_corpus.py`** scoring and **fails** when any adversarial simulator row’s **`gate_outcome`** is **`accepted`**.
- **`.github/workflows/real-mode-eval-nightly.yml`** (**TB-683**) — **daily** job (05:30 UTC) when repo variable **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true`**: scores all 18 committed **`*.real.json`** exemplars with quality-gate + Phase B faithfulness floors, writes **`artifacts/real-mode-eval-nightly/{date}/trend.json`** + **`trend.md`** (`--json-report` / `--markdown-report`), uploads a CI artifact, caches the prior night for **`assert_golden_cohort_canary_drift_alert.py`** (**TB-2231**) consecutive-drift failure. Skips cleanly with a documented message when the variable is unset. **Honesty:** this is **offline exemplar scoring**, not a live model tripwire — see [`LIVE_VS_NIGHTLY_FINDING_QUALITY_TRIPWIRE_MAP.md`](LIVE_VS_NIGHTLY_FINDING_QUALITY_TRIPWIRE_MAP.md) (**TB-1506** Done).

---

## Structure

| Artifact | Meaning |
|---------|---------|
| **`manifest.json`** | Ordered list of **`*.scenario.json`** files to evaluate |
| **`scenario-*.json`** | Expected / unexpected probes + pointer to **`recordings/*`** JSON; optional **`qualityEvidence`** for offline **AgentResult** scoring |
| **`recordings/*.findings.json`** | Authoritative simplified “finding list” (category, severity, title + detail text) |
| **`agent-results/*.simulator.json`** | Optional offline **AgentResult** JSON for structural / semantic / gate metrics (PR-safe, no AOAI) |
| **`agent-structural-eval-pairs.json`** | Canonical **simulator↔real** pair per agent family (**Topology**, **Cost**, **Compliance**, **Critic**); guarded by **`assert_agent_structural_eval_pairs.py`** (**TB-2225**) |
| **`qualityEvidence.mode: "real"`** | Offline scoring of **AgentResult** JSON from a path named by **`qualityEvidence.agentResultPathEnv`** — PR CI leaves vars unset (rows skip); RC pins vars to **synthetic** committed **`agent-results/*.real.json`** exemplars |

Scenarios deliberately avoid shipping full **`ArchitectureRequest`** bodies: only **`inputSummary`** text is retained for readability. Extend with additional fields when simulator exports stabilize.

### V1 customer-like brief slice (2026-05)

Five additional scenarios (Azure web app, regulated data workflow, cost-constrained modernization, governance-heavy review, B2B API platform) live under the same **`manifest.json`** entries and include:

- **`qualityEvidence.mode: "simulator"`** — committed **`agent-results/*.simulator.json`** files shaped like Web-serialized **`AgentResult`** (no Azure OpenAI).
- **`qualityEvidence.agentType`** — short label for the report (Topology / Cost / Compliance / Critic); not used for scoring keys today.
- **`qualityEvidence.agentResultPath`** — repo-relative path under **`tests/eval-corpus/`**.

**Adversarial probes (2026-05):** three scenarios strengthen regression coverage for common agent failure modes without live models:

- **`scenario-hallucinated-service.json`** — fabricated components absent from manifests/inventory (`recordings/corpus-hallucinated-service.findings.json`, **`agent-results/corpus-hallucinated-service.simulator.json`**).
- **`scenario-citation-forgery.json`** — non-resolving ADR/repo citations and checksum expectations (`recordings/corpus-citation-forgery.findings.json`, **`agent-results/corpus-citation-forgery.simulator.json`**).
- **`scenario-contradictory-manifest.json`** — manifest vs diagram vs encryption-story contradictions (`recordings/corpus-contradictory-manifest.findings.json`, **`agent-results/corpus-contradictory-manifest.simulator.json`**).

Each follows the authoring checklist (â‰¥3 expected probes, â‰¥2 unexpected probes, committed simulator **AgentResult** JSON).

**Real Azure OpenAI** traces are **not** committed as prompts. Two complementary paths:

1. **HTTP / tenant evidence:** After **`POST …/execute`**, call **`GET /v1/architecture/review/{runId}/agent-evaluation`** and archive exports outside the repo (or consume metrics backends). Name the **reference deployment** alongside **`AGENT_OUTPUT_EVALUATION.md`** quality-gate floors.
2. **Corpus hook (deterministic scorer on AgentResult JSON):** Ten scenarios commit **`qualityEvidence.mode: "real"`** with distinct env vars — the original quartet (**`scenario-real-mode-smoke`**, **`scenario-real-mode-cost`**, **`scenario-real-mode-compliance`**, **`scenario-real-mode-critic`**) plus **`scenario-real-mode-three-tier`** (`ARCHLUCID_EVAL_CORPUS_REAL_MODE_THREE_TIER_AGENT_RESULT`), **`scenario-real-mode-microservices`** (`ARCHLUCID_EVAL_CORPUS_REAL_MODE_MICROSERVICES_AGENT_RESULT`), **`scenario-real-mode-database-backup`** (`ARCHLUCID_EVAL_CORPUS_REAL_MODE_DATABASE_BACKUP_AGENT_RESULT`), **`scenario-real-mode-overprovisioned-vm`** (`ARCHLUCID_EVAL_CORPUS_REAL_MODE_OVERPROVISIONED_VM_AGENT_RESULT`), **`scenario-real-mode-multi-region`** (`ARCHLUCID_EVAL_CORPUS_REAL_MODE_MULTI_REGION_AGENT_RESULT`), **`scenario-real-mode-azure-web-app`** (`ARCHLUCID_EVAL_CORPUS_REAL_MODE_AZURE_WEB_APP_AGENT_RESULT`). RC automation sets each to the matching **`tests/eval-corpus/agent-results/*.real.json`** (synthetic Web-serialized shape). Locally, point any var at **`ParsedResultJson`** from a trusted run when comparing simulator fixtures to a live export; omit all vars in PR CI so rows skip without failing.

### Markdown report (structural, semantic, gate)

```bash
python scripts/ci/eval_agent_corpus.py --markdown-report ./out/agent-corpus-report.md
```

Produces tables for: findings **recall**, optional **simulator vs real-mode** rollup (`real_mode_quality` line on stdout mirrors the Markdown counters), **structural completeness**, **semantic** score, **parse failure**, **quality gate** outcome on scored rows (defaults match shipped **`ArchLucid:AgentOutput:QualityGate`**), and the same **explanation-trace proxy** as **`AgentOutputSemanticEvaluator`**.
CI appends the same report to the GitHub Actions job summary (no secrets).

**Enforcement knobs:**

| Flag | Use |
|------|-----|
| `--enforce` | Non-zero exit when expected-rule **recall** is below **`--min-recall`** or **unexpected** probes fire. |
| `--enforce-quality-gate` | Non-zero exit when any **simulator** row is **rejected** by the default gate. Does not apply to real-mode rows (use **`--enforce-real-quality-gate`**). |
| `--enforce-real-quality-gate` | Non-zero exit when any **evaluated** real-mode row is **rejected** by the default gate (skipped rows when env is unset do not trigger). Owner-approved RC strictness. |
| `--require-real-mode-evidence` | Non-zero exit when the manifest includes **`qualityEvidence.mode: "real"`** rows but **none** evaluate (env unset / empty path). Use in RC jobs that must attach exported **AgentResult** JSON; omit in PR CI. |

**Release-candidate wrapper (strict + real evidence):** `scripts/ci/run_eval_agent_corpus_rc.sh` — same as  
`--enforce --min-recall 0.75 --enforce-quality-gate --enforce-real-quality-gate --require-real-mode-evidence` plus optional env overrides (see script header).

Synth briefs are **not** legal, compliance, or customer truth: do not assert regulatory correctness from model output.

---

## Metrics (V1 heuristic)

For each **`expectedFindings`** rule the script succeeds when **some** recording row matches **category**, meets **minimumSeverity**, and contains **every** substring listed in **`evidenceMustContain`** (case-insensitive, title + detail text).

For each **`unexpectedFindings`** rule the script emits a warning/failure when **any** row in the nominated category exposes **any** forbidden substring (**`ifContainsAny`**).

Reported **`recall`** = **hits Ã· rules** per scenario — not classical IR recall.

**Precision analogue:** count **`unexpected`** triggers (`0` is healthy). Formal precision against live LLMs is deferred until automated runs land.

---

## CI posture

- **Default:** informational — script exits **0** even when recalls dip (aligns with assessment “do not block CI initially”).
- **Pull requests:** `eval_agent_corpus.py` runs in **`ci.yml`** with `--markdown-report` (appended to the job summary); **no** Azure OpenAI.
- **Strict / RC:** `bash scripts/ci/run_eval_agent_corpus_rc.sh` with **all ten** **`ARCHLUCID_EVAL_CORPUS_REAL_MODE_*_AGENT_RESULT`** vars set (workflow uses repo **`*.real.json`** paths), or invoke `eval_agent_corpus.py` with `--enforce --min-recall 0.75 --enforce-quality-gate --enforce-real-quality-gate --require-real-mode-evidence` manually.

---

## Adding a scenario

1. Copy an existing **`scenario-*.json`** and **`recordings/*.findings.json`** pair.
2. Keep **â‰¥3** expected rules and **â‰¥2** unexpected rules (assessment minimum).
3. Append the filename to **`manifest.json`**.
4. (Optional) Add **`qualityEvidence`** with **`mode: "simulator"`** and **`agent-results/<case>.simulator.json`** — see the “V1 customer-like brief slice” section above.
5. (Optional **real-mode quality row**) Clone **`scenario-real-mode-smoke.json`** or any **`scenario-real-mode-*.json`**: **`mode: "real"`**, a unique **`agentResultPathEnv`** name, **`agentType`** label, **`recordings/*.findings.json`**, substring probes. RC may commit **synthetic** **`agent-results/*.real.json`** exemplars (same shape as Web **`AgentResult`**); do **not** commit customer or production AOAI prompts/responses. When curating exemplars for **Graph-RAG live ablation (TB-883)**, optionally attach a top-level **`retrievalHits`** array (`chunkId`, `sourceType`, `corpusKind`, `score`, plus optional `sourceId`/`title`) mirroring runtime **`RetrievalHit`** rows — including at least one **`KnowledgeGraphNodeNeighbor`** hit when Graph-RAG was enabled during capture.
6. Run `python scripts/ci/eval_agent_corpus.py` locally before pushing; use `--markdown-report` for the RC artifact.

---

## Technology consistency golden corpus

**`tests/technology-consistency-corpus/`** is a **separate** fixture tree from **`tests/eval-corpus/`**:

| Corpus | Asserts | CI entry |
|--------|---------|----------|
| **`tests/eval-corpus/`** | Agent finding recall / quality evidence on **AgentResult** JSON | **`eval_agent_corpus.py`** |
| **`tests/technology-consistency-corpus/`** | Deterministic **`TechnologyConsistencyFindingEngine`** titles and **`TechnologyLedgerArtifactLinter`** rule ids on committed ledger snapshots + prose | **`TechnologyConsistencyGoldenCorpus`** / **`TechnologyConsistencyArtifactGoldenCorpus`** dotnet filters + **`assert_technology_consistency_corpus.py`** |

Authoring checklist and local commands: **`tests/technology-consistency-corpus/README.md`**.

---

## Frontier-baseline delta (insight density)

| Artifact | Meaning |
|---------|---------|
| **`tests/eval-corpus/insight-density-frontier-delta/*.json`** | Hand-authored ArchLucid findings plus a neutral baseline transcript label |
| **`docs/quality/insight-density-frontier-delta.json`** | Committed rollup from **`scripts/ci/insight_density_frontier_delta.py`** |
| **`docs/quality/insight-density-frontier-delta.md`** | Human-readable mirror of the JSON rollup |

**Honest limitation:** baseline rows in this corpus are **fixture-authored**, not captured frontier-model output. The harness measures whether novelty math is stable and whether ArchLucid findings are covered by that baseline — it does **not** prove ArchLucid beats any named model.

### Per-engine distribution (advisory)

| Artifact | Meaning |
|---------|---------|
| **`docs/quality/insight-density-engine-distribution.md`** | Per-engine min/median/max scores from the six-engine golden corpus |

**claimBoundary:** Advisory-only — `DeterministicInsightDensityGate` never demotes typed-engine findings (`typed-engine-protected`). The table covers six harness engines; thirty-three built-in engines are absent. `WouldDemoteIfUnprotectedCount` is a counterfactual, not production demotion behavior.

Local commands:

```bash
python scripts/ci/insight_density_frontier_delta.py --enforce --check
python -m unittest discover -s scripts/ci/tests -p "test_insight_density_frontier_delta.py"
```

---

## Related documents

- **`docs/library/AI_AGENT_PROMPT_REGRESSION.md`** — prompt change discipline
- **`scripts/ci/eval_agent_quality.py`** — broader offline dataset validation (distinct manifest)
