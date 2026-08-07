# 6. Governance and policy packs

Policy packs are the adaptive brain of governance: rules, alerts, and advisory defaults ship as JSON/YAML and merge hierarchically at tenant, workspace, or project scope. The evaluation engine in `ArchLucid.Decisioning` stays decoupled from framework-specific knowledge.

## Diagram

![Governance and policy packs](../architecture_diagrams/archlucid-governance-policy-packs.svg)

Content velocity: LLM draft → critic → human SME. See `docs/library/POLICY_PACK_CONTENT_BACKLOG.md`.
