# Proof package checklist — AWS cost and governance (starter)

Use after **commit**. Confirms the package is **useful for a workshop**, not that AWS spend improved.

- [ ] **Scope of organization** — hub/spoke or equivalent segmentation is described without pretending to match the reader's real OU tree.
- [ ] **Tag and SCP story** — mandatory tags and deny rules appear as **design** findings, not as live enforcement proof.
- [ ] **Cost observability** — CUR exports, budgets, or anomaly workflows are referenced at architecture level (no invented percentages).
- [ ] **Data path costs** — expensive tiers (e.g. cross-region, overweight instance families) might be surfaced as **risks**, not as billed facts unless you attach real data later.
- [ ] **Security baseline tie-in** — encryption and public exposure themes align with governance narrative without claiming Security Hub scores.
- [ ] **Disclaimer** — placeholders and no ROI guarantees are clear for external viewers.
