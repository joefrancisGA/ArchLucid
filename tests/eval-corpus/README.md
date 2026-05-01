# Synthetic agent evaluation corpus

**Purpose:** offline **precision / recall–style** checks against **hand-authored “findings” recordings** so prompt and simulator changes can regress without customer data.

Each **`*.scenario.json`** references a sibling **`recordings/<id>.findings.json`** shaped like a simplified run finding list (category, severity, free text).

Constraints from product policy:

- No real customer payloads.
- **Inform-only in CI by default** — use **`eval_agent_corpus.py --enforce`** when you intentionally want a failing exit code on recall / unexpected probes; use **`--enforce-quality-gate`** for simulator **AgentResult** rejections.

**V1 slice:** five customer-*like* synthetic briefs include **`agent-results/*.simulator.json`** plus **`qualityEvidence`** in the scenario file — see **`docs/library/AGENT_EVAL_CORPUS.md`**. CI runs the script with **`--markdown-report`** (GitHub job summary).

**Release posture (reference / golden real-LLM path):** when owners flip **blocking** gates for reference Azure OpenAI or golden cohort runs, insufficient structural or semantic scores (or **AgentResult** rejections) must **fail the release pipeline** — warn-only dashboards are intentionally insufficient once that posture is enabled. Operational wiring is documented under **`docs/library/AGENT_OUTPUT_EVALUATION.md`** and **`scripts/ci/eval_agent_quality.py`**.
