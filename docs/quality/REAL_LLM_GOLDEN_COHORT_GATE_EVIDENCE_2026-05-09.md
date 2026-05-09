> **Scope:** Record of a **2026-05-09** attempt to run the golden-cohort / eval-corpus real-LLM evidence path per [`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) and [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md); includes credential-free **exemplar** scoring from `scripts/ci/eval_agent_corpus.py` — **not** a substitute for live Azure OpenAI completions.

# Golden cohort real-LLM gate — evidence (2026-05-09)

## Live Azure OpenAI attempt (blocked in this environment)

Live execution requires `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and `AZURE_OPENAI_DEPLOYMENT_NAME` (see [`docs/library/FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md)). In the automation shell used for this record, all three were **unset** (`python` `os.environ.get` check on 2026-05-09). **No API or `archlucid try --real` invoke ran**; no cloud credentials were used or logged.

**Operator follow-up (live evidence):**

1. Set `ARCHLUCID_REAL_AOAI=1` and the `AZURE_OPENAI_*` variables; start the stack in **Real** mode per `FIRST_REAL_VALUE.md`.
2. Run architecture executes that yield **Topology / Cost / Compliance / Critic** `AgentResult` JSON (or export `ParsedResultJson` / use `GET /v1/architecture/run/{runId}/agent-evaluation`).
3. Point `ARCHLUCID_EVAL_CORPUS_REAL_MODE_*_AGENT_RESULT` at those **exported files** (not the committed exemplars), then run:
   `python scripts/ci/eval_agent_corpus.py --markdown-report <path>`
4. Copy metrics into [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) with **actual** authority `runId` values and the **deployment name** from Azure.

## Session record (template fields)

| Field | Value |
|-------|--------|
| **Date (UTC)** | 2026-05-09 |
| **Environment** | Local automation — live stack **not** started (AOAI env absent). |
| **Agent mode** | **Not executed (live)**. Offline scoring used committed RC **`*.real.json`** exemplars only. |
| **Model or deployment id** | Live: **N/A** (blocked). Canonical policy: **`gpt-4o`** deployment name per [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) §10. |
| **Brief / scenario id** | Eval corpus real-mode rows: `corpus-real-mode-smoke`, `corpus-real-mode-cost`, `corpus-real-mode-compliance`, `corpus-real-mode-critic` ([`AGENT_EVAL_CORPUS.md`](../library/AGENT_EVAL_CORPUS.md)). |
| **Run id** | **Live:** N/A. **Exemplar JSON `runId` (RC fixtures, not authority GUIDs):** `corpus-rms-run-exemplar`, `corpus-rmc-run-exemplar`, `corpus-rmco-run-exemplar`, `corpus-rmcr-run-exemplar` — see `tests/eval-corpus/agent-results/*.real.json`. |
| **Outcome** | **Aborted** for live AOAI; **offline eval script succeeded** (exit 0) against exemplar paths. |
| **Human verdict** | **not yet** for buyer-grade “real LLM” proof — requires operator-run live session and fresh exports. Exemplar path confirms the **scoring pipeline** only. |
| **Structural / semantic scores** | See §Exemplar-only metrics (deterministic scorer; same defaults as shipped quality-gate floors in `eval_agent_corpus.py`). |
| **Follow-ups** | Run live path above; attach deployment name and real `runId` values; optionally enforce `--enforce-real-quality-gate` for strict RC posture. |

## Exemplar-only metrics (2026-05-09T17:51:07Z)

Command: `python scripts/ci/eval_agent_corpus.py --markdown-report` with:

- `ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT` → `tests/eval-corpus/agent-results/corpus-real-mode-smoke.real.json`
- `ARCHLUCID_EVAL_CORPUS_REAL_MODE_COST_AGENT_RESULT` → `tests/eval-corpus/agent-results/corpus-real-mode-cost.real.json`
- `ARCHLUCID_EVAL_CORPUS_REAL_MODE_COMPLIANCE_AGENT_RESULT` → `tests/eval-corpus/agent-results/corpus-real-mode-compliance.real.json`
- `ARCHLUCID_EVAL_CORPUS_REAL_MODE_CRITIC_AGENT_RESULT` → `tests/eval-corpus/agent-results/corpus-real-mode-critic.real.json`

**Rollup:** `real_mode_quality total=4 skipped_no_env=0 evaluated=4 errors=0 evidence_captured=yes`

| Scenario | Mode | Structural | Semantic | Gate | Claims OK | Findings OK |
|----------|------|------------|----------|------|-----------|-------------|
| `corpus-real-mode-smoke` | real (exemplar) | 1.00 | 1.00 | **accepted** | 1.00 | 1.00 |
| `corpus-real-mode-cost` | real (exemplar) | 1.00 | 1.00 | **accepted** | 1.00 | 1.00 |
| `corpus-real-mode-compliance` | real (exemplar) | 1.00 | 1.00 | **accepted** | 1.00 | 1.00 |
| `corpus-real-mode-critic` | real (exemplar) | 1.00 | 1.00 | **accepted** | 1.00 | 1.00 |

All simulator-backed quality rows in the same run also reported **accepted** (full corpus recall 1.00). **No `--enforce` flags** were passed; CLI exit **0**.

## Links

- [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md)
- [`AGENT_EVAL_CORPUS.md`](../library/AGENT_EVAL_CORPUS.md)
- `scripts/ci/eval_agent_corpus.py`
