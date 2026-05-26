> **Scope:** Buyer — Appendix — Pack B: Security Architecture Baseline (V1 bundled default) - full detail, tables, and links in the sections below.

# Appendix — Pack B: Security Architecture Baseline (V1 bundled default)

**Status:** Starter baseline (GA); authoritative rule payload in-repo.

**Buyer disclaimer:** The corpus maps architecture reviews to **CIS Azure Foundations** and **OWASP ASVS** **themes**. It **does not** replace CIS-CAT scoring, penetration testing, SOC 2 control testing, contractual SLAs with cloud providers, or jurisdiction-specific mandates. Responsibility for compliance claims stays with each buyer organization.

---

## Canonical source

[`docs/samples/policy-packs/security-architecture-baseline-rules-v1.json`](../samples/policy-packs/security-architecture-baseline-rules-v1.json)

Each rule exposes **`severity`**, **`remediationGuidance`**, **`evidenceHints`**, plus paired mappings for CIS and ASVS thematic strings.

---

## Table 1 — CIS Microsoft Azure Foundations (thematic rollup)

| CIS thematic cue (verbatim from corpus) | Rule keys |
|------------------------------------------|-----------|
| 1 Identity and Access Management — MFA enforcement themes | `sec-base-001` |
| 1 — IAM-managed credential / MI patterns | `sec-base-002` |
| 8 — Secrets hygiene themes | `sec-base-003` |
| 1 — RBAC assignment hygiene themes | `sec-base-004` |
| 1 — Identity policy documentation themes | `sec-base-005` |
| 7 Networking — restrict public exposure themes | `sec-base-006` |
| 7 — Private Endpoint adoption themes | `sec-base-007` |
| 7 — NSG themes | `sec-base-008` |
| 7 — Segmentation themes | `sec-base-009` |
| 7 — Private Link DNS themes | `sec-base-010` |
| 8 — Encryption at rest themes | `sec-base-011` |
| 8 — Encryption in transit themes | `sec-base-012` |
| 8 — Key management lifecycle themes | `sec-base-013` |
| 8 — Certificate lifecycle automation themes | `sec-base-014` |
| 5 Logging and Monitoring — centralized sinks themes | `sec-base-015` |
| 5 — Forward security telemetry themes | `sec-base-016` |
| 5 — Alerting / anomaly themes | `sec-base-017` |
| 5 — Audit logging completeness themes | `sec-base-018` |
| 5 — Retention themes | `sec-base-019` |
| 9 Change / DevOps hygiene themes | `sec-base-020` |
| 9 Peer review themes | `sec-base-021` |
| 9 Dependency hygiene themes | `sec-base-022` |
| 9 Container security scanning themes | `sec-base-023` |
| 9 Secure IaC themes | `sec-base-024` |
| 9 Secret hygiene automation themes | `sec-base-025` |
| 8 Key Vault usage / secret store integration themes | `sec-base-026` |
| 8 Encryption in transit — protocol minimum themes | `sec-base-027` |
| 7 Private Endpoint enforcement for sensitive data planes (thematic) | `sec-base-028` |
| 7 Edge protection / application-layer filtering themes | `sec-base-029` |
| 1 Privileged access lifecycle / JIT themes | `sec-base-030` |

---

## Table 2 — OWASP ASVS thematic rollup

| OWASP ASVS thematic cue | Rule keys referencing that thematic |
|-------------------------|-------------------------------------|
| V2 Authentication — multi-factor controls | `sec-base-001` |
| V2.10 — Service authentication | `sec-base-002` |
| V13 API / secret storage configuration | `sec-base-003` |
| V4 Authorization granularity | `sec-base-004` |
| V2 Session / policy documentation | `sec-base-005` |
| V13 Transport layer protection adjacency | `sec-base-006` |
| V1 Trusted zones | `sec-base-007`, `sec-base-010` |
| V13 Segmentation expectations | `sec-base-008` |
| V1 Trusted boundaries | `sec-base-009` |
| V8 Stored secrets/data | `sec-base-011` |
| V9 Communications security — TLS baseline | `sec-base-012` |
| V10 Cryptographic practices | `sec-base-013` |
| V9 TLS certificate lifecycle | `sec-base-014` |
| V7 Errors / logging integrity | `sec-base-015` |
| V7 Security event pipeline | `sec-base-016` |
| V7 Intrusion detection adjacency | `sec-base-017` |
| V7 Logging coverage for privileged actions | `sec-base-018` |
| V7 Log retention | `sec-base-019` |
| V15 Secure coding lifecycle — SCM protections | `sec-base-020` |
| V15 Review enforcement | `sec-base-021` |
| V14 Dependency management | `sec-base-022` |
| V14 Supply chain — container artifacts | `sec-base-023` |
| V5 IaC hygiene | `sec-base-024` |
| V13 Secret scanning automation | `sec-base-025` |
| V13 Secret management — centralized retrieval | `sec-base-026` |
| V9 Communications — cipher and protocol minimums | `sec-base-027` |
| V1 Architecture — regulated data enclave expectations | `sec-base-028` |
| V13 Request handling protections at the perimeter | `sec-base-029` |
| V4 Access Control — privileged session boundaries | `sec-base-030` |

---

## Operational notes

- **Rule counts:** **Thirty** curated keys populate the seeded **`complianceRuleKeys`** array shipped with provisioning templates (`DefaultPolicyPackTemplates.SecurityArchitectureBaselineV1Json`). Pack narrative artifact version **1.1.0** adds five controls (**`sec-base-026`**–**`sec-base-030`**) focused on Key Vault retrieval, TLS protocol minimums at ingress, regulated datastore Private Link enforcement, perimeter WAF posture, and JIT-style privileged access documentation — **mapping only**, not certification.
- **Azure landing-zone / CAF specificity:** Starter **`lz-caf-*`** bundled pack ships at **V1 GA** (see **[`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md)**); exhaustive subscription-factory conformance remains out of scope.
