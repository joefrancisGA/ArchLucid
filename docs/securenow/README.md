> **Scope:** SecureNow product and architecture notes that are not yet folded into the architect-plane contract. **Contributor-reference** — internal only.
> **Spine:** [`../START_HERE.md`](../START_HERE.md) · **Architect plane:** [`../library/SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md) · **Observation plane:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md)

# SecureNow — folder index

**Audience:** Francis Architecture LLC owner and engineering agents scoping SecureNow diagram and architect work.

| Document | Purpose |
|----------|---------|
| [`DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md) | Separate **infrastructure**, **data architecture**, and **data flow** diagrams; what Azure inventory can discover automatically; first slice vs gold-standard examples |
| [`EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md) | Diagram 3 **evidence families** (declared / authorized / DNS-joined PE path / inferred); ordinal bands; **not** numeric confidence |
| [`ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md`](ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md) | Expected **Data flow** edges for the ArchLucid DEV subscription (2026-09-18 snapshot), from Terraform/CD/threat-model artifacts — not observed traffic |
| [`../architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md) | Composer prompts **SN-DF-01–SN-DF-08** + hold (paste files under `.cursor/prompts/securenow-data-flow-*.md`) — **do not implement from the design note** |
| [`../architecture/SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md) | Composer prompts **SN-PE-01–SN-PE-07** + hold (paste files under `.cursor/prompts/securenow-probable-evidence-*.md`) — Data Flow families after AX-DE collection; **do not implement from the tables** |
