# Proof package checklist — GCP cost and governance (starter)

Use after **commit**. Confirms the package is **useful for a workshop**, not that GCP spend improved.

- [ ] **Scope of folder hierarchy** — hub/spoke or equivalent segmentation is described without pretending to match the reader's real folder tree.
- [ ] **Label and organization policy story** — mandatory labels and deny constraints appear as **design** findings, not as live enforcement proof.
- [ ] **Cost observability** — billing exports, budgets, or anomaly workflows are referenced at architecture level (no invented percentages).
- [ ] **Data path costs** — expensive tiers (e.g. cross-region, overweight machine types) might be surfaced as **risks**, not as billed facts unless you attach real data later.
- [ ] **Security baseline tie-in** — encryption and public exposure themes align with governance narrative without claiming Security Command Center scores.
- [ ] **Disclaimer** — placeholders and no ROI guarantees are clear for external viewers.
