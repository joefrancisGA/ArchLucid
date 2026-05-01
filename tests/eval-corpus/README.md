# Synthetic agent evaluation corpus

**Purpose:** offline **precision / recall–style** checks against **hand-authored “findings” recordings** so prompt and simulator changes can regress without customer data.

Each **`*.scenario.json`** references a sibling **`recordings/<id>.findings.json`** shaped like a simplified run finding list (category, severity, free text).

Constraints from product policy:

- No real customer payloads.
- **Inform-only in CI by default** — use **`eval_agent_corpus.py --enforce`** when you intentionally want a failing exit code.
