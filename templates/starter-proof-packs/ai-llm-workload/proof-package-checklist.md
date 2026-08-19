# Proof package checklist — AI / LLM workload (starter)

Use after **commit**. Confirms the package supports a **governance workshop**, not model performance proof.

- [ ] **Inference boundary** — who invokes the model and through which gateway (APIM vs direct) is clear.
- [ ] **RAG / corpus** — where chunks live, who can refresh the index, and network path to the vector store are described.
- [ ] **Tool use** — if tools or plugins exist, blast radius and authentication to downstream APIs are discussed.
- [ ] **Secrets and identity** — no pattern that relies on embedding API keys in browser or mobile for this starter’s intent.
- [ ] **Logging and redaction** — what is logged vs intentionally **not** retained appears in findings or artifacts at a design level.
- [ ] **Safety and escalation** — content policy and human handoff hooks are visible as **design**, not as measured false-positive rates.
- [ ] **Disclaimer** — synthetic data, no safety certification, and no accuracy guarantees remain visible for any export.
