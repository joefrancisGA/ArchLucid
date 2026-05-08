> **Scope:** Maintain authors of the synthetic **`tests/eval-corpus`** and **`eval_agent_corpus.py`** heuristic — structure, thresholds, CI posture; not ground-truth human labels from production tenants or Azure OpenAI cost accounting.

# Agent evaluation corpus (synthetic)

This document describes **`tests/eval-corpus/`** — a deliberately **small, synthetic** set of scenarios used to regress **finding-quality expectations** offline without Azure OpenAI or customer payloads.

Companion scripts:

- **`scripts/ci/eval_agent_corpus.py`** — synthetic scenarios under **`tests/eval-corpus/`** (finding recall vs recordings).
- **`scripts/ci/eval_agent_quality.py`** — validates **`tests/eval-datasets/`** (manifest **`schemaVersion` 2**): topology/cost/compliance/critic eval JSON **must** include per-case **`architecturalContext`**, **`expect.requiredCategories`**, and **`expect.forbiddenCategories`**. Prompt-injection fixtures declare **`expectedBlockedAt`** as **`precheck`**, **`redactor`**, **`evaluator`**, or **`judge`**. CI passes **`--strict`** on PR and nightly workflows so schema drift fails the build.

Release-candidate automation:

- **`.github/workflows/agent-eval-corpus-rc.yml`** — runs on **`workflow_dispatch`**, tags **`v*-rc*`**, and branches **`release/**`**; asserts a committed real-mode exemplar (**`tests/eval-corpus/agent-results/corpus-real-mode-smoke.real.json`**) and **`scripts/ci/run_eval_agent_corpus_rc.sh`** (strict recall + quality gate + required real-mode evidence path); uploads Markdown artifact **`eval-corpus-rc`**.

---

## Structure

| Artifact | Meaning |
|---------|---------|
| **`manifest.json`** | Ordered list of **`*.scenario.json`** files to evaluate |
| **`scenario-*.json`** | Expected / unexpected probes + pointer to **`recordings/*`** JSON; optional **`qualityEvidence`** for offline **AgentResult** scoring |
| **`recordings/*.findings.json`** | Authoritative simplified “finding list” (category, severity, title + detail text) |
| **`agent-results/*.simulator.json`** | Optional offline **AgentResult** JSON for structural / semantic / gate metrics (PR-safe, no AOAI) |
| **`qualityEvidence.mode: "real"`** | Optional offline scoring of **exported** **AgentResult** JSON from a local path named by **`qualityEvidence.agentResultPathEnv`** (no committed blobs; unset env in PR CI) |

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

Each follows the authoring checklist (≥3 expected probes, ≥2 unexpected probes, committed simulator **AgentResult** JSON).

**Real Azure OpenAI** traces are **not** committed as prompts. Two complementary paths:

1. **HTTP / tenant evidence:** After **`POST …/execute`**, call **`GET /v1/architecture/run/{runId}/agent-evaluation`** and archive exports outside the repo (or consume metrics backends). Name the **reference deployment** alongside **`AGENT_OUTPUT_EVALUATION.md`** quality-gate floors.
2. **Corpus hook (deterministic scorer on exported JSON):** **`scenario-real-mode-smoke`** sets **`qualityEvidence.mode: "real"`** and **`agentResultPathEnv`: `ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT`**. Paste or save **`ParsedResultJson`** (**Web-serialized `AgentResult`**) from a trusted run into a temp file and point the env var at that absolute path **only** when you want the corpus report to distinguish **simulator fixture quality** from **one reference-model JSON snapshot**. Omit the variable everywhere default PR gates must stay AOAI-free.

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
| `--enforce-quality-gate` | Non-zero exit when any **simulator** row is **rejected** by the default gate (for release automation). Real-mode rows are **never** gated by this flag. |
| `--require-real-mode-evidence` | Non-zero exit when the manifest includes **`qualityEvidence.mode: "real"`** rows but **none** evaluate (env unset / empty path). Use in RC jobs that must attach exported **AgentResult** JSON; omit in PR CI. |

**Release-candidate wrapper (strict + real evidence):** `scripts/ci/run_eval_agent_corpus_rc.sh` — same as  
`--enforce --min-recall 0.75 --enforce-quality-gate --require-real-mode-evidence` plus optional env overrides (see script header).

Synth briefs are **not** legal, compliance, or customer truth: do not assert regulatory correctness from model output.

---

## Metrics (V1 heuristic)

For each **`expectedFindings`** rule the script succeeds when **some** recording row matches **category**, meets **minimumSeverity**, and contains **every** substring listed in **`evidenceMustContain`** (case-insensitive, title + detail text).

For each **`unexpectedFindings`** rule the script emits a warning/failure when **any** row in the nominated category exposes **any** forbidden substring (**`ifContainsAny`**).

Reported **`recall`** = **hits ÷ rules** per scenario — not classical IR recall.

**Precision analogue:** count **`unexpected`** triggers (`0` is healthy). Formal precision against live LLMs is deferred until automated runs land.

---

## CI posture

- **Default:** informational — script exits **0** even when recalls dip (aligns with assessment “do not block CI initially”).
- **Pull requests:** `eval_agent_corpus.py` runs in **`ci.yml`** with `--markdown-report` (appended to the job summary); **no** Azure OpenAI.
- **Strict / RC:** `bash scripts/ci/run_eval_agent_corpus_rc.sh` after exporting **`ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT`** (absolute path to Web-serialized **AgentResult** JSON), or invoke `eval_agent_corpus.py` with `--enforce --min-recall 0.75 --enforce-quality-gate --require-real-mode-evidence` manually.

---

## Adding a scenario

1. Copy an existing **`scenario-*.json`** and **`recordings/*.findings.json`** pair.
2. Keep **≥3** expected rules and **≥2** unexpected rules (assessment minimum).
3. Append the filename to **`manifest.json`**.
4. (Optional) Add **`qualityEvidence`** with **`mode: "simulator"`** and **`agent-results/<case>.simulator.json`** — see the “V1 customer-like brief slice” section above.
5. (Optional **real-mode quality row**) Prefer cloning **`scenario-real-mode-smoke.json`**: **`mode: "real"`**, a unique **`agentResultPathEnv`** name, **`agentType`** label, **`recordings/*.findings.json`**, and probes that use **substring** matches (avoid brittle verbatim model quotes). Do **not** commit AOAI exports.
6. Run `python scripts/ci/eval_agent_corpus.py` locally before pushing; use `--markdown-report` for the RC artifact.

---

## Related documents

- **`docs/library/AI_AGENT_PROMPT_REGRESSION.md`** — prompt change discipline
- **`scripts/ci/eval_agent_quality.py`** — broader offline dataset validation (distinct manifest)
