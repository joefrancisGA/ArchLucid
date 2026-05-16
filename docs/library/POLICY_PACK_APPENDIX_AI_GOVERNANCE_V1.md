# Appendix — Pack A: AI Governance / Responsible AI (V1 bundled default)

**Status:** Starter baseline (GA); authoritative rule payload in-repo.

**Buyer disclaimer:** Starter baseline aligned to **informative thematic mapping** toward **NIST AI RMF v1.0** and **EU AI Act Annex III/high-risk motifs** — **not** legal classification or conformity assessment authority. Organizational counsel and jurisdictional applicability remain buyer responsibilities.

---

## Canonical source

[`docs/samples/policy-packs/ai-governance-responsible-ai-rules-v1.json`](../samples/policy-packs/ai-governance-responsible-ai-rules-v1.json)

Each rule includes **`title`**, **`description`**, **`severity`**, **`remediationGuidance`**, and **`frameworkMappings`**.

---

## Table 1 — NIST AI RMF v1.0 theme rollup (starter keys)

| NIST AI RMF theme (starter corpus label) | Rule keys referencing that theme |
|------------------------------------------|----------------------------------|
| **Map** | `ai-gov-001`, `ai-gov-004`, `ai-gov-005`, `ai-gov-007`, `ai-gov-015`, `ai-gov-018`, `ai-gov-020` |
| **Govern** | `ai-gov-002`, `ai-gov-008`, `ai-gov-010`, `ai-gov-016` |
| **Manage** | `ai-gov-003`, `ai-gov-009`, `ai-gov-014`, `ai-gov-019` |
| **Measure** | `ai-gov-006`, `ai-gov-011`, `ai-gov-012`, `ai-gov-013`, `ai-gov-017` |

---

## Table 2 — EU AI Act thematic mapping rollup (starter keys)

| EU AI Act thematic string (verbatim from corpus) | Rule keys referencing that thematic |
|--------------------------------------------------|-------------------------------------|
| Annex III — AI systems intended for critical infrastructure / safety-related contexts (thematic mapping) | `ai-gov-001` |
| Annex III — High-risk administrative / operational reliance (thematic mapping) | `ai-gov-002` |
| Documentation & traceability themes (thematic mapping) | `ai-gov-003` |
| Risk management system themes (thematic mapping) | `ai-gov-004`, `ai-gov-014` |
| Data governance & fundamental rights themes (thematic mapping) | `ai-gov-005` |
| Transparency & logging adjacent themes (thematic mapping) | `ai-gov-006` |
| Cybersecurity & resilience themes (thematic mapping) | `ai-gov-007` |
| Human oversight themes (thematic mapping) | `ai-gov-008` |
| Annex III — Access to essential services / automated decision themes (thematic mapping) | `ai-gov-009` |
| Monitoring & incident response themes (thematic mapping) | `ai-gov-010` |
| Post-market monitoring themes (thematic mapping) | `ai-gov-011`, `ai-gov-013` |
| Quality & performance themes (thematic mapping) | `ai-gov-012` |
| Record-keeping themes (thematic mapping) | `ai-gov-015` |
| Data minimization themes (thematic mapping) | `ai-gov-016` |
| Transparency & logging themes (thematic mapping) | `ai-gov-017` |
| Third-party reliance themes (thematic mapping) | `ai-gov-018` |
| Operational resilience themes (thematic mapping) | `ai-gov-019` |
| High reliability / critical service themes (thematic mapping) | `ai-gov-020` |

---

## Operational notes

- **Rule counts:** Exactly **twenty** curated keys referenced from the seeded **`PolicyPackContentDocument.complianceRuleKeys`** array shipped with provisioning templates (`DefaultPolicyPackTemplates.AiGovernanceResponsibleAiV1Json`).
- **Change management:** Version bumps propagate through **`PolicyPackManagementService`** changelog rows—see SQL migration patterns under `*_PolicyPack*` scripts; pilots should monitor release notes rather than rewriting platform rows in SQL.
