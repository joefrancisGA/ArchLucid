# Agent evaluation corpus (synthetic)

This document describes **`tests/eval-corpus/`** — a deliberately **small, synthetic** set of scenarios used to regress **finding-quality expectations** offline without Azure OpenAI or customer payloads.

Companion script: **`scripts/ci/eval_agent_corpus.py`**.

---

## Structure

| Artifact | Meaning |
|---------|---------|
| **`manifest.json`** | Ordered list of **`*.scenario.json`** files to evaluate |
| **`scenario-*.json`** | Expected / unexpected probes + pointer to **`recordings/*`** JSON |
| **`recordings/*.findings.json`** | Authoritative simplified “finding list” emitted by humans or tooling during dry runs |

Scenarios deliberately avoid shipping full **`ArchitectureRequest`** bodies: only **`inputSummary`** text is retained for readability. Extend with additional fields when simulator exports stabilize.

---

## Metrics (V1 heuristic)

For each **`expectedFindings`** rule the script succeeds when **some** recording row matches **category**, meets **minimumSeverity**, and contains **every** substring listed in **`evidenceMustContain`** (case-insensitive, title + detail text).

For each **`unexpectedFindings`** rule the script emits a warning/failure when **any** row in the nominated category exposes **any** forbidden substring (**`ifContainsAny`**).

Reported **`recall`** = **hits ÷ rules** per scenario — not classical IR recall.

**Precision analogue:** count **`unexpected`** triggers (`0` is healthy). Formal precision against live LLMs is deferred until automated runs land.

---

## CI posture

- **Default:** informational — script exits **0** even when recalls dip (aligns with assessment “do not block CI initially”).
- **Strict:** `python scripts/ci/eval_agent_corpus.py --enforce --min-recall 0.75` for release branches.

---

## Adding a scenario

1. Copy an existing **`scenario-*.json`** and **`recordings/*.findings.json`** pair.
2. Keep **≥3** expected rules and **≥2** unexpected rules (assessment minimum).
3. Append the filename to **`manifest.json`**.
4. Run `python scripts/ci/eval_agent_corpus.py` locally before pushing.

---

## Related documents

- **`docs/library/AI_AGENT_PROMPT_REGRESSION.md`** — prompt change discipline
- **`scripts/ci/eval_agent_quality.py`** — broader offline dataset validation (distinct manifest)
