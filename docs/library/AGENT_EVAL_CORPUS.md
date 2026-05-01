> **Scope:** Maintain authors of the synthetic **`tests/eval-corpus`** and **`eval_agent_corpus.py`** heuristic — structure, thresholds, CI posture; not ground-truth human labels from production tenants or Azure OpenAI cost accounting.

# Agent evaluation corpus (synthetic)

This document describes **`tests/eval-corpus/`** — a deliberately **small, synthetic** set of scenarios used to regress **finding-quality expectations** offline without Azure OpenAI or customer payloads.

Companion script: **`scripts/ci/eval_agent_corpus.py`**.

---

## Structure

| Artifact | Meaning |
|---------|---------|
| **`manifest.json`** | Ordered list of **`*.scenario.json`** files to evaluate |
| **`scenario-*.json`** | Expected / unexpected probes + pointer to **`recordings/*`** JSON; optional **`qualityEvidence`** for offline **AgentResult** scoring |
| **`recordings/*.findings.json`** | Authoritative simplified “finding list” (category, severity, title + detail text) |
| **`agent-results/*.simulator.json`** | Optional offline **AgentResult** JSON for structural / semantic / gate metrics (PR-safe, no AOAI) |

Scenarios deliberately avoid shipping full **`ArchitectureRequest`** bodies: only **`inputSummary`** text is retained for readability. Extend with additional fields when simulator exports stabilize.

### V1 customer-like brief slice (2026-05)

Five additional scenarios (Azure web app, regulated data workflow, cost-constrained modernization, governance-heavy review, B2B API platform) live under the same **`manifest.json`** entries and include:

- **`qualityEvidence.mode: "simulator"`** — committed **`agent-results/*.simulator.json`** files shaped like Web-serialized **`AgentResult`** (no Azure OpenAI).
- **`qualityEvidence.agentType`** — short label for the report (Topology / Cost / Compliance / Critic); not used for scoring keys today.
- **`qualityEvidence.agentResultPath`** — repo-relative path under **`tests/eval-corpus/`**.

**Real Azure OpenAI** evidence is **not** committed. For manual real-mode checks after **`POST …/execute`**, call **`GET /v1/architecture/run/{runId}/agent-evaluation`** and archive outputs outside the repo (or use your metrics backend). Name the **reference deployment** in release documentation alongside **`AGENT_OUTPUT_EVALUATION.md`** quality-gate floors.

### Markdown report (structural, semantic, gate)

```bash
python scripts/ci/eval_agent_corpus.py --markdown-report ./out/agent-corpus-report.md
```

Produces tables for: findings **recall**, **structural completeness**, **semantic** score, **parse failure**, **quality gate** outcome (defaults match shipped **`ArchLucid:AgentOutput:QualityGate`**), and deterministic **explanation-trace proxy** (claims-with-evidence + finding field completeness — same signals as **`AgentOutputSemanticEvaluator`**).

CI appends the same report to the GitHub Actions job summary (no secrets).

**Enforcement knobs:**

| Flag | Use |
|------|-----|
| `--enforce` | Non-zero exit when expected-rule **recall** is below **`--min-recall`** or **unexpected** probes fire. |
| `--enforce-quality-gate` | Non-zero exit when any **simulator** row is **rejected** by the default gate (for release automation). |

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
- **Strict:** `python scripts/ci/eval_agent_corpus.py --enforce --min-recall 0.75` for release branches; add `--enforce-quality-gate` when simulator JSON must clear rejection floors before tagging an RC.

---

## Adding a scenario

1. Copy an existing **`scenario-*.json`** and **`recordings/*.findings.json`** pair.
2. Keep **≥3** expected rules and **≥2** unexpected rules (assessment minimum).
3. Append the filename to **`manifest.json`**.
4. (Optional) Add **`qualityEvidence`** with **`mode: "simulator"`** and **`agent-results/<case>.simulator.json`** — see the “V1 customer-like brief slice” section above.
5. Run `python scripts/ci/eval_agent_corpus.py` locally before pushing; use `--markdown-report` for the RC artifact.

---

## Related documents

- **`docs/library/AI_AGENT_PROMPT_REGRESSION.md`** — prompt change discipline
- **`scripts/ci/eval_agent_quality.py`** — broader offline dataset validation (distinct manifest)
