# Proof package checklist — healthcare data workflow (starter)

Use after **commit**. This checks **architecture narrative completeness**, not regulatory approval.

- [ ] **PHI boundary** — which subnets or services may hold PHI vs de-identified data is explicit enough to debate in workshop.
- [ ] **Ingress and egress** — ingestion, validation, and downstream analytics paths are traceable in findings or diagrams.
- [ ] **Identity separation** — engineering paths vs analyst paths are not conflated in the described design.
- [ ] **Logging and audit** — intent for security/operational logs and retention is visible (implementation truth is customer-owned).
- [ ] **Residency / segmentation** — regions and subscription boundaries appear where the narrative claims separation.
- [ ] **Disclaimer** — synthetic data and no HIPAA claims are preserved for any export.
