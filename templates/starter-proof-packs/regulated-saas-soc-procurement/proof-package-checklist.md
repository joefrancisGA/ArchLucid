# Proof package checklist — regulated SaaS (SOC-oriented starter)

Use after **commit** when reviewing the exportable package. This is a **structure and coverage** list only — not pass/fail against SOC or any framework.

- [ ] **System boundary** — tenant isolation and public entrypoints are stated clearly in the manifest or artifacts.
- [ ] **Identity and access** — admin vs tenant paths and break-glass concepts are distinguishable in findings or ADR-style artifacts.
- [ ] **Secrets and keys** — no design that depends on long-lived shared secrets in app configuration for production.
- [ ] **Data stores** — OLTP vs cache vs blob roles are reflected; cross-tenant risk called out if present in the narrative.
- [ ] **Change and deploy** — pipeline concepts (signed builds, migration gates) appear where relevant to findings.
- [ ] **Third parties** — subprocessor or integration touchpoints are named at architecture level (synthetic names only in this starter).
- [ ] **Disclaimer present** — any external share includes demo/synthetic data language from the README or first-value report guidance.
