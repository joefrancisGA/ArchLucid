> **Scope:** Per-pack context blocks copied into generator and critic prompts for policy-pack authoring. Internal reference only; not buyer-facing materials or canonical go-to-market pack definitions.

# ArchLucid policy pack — authoring contexts

**Purpose:** One context block per pack queued for authoring. Copy the relevant block into `GENERATOR_PROMPT.md` and `CRITIC_PROMPT.md` before running.

**Pack order follows the execution wave plan in [`DEFAULT_POLICY_PACKS_V1.md`](../../go-to-market/DEFAULT_POLICY_PACKS_V1.md).**

---

## Wave 0 — ARC-AMPE (pack #24)

```
PACK_DISPLAY_NAME:   ARC-AMPE Architecture Themes (CMS ACA / Medicaid Partner Entities)
PACK_DESCRIPTION:    Architecture-review themes aligned to CMS ARC-AMPE Volume I v1.02 — the successor to MARS-E. Covers the seven ACA AE Pillars, the ACA AE CSF Profile (NIST CSF Identify/Protect/Detect/Respond/Recover), the Privacy Framework Profile, Enterprise Risk Management (NIST 800-37 RMF), and mandatory US data-residency requirements. Not CMS conformity, SSPP authoring, or attestation.
PACK_CATEGORY:       Compliance
SLUG:                arc-ampe-architecture-themes
RULE_PREFIX:         See sub-corpora table — varies by sub-corpus
TARGET_RULE_COUNT:   80
FRAMEWORK_SHORT_NAME: ARC-AMPE (CMS)

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix              | Theme                                         | Target rules | Priority skew |
|---------------------|-----------------------------------------------|-------------|---------------|
| arc-ampe-pillar-    | Seven ACA AE Pillars (one rule per Pillar)     | 7           | All P0        |
| arc-ampe-id-        | NIST CSF Identify (ID.AM, ID.BE, ID.GV, ID.RA, ID.RM, ID.SC) | 12 | Mostly P0/P1 |
| arc-ampe-pr-        | NIST CSF Protect (PR.AC, PR.AT, PR.DS, PR.IP, PR.MA, PR.PT) | 18 | Mixed P0/P1 |
| arc-ampe-de-        | NIST CSF Detect (DE.AE, DE.CM, DE.DP)         | 8           | Mixed P0/P1   |
| arc-ampe-rs-        | NIST CSF Respond (RS.RP, RS.CO, RS.AN, RS.MI, RS.IM) | 6     | Mostly P1     |
| arc-ampe-rc-        | NIST CSF Recover (RC.RP, RC.IM, RC.CO)        | 5           | Mostly P1     |
| arc-ampe-pf-        | NIST Privacy Framework (Identify-P, Govern-P, Control-P, Communicate-P, Protect-P) | 10 | Mixed P0/P1 |
| arc-ampe-erm-       | Enterprise Risk Management (NIST 800-37 RMF)  | 6           | All P0        |
| arc-ampe-data-us-   | US data residency / offshore prohibition       | 4           | All P0        |
| arc-ampe-vol2-      | Volume II SSPP artifact pointer rules (advisory) | 4        | All P2        |

SOURCE FRAMEWORK SUMMARY:
ARC-AMPE Volume I v1.02 (CMS, 2025-04-10) is a CMS security and privacy standard for ACA Administering Entities (ACA AEs), Medicaid agencies, and their partner entities (IT vendors, data processors). It supersedes MARS-E and the NEE GRC Framework.

Key elements for rule authoring:
- SEVEN ACA AE PILLARS (Table 6): (1) Engage consumer / informed decisions; (2) Seamless experience / end-to-end enrollment; (3) Trust, transparency, accountability; (4) Accessibility and availability of coverage; (5) Compliance with federal laws/regulations; (6) Drive innovation; (7) Simple, affordable products / continuity of care.
- HIGH PRIORITY CSF SUBCATEGORIES (Table 7): ID.BE-4 (dependencies/critical functions), ID.BE-3 (priorities communicated), ID.BE-5 (resilience requirements), ID.BE-1 (supply chain role), PR.DS-2 (data-in-transit), ID.GV-1 (policy established), ID.GV-3 (legal/regulatory requirements), ID.GV-2 (roles/responsibilities), ID.GV-4 (governance/risk processes), DE.AE-1 (network baseline), ID.BE-2 (critical infrastructure), PR.DS-1 (data-at-rest), PR.DS-5 (data leaks), PR.DS-3 (asset management), PR.DS-4 (availability capacity), PR.DS-6 (integrity checking), DE.AE-4 (event impact), ID.AM-3 (data flows mapped), DE.AE-2 (event analysis), DE.AE-5 (alert thresholds), PR.AC-1 (identities/credentials).
- MODERATE PRIORITY CSF SUBCATEGORIES (Table 8): PR.AC-3 (remote access), PR.AC-6 (identity proofing), PR.AC-7 (authentication), ID.AM-5 (resource prioritization), PR.DS-7 (dev/test separation), PR.AC-4 (least privilege), PR.AC-5 (network integrity), RS.MI-1 (containment), RC.RP-1 (recovery plan), DE.CM-1 (network monitoring), DE.CM-4 (malicious code), DE.CM-8 (vulnerability scans), DE.CM-3 (personnel activity), DE.CM-5 (unauthorized mobile code), DE.CM-6 (external provider monitoring), DE.CM-7 (unauthorized personnel/connections), RC.IM-1 (lessons learned).
- HIGH PRIORITY PRIVACY FRAMEWORK SUBCATEGORIES (Table 9): ID.IM-P2 through ID.IM-P8 (data inventory/mapping), ID.BE-P1/P2/P3, GV.PO-P3/P4/P5/P6, GV.AT-P1/P3, GV.MT-P3.
- US DATA RESIDENCY: ARC-AMPE mandates US-only hosting; eliminates offshore hosting options from MARS-E.
- ERM INTEGRATION: NIST 800-37 RMF (categorize → select → implement → assess → authorize → monitor) is mandatory.
- NIST SP 800-53 R5 MODERATE BASELINE with CMS tailoring is the control foundation. Common families: AC, AT, AU, CA, CM, CP, IA, IR, MA, MP, PE, PL, PM, PS, PT, RA, SA, SC, SI, SR.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not ARC-AMPE conformity, SSPP authoring, CMS attestation, or legal classification."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- hipaa-architecture (#11): HIPAA PHI safeguards overlap but ARC-AMPE is ACA/Medicaid-specific scope
- nist-csf-2-architecture (#19): CSF is covered thematically here; NIST CSF 2.0 pack covers the full standard
- zero-trust-architecture (#13): ZTA themes appear in PR.AC rules; do not duplicate ZTA core rules
- data-classification-lineage (#16): Data inventory themes overlap; cite, don't duplicate
- entra-iam-baseline (#17): PR.AC identity rules overlap; cross-reference, don't replicate
- supply-chain-sbom (#20): ID.BE-1 supply chain role overlaps; cross-reference only
```

---

## Wave 1 — Azure Storage Architecture (pack #25)

```
PACK_DISPLAY_NAME:   Azure Storage Architecture
PACK_DESCRIPTION:    Architecture-review baseline for Azure Storage services — Blob Storage, Azure Data Lake Storage Gen2, Azure Files, Queue Storage, and Table Storage. Covers access control, encryption (at-rest and in-transit), data-protection features, networking boundaries, lifecycle management, and cost-tier hygiene. Not a Microsoft storage certification.
PACK_CATEGORY:       Azure Platform
SLUG:                azure-storage-architecture
RULE_PREFIX:         az-store-
TARGET_RULE_COUNT:   35
FRAMEWORK_SHORT_NAME: Azure Storage

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix              | Theme                                              | Target rules | Priority skew |
|---------------------|----------------------------------------------------|-------------|---------------|
| az-store-iam-       | Access control (RBAC, shared-access signatures, anonymous access prohibition) | 7 | P0-heavy |
| az-store-enc-       | Encryption at rest (SSE, CMK, infrastructure encryption), in-transit (HTTPS enforcement, minimum TLS) | 6 | P0-heavy |
| az-store-net-       | Network boundaries (private endpoints, firewall rules, public access, service endpoints, AMPLS) | 6 | P0-heavy |
| az-store-dp-        | Data protection (soft delete, versioning, immutability / WORM, point-in-time restore) | 6 | P1-heavy |
| az-store-lifecycle- | Lifecycle management, access tiers (hot/cool/cold/archive), cost hygiene | 5 | P1/P2 |
| az-store-diag-      | Diagnostics, logging, monitoring (diagnostic settings → Log Analytics, metrics, alerts) | 5 | P1 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Azure Storage documentation, Azure Well-Architected Framework (Security and Reliability pillars), CIS Microsoft Azure Foundations Benchmark v2.0 (sections 3 — Storage Account).

Key themes for rule authoring:
- PUBLIC ACCESS: anonymous public access to blobs must be documented / prohibited unless explicitly justified; shared-access-signature (SAS) tokens should have expiry and least-privilege scope.
- RBAC: storage accounts should use Microsoft Entra ID / managed identity for access rather than storage access keys; access keys should be rotated and stored in Key Vault.
- ENCRYPTION: SSE with Microsoft-managed keys is default; CMK via Key Vault is the hardened path for regulated data; infrastructure encryption (double encryption) for highly sensitive workloads; HTTPS enforcement and minimum TLS 1.2.
- PRIVATE ENDPOINTS / NETWORKING: sensitive storage accounts should restrict public network access via firewall rules; private endpoints + private DNS zones for ADLS Gen2 and critical blob accounts.
- DATA PROTECTION: soft delete for blobs and containers; versioning enabled for regulated data; immutability (WORM) for compliance / legal-hold scenarios.
- LIFECYCLE: lifecycle management policies to manage tier transitions and cost; archive tier for rarely-accessed compliance data; last-access-time tracking.
- ADLS GEN2 SPECIFIC: hierarchical namespace, Entra-based ACLs, data lake zones (raw / curated / consumption) documented in manifest.
- MONITORING: diagnostic settings enabled; storage-level metrics forwarded to Log Analytics; alerts on suspicious activity.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft certification or Azure storage compliance attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- azure-caf-landing-zone (#4): landing zone governance includes storage account policy assignments; cross-reference
- security-architecture-baseline (#2): generic encryption/private endpoint rules overlap; do not re-state general principles
- azure-data-layer-security (#23): SQL/Cosmos DB data-layer; distinct service surface, can cross-reference encryption themes
- data-classification-lineage (#16): data inventory / classification; cross-reference, don't duplicate ADLS lineage themes
- purview-governance (#28): Microsoft Purview scans storage; cross-reference scanning connectivity
```

---

## Wave 1 — Microsoft Defender for Cloud Architecture (pack #26)

```
PACK_DISPLAY_NAME:   Microsoft Defender for Cloud Architecture
PACK_DESCRIPTION:    Architecture-review baseline for Microsoft Defender for Cloud (CSPM + CWPP). Covers Defender plan enablement, secure score baseline, attack path analysis, regulatory compliance dashboards, agent and agentless posture, and multi-cloud governance topology. Not a Microsoft CSPM certification.
PACK_CATEGORY:       Security
SLUG:                defender-for-cloud-architecture
RULE_PREFIX:         mdc-
TARGET_RULE_COUNT:   40
FRAMEWORK_SHORT_NAME: Microsoft Defender for Cloud

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix         | Theme                                                              | Target rules | Priority skew |
|----------------|--------------------------------------------------------------------|-------------|---------------|
| mdc-plans-     | Defender plan enablement (Servers, Storage, SQL, Containers, Key Vault, DNS, Resource Manager, APIs, DevOps) | 9 | All P0 |
| mdc-cspm-      | CSPM / secure score (secure score baseline, recommendations, hardening) | 7 | P0/P1 |
| mdc-cwpp-      | CWPP / workload protection (Defender for Servers agent posture, agentless scanning, container scanning) | 6 | P0/P1 |
| mdc-attack-    | Attack path analysis and cloud security graph | 4 | P1 |
| mdc-reg-       | Regulatory compliance dashboards (assignment, custom standards) | 5 | P1/P2 |
| mdc-govern-    | Governance rules, remediation ownership, DevOps security | 5 | P1/P2 |
| mdc-multi-     | Multi-cloud and multi-tenant governance topology | 4 | P1/P2 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Defender for Cloud documentation, Microsoft Cloud Security Benchmark (MCSB) v1, CIS Microsoft Azure Foundations Benchmark v2.0 (section 2 — Security Center).

Key themes for rule authoring:
- PLAN COVERAGE: each Defender plan (Servers P1/P2, Storage, SQL servers on machines, SQL PaaS, Containers, Key Vault, DNS, Resource Manager, APIs) must be explicitly enabled; plans have per-resource billing implications.
- SECURE SCORE: organisations should maintain a documented baseline secure score target; recommendations should be reviewed on a defined cadence; critical recommendations should block or delay deployments.
- AGENT POSTURE: Defender for Servers P2 requires MMA/AMA agent (or agentless scanning); agentless scanning covers VMs without requiring agent deployment; manifest should document agent strategy.
- CONTAINERS: Defender for Containers covers AKS, ACR image scanning, Kubernetes data plane; runtime threat protection separate from image scanning.
- ATTACK PATH: attack path analysis surfaces paths from internet exposure to sensitive assets; manifest should document exposure points and compensating controls.
- REGULATORY COMPLIANCE: Defender for Cloud supports regulatory compliance dashboards (NIST 800-53, PCI-DSS, ISO 27001, CIS, etc.); assignment of relevant standards should be documented.
- GOVERNANCE RULES: governance rules assign ownership of recommendations to specific Azure RBAC roles; remediation SLAs should be documented.
- DEVOPS SECURITY: Defender for DevOps integrates with GitHub / Azure DevOps; security posture for code repos should be documented.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft Defender for Cloud certification or CSPM score attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- security-architecture-baseline (#2): generic security rules; Defender is the tooling surface — keep distinct
- sentinel-soc-architecture (#27): Sentinel is the SIEM/SOAR layer; Defender is CSPM/CWPP — complementary, not duplicates
- azure-policy-compliance (#29): Azure Policy is the enforcement mechanism; Defender uses policies for initiative assignment
- cis-azure-foundations (#7): Defender secure score aligns with CIS; cross-reference recommendations rather than re-stating CIS rules
```

---

## Wave 1 — Microsoft Sentinel SOC Architecture (pack #27)

```
PACK_DISPLAY_NAME:   Microsoft Sentinel SOC Architecture
PACK_DESCRIPTION:    Architecture-review baseline for Microsoft Sentinel SIEM/SOAR design. Covers Log Analytics workspace topology, data connector inventory, analytics rule coverage, automation / SOAR playbooks, hunting queries, workbook coverage, MITRE ATT&CK alignment, and ingestion cost governance. Not a SOC maturity certification.
PACK_CATEGORY:       Security
SLUG:                sentinel-soc-architecture
RULE_PREFIX:         sentinel-
TARGET_RULE_COUNT:   35
FRAMEWORK_SHORT_NAME: Microsoft Sentinel

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix              | Theme                                                    | Target rules | Priority skew |
|---------------------|----------------------------------------------------------|-------------|---------------|
| sentinel-workspace- | Log Analytics workspace topology (single vs regional, capacity reservation, data retention, RBAC) | 6 | P0-heavy |
| sentinel-connectors-| Data connector inventory (Microsoft 1st-party, partner, syslog/CEF, custom) | 7 | P0-heavy |
| sentinel-analytics- | Analytics rule coverage (scheduled, NRT, anomaly, threat intelligence, Fusion) | 7 | P0/P1 |
| sentinel-soar-      | Automation rules and playbooks (Logic Apps, triage automation, incident enrichment) | 5 | P1 |
| sentinel-threat-    | Threat hunting, watchlists, MITRE ATT&CK coverage | 5 | P1/P2 |
| sentinel-cost-      | Ingestion cost governance (commitment tiers, data filtering, auxiliary logs, basic logs) | 5 | P1/P2 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Sentinel documentation, MITRE ATT&CK framework v14+, Microsoft SIEM/SOAR best practices.

Key themes for rule authoring:
- WORKSPACE TOPOLOGY: single workspace is recommended for most tenants; regional workspaces for data residency; capacity reservation tiers for cost predictability; data retention policy (interactive vs archive).
- DATA CONNECTORS: first-party Microsoft connectors (Entra ID, Defender XDR, Microsoft 365, Azure Activity, Defender for Cloud) are table-stakes P0; network device connectors (syslog/CEF) for on-premises; custom connectors via Logstash / DCR / REST.
- ANALYTICS RULES: scheduled queries at minimum; NRT rules for latency-sensitive detections; Fusion alert correlation; threat-intelligence matching rules; anomaly rules for insider-threat signals.
- AUTOMATION: automation rules for triage and routing; Logic Apps playbooks for enrichment and response; SOAR integration with ticketing systems.
- MITRE ATT&CK: manifest should document which ATT&CK tactics and techniques are covered by analytics rules; visible gaps should be acknowledged and mitigated.
- COST GOVERNANCE: ingestion volume should be projected; commitment tiers vs PAYG decision documented; basic logs for high-volume low-value data; auxiliary logs table tier; data transformation rules to filter noise at ingest.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not SOC maturity certification or Microsoft Sentinel performance attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- defender-for-cloud-architecture (#26): Defender is CSPM/CWPP; Sentinel ingests Defender alerts — complementary
- security-architecture-baseline (#2): generic logging rules overlap; Sentinel is the platform-specific surface
- observability-otel (#22): OTel is application-layer instrumentation; Sentinel is security event management — different planes
- nist-csf-2-architecture (#19): Detect/Respond functions map to Sentinel; cross-reference, don't duplicate
- dora-devsecops (#21): DORA incident response and logging themes; cross-reference only
```

---

## Wave 2 — Azure Policy & Compliance Architecture (pack #29)

```
PACK_DISPLAY_NAME:   Azure Policy & Compliance Architecture
PACK_DESCRIPTION:    Architecture-review baseline for Azure Policy topology design — management group and subscription scope, built-in vs custom initiatives, effect design (Audit/Deny/DeployIfNotExists), remediation tasks, exemption governance, and regulatory compliance initiative assignment. Not an Azure Policy enforcement certification.
PACK_CATEGORY:       Governance
SLUG:                azure-policy-compliance
RULE_PREFIX:         az-pol-
TARGET_RULE_COUNT:   30
FRAMEWORK_SHORT_NAME: Azure Policy

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix          | Theme                                                       | Target rules | Priority skew |
|-----------------|-------------------------------------------------------------|-------------|---------------|
| az-pol-scope-   | Scope hierarchy (management group, subscription, resource group assignment strategy) | 5 | P0-heavy |
| az-pol-init-    | Initiative design (built-in vs custom, initiative grouping, regulatory compliance initiatives) | 6 | P0/P1 |
| az-pol-effect-  | Effect design (Audit vs Deny vs DeployIfNotExists, append, modify) | 5 | P0/P1 |
| az-pol-exempt-  | Exemption governance (waiver documentation, expiry, approval chain) | 5 | P1 |
| az-pol-remed-   | Remediation tasks (DeployIfNotExists remediation, managed identity for remediation, task monitoring) | 5 | P1 |
| az-pol-report-  | Compliance state reporting and dashboards | 4 | P1/P2 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Azure Policy documentation, Microsoft Cloud Adoption Framework (Govern discipline), Azure Well-Architected Framework (Operational Excellence pillar), CIS Azure Foundations Benchmark v2.0.

Key themes for rule authoring:
- SCOPE STRATEGY: policies at management group root for organisation-wide controls; exceptions pushed down to subscription/RG scope; inheritance hierarchy should be documented in the architecture manifest.
- INITIATIVE GROUPING: policies grouped into initiatives by domain (security, networking, tagging, cost); regulatory compliance initiatives (NIST 800-53, ISO 27001, CIS, PCI-DSS) assigned at the appropriate scope.
- EFFECT HIERARCHY: Audit effects for visibility without disruption; Deny effects for hard security gates; DeployIfNotExists (DINE) for automatic remediation; effect choice must be documented with justification.
- EXEMPTIONS: all policy exemptions must be documented with business justification, approval evidence, and expiry date; indefinite exemptions are a governance gap.
- REMEDIATION: DINE policies require a managed identity with appropriate RBAC for remediation tasks; remediation tasks should be monitored and completed within a documented SLA.
- CUSTOM POLICIES: custom policy definitions must follow the same quality standards as built-ins (alias validation, correct effect parameterisation, test coverage); custom policies should be stored in source control.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Azure Policy enforcement attestation or regulatory compliance certification."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- azure-caf-landing-zone (#4): CAF governs policy topology at landing zone level; this pack governs the design of policies themselves
- azure-waf (#3): WAF Operational Excellence covers policy as a tool; this pack covers policy as a product
- nist-csf-2-architecture (#19): regulatory compliance initiative assignment overlaps; cross-reference only
- azure-rbac-architecture (#30): managed identity for remediation tasks overlaps; cross-reference only
```

---

## Wave 2 — RBAC & Azure Role Architecture (pack #30)

```
PACK_DISPLAY_NAME:   RBAC & Azure Role Architecture
PACK_DESCRIPTION:    Architecture-review baseline for Azure role-based access control design — built-in vs custom role design, scope hierarchy, Privileged Identity Management (PIM) / just-in-time access, attribute-based access control (ABAC), service principal surface reduction, and role assignment hygiene. Not a Microsoft identity certification.
PACK_CATEGORY:       Identity
SLUG:                azure-rbac-architecture
RULE_PREFIX:         az-rbac-
TARGET_RULE_COUNT:   30
FRAMEWORK_SHORT_NAME: Azure RBAC

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Theme                                                         | Target rules | Priority skew |
|------------------|---------------------------------------------------------------|-------------|---------------|
| az-rbac-design-  | Role design (built-in preference, custom role justification, wildcard action prohibition) | 5 | P0-heavy |
| az-rbac-scope-   | Scope hygiene (narrowest scope principle, MG vs sub vs RG vs resource assignments) | 5 | P0/P1 |
| az-rbac-pim-     | Privileged Identity Management (just-in-time, approval workflows, time-bound activation, MFA on activation) | 6 | P0-heavy |
| az-rbac-sp-      | Service principal and managed identity hygiene (SP vs MI preference, SP secret rotation, certificate vs secret) | 5 | P0/P1 |
| az-rbac-abac-    | Attribute-based access control (ABAC conditions, storage blob conditions, tag-based conditions) | 4 | P1/P2 |
| az-rbac-hygiene- | Role assignment hygiene (stale assignments, owner proliferation, periodic access reviews) | 5 | P1 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Azure RBAC documentation, Microsoft Entra Privileged Identity Management documentation, Microsoft Cloud Security Benchmark (MCSB) Identity controls, CIS Azure Foundations Benchmark v2.0 (section 1 — Identity and Access Management), Zero Trust identity guidance.

Key themes for rule authoring:
- BUILT-IN PREFERENCE: use built-in roles where possible; custom roles require documented justification and should be as narrow as possible; wildcard (*/write or */delete at broad scope) must be prohibited.
- SCOPE NARROWING: Owner/Contributor at subscription scope is a significant risk; all privileged assignments should be scoped to resource group or lower where operationally feasible.
- PIM: Owner, Contributor, User Access Administrator, and privileged application roles should be eligible (not permanent) via PIM; activation requires MFA; activation time-bound (max 8 hours is common); break-glass accounts are an exception requiring documentation.
- SERVICE PRINCIPALS: service principals should be replaced with managed identities where the workload is Azure-hosted; where SP is required, certificate credentials preferred over client secrets; secret expiry must be documented.
- ABAC: storage blob owner/contributor can be combined with ABAC conditions to scope by tag or blob path; reduces need for custom role proliferation.
- HYGIENE: periodic access reviews via Entra ID Access Reviews; stale assignments (no sign-in in 90+ days) should surface as findings; owner count per subscription/RG should be bounded (common guidance: ≤ 3 owners).

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft identity certification or Zero Trust attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- entra-iam-baseline (#14): Entra covers directory-level identity; this pack covers Azure resource RBAC specifically
- zero-trust-architecture (#13): ZTA identity principles overlap; cross-reference, don't duplicate ZTA core rules
- azure-policy-compliance (#29): remediation managed identity overlaps; cross-reference only
- security-architecture-baseline (#2): least-privilege themes overlap; this pack is the prescriptive RBAC design surface
```

---

## Wave 2 — Azure Virtual Desktop Architecture (pack #36)

```
PACK_DISPLAY_NAME:   Azure Virtual Desktop Architecture
PACK_DESCRIPTION:    Architecture-review baseline for Azure Virtual Desktop (AVD) — host pool design, FSLogix profile strategy, session-host scaling and image management, Entra join vs hybrid Entra join, Conditional Access for VDI, and network segmentation for remote-workforce workloads. Relevant to regulated industries requiring controlled remote access to sensitive applications (e.g. EHR systems via AVD). Not a Microsoft VDI certification.
PACK_CATEGORY:       Azure Platform
SLUG:                azure-virtual-desktop
RULE_PREFIX:         avd-
TARGET_RULE_COUNT:   30
FRAMEWORK_SHORT_NAME: Azure Virtual Desktop

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix          | Theme                                                            | Target rules | Priority skew |
|-----------------|------------------------------------------------------------------|-------------|---------------|
| avd-pool-       | Host pool design (pooled vs personal, load balancing, depth-first vs breadth-first, max session) | 5 | P0/P1 |
| avd-identity-   | Identity join strategy (Entra join, hybrid Entra join, AD DS join, Conditional Access, MFA for VDI) | 6 | P0-heavy |
| avd-fslogix-    | FSLogix profile design (profile container, cloud cache, storage backend, antivirus exclusions) | 5 | P0/P1 |
| avd-image-      | Image management (custom images, Azure Compute Gallery, update cadence, endpoint protection) | 5 | P1 |
| avd-network-    | Network segmentation (AVD subnet isolation, private link for AVD management, NSG design, RDP shortpath) | 5 | P0/P1 |
| avd-cost-       | Cost optimisation (start/stop automation, scaling plans, spot instances for dev/test pools) | 4 | P1/P2 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Azure Virtual Desktop documentation, Microsoft AVD security baseline, Azure Well-Architected Framework (Security and Cost Optimisation pillars as applied to VDI), CIS Microsoft AVD benchmark themes.

Key themes for rule authoring:
- HOST POOLS: pooled host pools for task workers; personal pools for power users requiring persistent desktop; load balancing algorithm should match workload type; max-session limit must be sized to VM SKU.
- IDENTITY: Entra join is the modern path (removes AD DS dependency); hybrid Entra join required for apps needing Kerberos/NTLM; Conditional Access policies should require MFA + compliant device for all AVD connections.
- FSLOGIX: profile containers on Azure Files (Premium) or Azure NetApp Files for regulated workloads; cloud cache for multi-site resilience; antivirus exclusions documented to prevent container corruption.
- IMAGE MANAGEMENT: golden images stored in Azure Compute Gallery; update cadence for OS and application patches documented; Defender for Endpoint or equivalent endpoint protection included in image.
- NETWORKING: AVD session hosts in dedicated subnet; NSG rules allowing only AVD management traffic from Microsoft service tags; RDP Shortpath for managed networks (UDP path) documented; no direct internet access from session hosts.
- REGULATED WORKLOADS: for healthcare/EHR use, manifest must document data classification of apps accessed via AVD, session recording requirements, and data exfiltration controls (clipboard/drive redirection policies).

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft AVD certification or regulated-industry remote-access attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- entra-iam-baseline (#14): Entra join strategy overlaps; cross-reference identity foundations
- azure-rbac-architecture (#30): RBAC for AVD admin roles; cross-reference only
- azure-storage-architecture (#25): FSLogix storage backend (Azure Files) overlaps; cross-reference storage security rules
- security-architecture-baseline (#2): endpoint protection themes overlap; AVD adds VDI-specific context
```

---

## Wave 3 — Microsoft Purview Governance (pack #28)

```
PACK_DISPLAY_NAME:   Microsoft Purview Governance
PACK_DESCRIPTION:    Architecture-review baseline for Microsoft Purview unified data governance — catalog scanning, classification, sensitivity labelling, data lineage, information protection policies, DLP rules, and Purview integration with Azure data services. Not a Microsoft data-governance certification.
PACK_CATEGORY:       Data Governance
SLUG:                purview-governance
RULE_PREFIX:         purview-
TARGET_RULE_COUNT:   30
FRAMEWORK_SHORT_NAME: Microsoft Purview

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix              | Theme                                                     | Target rules | Priority skew |
|---------------------|-----------------------------------------------------------|-------------|---------------|
| purview-catalog-    | Data map and catalog (account setup, collections, sources, scanning schedules) | 6 | P0/P1 |
| purview-classify-   | Classification and sensitivity labelling (system vs custom classifiers, labelling policies, auto-labelling) | 6 | P0/P1 |
| purview-lineage-    | Data lineage (lineage API, Purview integration with ADF, Synapse, dbt) | 5 | P1 |
| purview-dlp-        | DLP policy design (endpoint DLP, Teams DLP, SharePoint/OneDrive DLP, DLP alerts) | 6 | P0/P1 |
| purview-infoprot-   | Information protection (MIP labels, encryption, rights management, label inheritance) | 4 | P0/P1 |
| purview-net-        | Purview networking (managed VNet, private endpoints for ingestion, firewall rules) | 3 | P1 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Purview documentation, Microsoft Information Protection documentation, NIST SP 800-188 (De-Identification of Government Datasets — informative reference).

Key themes for rule authoring:
- DATA MAP: Purview data map built on Apache Atlas; collections hierarchy should mirror organisational or data-domain structure; sources registered per environment (dev/test/prod separation); scanning credentials managed via Key Vault or managed identity (no hardcoded credentials).
- CLASSIFICATION: built-in classifiers for PII (GDPR, HIPAA, PCI) supplemented with custom classifiers for business-specific sensitive data; classification scan schedules aligned to data freshness; scan results should feed sensitivity labelling.
- SENSITIVITY LABELS: MIP labels with encryption and visual marking for at-rest and in-transit protection of highly classified data; labels inherited by containers from parent when configured; label consistency between M365 and Azure data services.
- LINEAGE: end-to-end lineage tracked via Purview integration with data movement tools (ADF, Synapse Analytics, dbt via Atlas hook); lineage essential for regulated-data audit trails.
- DLP: DLP policies for Teams, SharePoint, OneDrive, and Exchange to prevent exfiltration; endpoint DLP for regulated devices; DLP alert integration with Sentinel for SOC visibility.
- NETWORKING: Purview managed VNet for scanning sensitive sources without public exposure; private endpoints for Purview ingestion in locked-down environments; firewall rules for catalog API.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft Purview certification or data-governance maturity attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- data-classification-lineage (#16): broad data classification principles; Purview is the Microsoft implementation surface
- azure-storage-architecture (#25): scanning Azure Storage sources; cross-reference storage access controls
- powerbi-fabric-governance (#32): Purview integration with Fabric/Power BI for label propagation; cross-reference
- gdpr-baseline (#5): DLP themes overlap with GDPR; cross-reference, don't duplicate regulatory obligations
```

---

## Wave 3 — Power Platform Governance (pack #31)

```
PACK_DISPLAY_NAME:   Power Platform Governance
PACK_DESCRIPTION:    Architecture-review baseline for Microsoft Power Platform governance — environment strategy, Data Loss Prevention (DLP) policy design, connector governance, Dataverse security model, citizen-developer guardrails, and ALM via solutions. Addresses the shadow-IT and ungoverned-automation risks common in enterprise Power Platform deployments. Not a Microsoft Power Platform certification.
PACK_CATEGORY:       Productivity / Governance
SLUG:                power-platform-governance
RULE_PREFIX:         pp-gov-
TARGET_RULE_COUNT:   35
FRAMEWORK_SHORT_NAME: Power Platform

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Theme                                                             | Target rules | Priority skew |
|------------------|-------------------------------------------------------------------|-------------|---------------|
| pp-gov-env-      | Environment strategy (production/sandbox/developer isolation, environment naming, purpose documentation) | 6 | P0-heavy |
| pp-gov-dlp-      | DLP policy design (connector classification, Business/Non-Business/Blocked groups, tenant vs environment scope) | 8 | P0-heavy |
| pp-gov-conn-     | Connector governance (custom connectors, premium connector approval, guest connector access) | 5 | P0/P1 |
| pp-gov-dataverse-| Dataverse security model (business units, security roles, field-level security, row-level security) | 7 | P0/P1 |
| pp-gov-alm-      | Application lifecycle management (solutions, publisher prefix, source control, pipelines) | 5 | P1/P2 |
| pp-gov-citizen-  | Citizen developer guardrails (CoE Starter Kit, capacity limits, maker onboarding, trial/default environment lockdown) | 4 | P1 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Power Platform admin documentation, Microsoft Power Platform CoE Starter Kit, Microsoft Power Platform adoption best practices.

Key themes for rule authoring:
- ENVIRONMENT STRATEGY: at minimum Production, UAT/Test, and Developer environments; default environment should be locked down (DLP applied, no sensitive connectors); dedicated environments for business-critical flows.
- DLP POLICIES: DLP policies are the primary governance control; all connectors must be classified as Business (work data), Non-Business (personal), or Blocked; tenant-level DLP policy provides the baseline; environment-specific policies can be more restrictive.
- HIGH-RISK CONNECTORS: HTTP, HTTP with Microsoft Entra ID, Custom connectors, and connectors to regulated data sources must be in Business group or Blocked at minimum; SharePoint/Teams/Outlook connectors are Business by default.
- DATAVERSE SECURITY: business units should mirror organisational hierarchy; security roles should follow least-privilege; field-level security for sensitive Dataverse columns (e.g. Social Security Number, medical data); row-level security via predicate-based filters.
- ALM: all production apps/flows should be packaged as solutions; publisher prefix prevents naming conflicts; source control integration (GitHub or Azure DevOps); automated deployment pipelines rather than manual export/import.
- COE: CoE Starter Kit (free Microsoft tool) provides inventory, compliance assessment, and capacity management; manifest should document whether CoE is deployed and in scope.
- DEFAULT ENVIRONMENT: the default environment is accessible to all licensed users; should be treated as a test sandbox with strict DLP preventing data exfiltration.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft Power Platform certification or CoE maturity attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- azure-rbac-architecture (#30): Dataverse admin roles use Microsoft Entra ID groups; cross-reference RBAC design
- purview-governance (#28): DLP and information protection themes overlap; cross-reference Purview DLP
- powerbi-fabric-governance (#32): Power BI is part of the Power Platform family; share environment strategy themes
- data-classification-lineage (#16): Dataverse data classification; cross-reference classification standards
```

---

## Wave 3 — Power BI & Fabric Governance (pack #32)

```
PACK_DISPLAY_NAME:   Power BI & Fabric Governance
PACK_DESCRIPTION:    Architecture-review baseline for Microsoft Power BI and Microsoft Fabric — workspace topology, capacity management (Premium/Fabric), gateway posture, row-level security (RLS) and object-level security (OLS), sensitivity labels, certified dataset governance, and external sharing controls. Not a Microsoft BI certification.
PACK_CATEGORY:       Data / Analytics
SLUG:                powerbi-fabric-governance
RULE_PREFIX:         pbi-
TARGET_RULE_COUNT:   30
FRAMEWORK_SHORT_NAME: Power BI / Fabric

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Theme                                                                  | Target rules | Priority skew |
|------------------|------------------------------------------------------------------------|-------------|---------------|
| pbi-workspace-   | Workspace topology (personal vs shared vs premium workspace, naming, ownership, guest access) | 5 | P0/P1 |
| pbi-capacity-    | Capacity management (Premium / Fabric SKU sizing, autoscale, overload monitoring) | 4 | P1 |
| pbi-gateway-     | Gateway posture (on-premises data gateway HA, cluster, service account, firewall rules) | 5 | P0/P1 |
| pbi-security-    | Data security (RLS, OLS, sensitivity label inheritance, Purview integration, B2B sharing) | 7 | P0-heavy |
| pbi-datasets-    | Dataset governance (certified vs promoted datasets, single source of truth, endorsement, shared semantic models) | 5 | P1/P2 |
| pbi-fabric-      | Microsoft Fabric-specific (Lakehouse, Data Warehouse, Eventhouse, OneLake governance, domain admin) | 4 | P1/P2 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Power BI admin documentation, Microsoft Fabric documentation, Microsoft Power BI security whitepaper.

Key themes for rule authoring:
- WORKSPACE GOVERNANCE: all production reports in shared or Premium workspaces (not personal); workspace admin limited to 2–3 members; workspace naming convention documented; guest user access to workspaces must be explicitly justified.
- RLS / OLS: row-level security required for datasets exposing data from multiple organisational units or tenants; OLS for column-level sensitivity; RLS rules should be tested with test user accounts.
- SENSITIVITY LABELS: MIP sensitivity labels inherited from data sources where Purview integration is active; label must match data classification; labels enforced on exports.
- EXTERNAL SHARING: B2B sharing for external users requires explicit tenant-level enablement; scope of shared content must be documented in manifest; no anonymous (public) sharing of reports containing sensitive data.
- GATEWAY: on-premises gateways in HA cluster (≥ 2 members); gateway service account is a dedicated service account, not a personal account; firewall rules restrict outbound gateway traffic to Power BI service IPs.
- CERTIFIED DATASETS: certified semantic models managed by data owners; endorsement process documented; consumers should use certified models rather than direct-query against source systems.
- FABRIC: OneLake is the Fabric data lake; access controlled via Fabric workspace roles + OneLake shortcut ACLs; domain admin in Fabric admin portal governs multi-domain deployments.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft Power BI or Fabric certification or BI governance maturity attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- purview-governance (#28): label inheritance and DLP overlap; cross-reference Purview integration rules
- power-platform-governance (#31): Power BI is part of Power Platform; share environment context
- data-classification-lineage (#16): dataset lineage and classification; cross-reference
- azure-storage-architecture (#25): OneLake / ADLS Gen2 backend; cross-reference storage security
```

---

## Wave 4 — OWASP ASVS (pack #33)

```
PACK_DISPLAY_NAME:   OWASP Application Security Verification Standard (ASVS)
PACK_DESCRIPTION:    Architecture-review baseline aligned to OWASP ASVS v4.0.3 — the verification-level counterpart to OWASP API Security Top 10. Covers all 14 chapters (V1–V14) at architecture-level evidence: authentication, session, access control, input validation, cryptography, error handling, data protection, communications, malicious code, business logic, files, API, and configuration. Organised by ASVS Level 1/2/3 mapped to P0/P1/P2. Not OWASP certification.
PACK_CATEGORY:       Application Security
SLUG:                owasp-asvs
RULE_PREFIX:         asvs-
TARGET_RULE_COUNT:   50
FRAMEWORK_SHORT_NAME: OWASP ASVS

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix         | Chapter                                              | Target rules | Priority skew |
|----------------|------------------------------------------------------|-------------|---------------|
| asvs-v1-       | V1 Architecture, Design, and Threat Modelling        | 5           | P0-heavy (L1) |
| asvs-v2-       | V2 Authentication                                    | 5           | P0/P1 (L1/L2) |
| asvs-v3-       | V3 Session Management                                | 3           | P0/P1         |
| asvs-v4-       | V4 Access Control                                    | 4           | P0-heavy      |
| asvs-v5-       | V5 Validation, Sanitization and Encoding             | 3           | P0/P1         |
| asvs-v6-       | V6 Stored Cryptography                               | 3           | P0-heavy      |
| asvs-v7-       | V7 Error Handling and Logging                        | 3           | P1            |
| asvs-v8-       | V8 Data Protection                                   | 4           | P0/P1         |
| asvs-v9-       | V9 Communications                                    | 3           | P0-heavy      |
| asvs-v10-      | V10 Malicious Code                                   | 3           | P1            |
| asvs-v11-      | V11 Business Logic                                   | 3           | P1/P2         |
| asvs-v12-      | V12 Files and Resources                              | 3           | P1            |
| asvs-v13-      | V13 API and Web Service                              | 4           | P0/P1         |
| asvs-v14-      | V14 Configuration                                    | 5           | P0/P1         |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: OWASP Application Security Verification Standard v4.0.3 (2021). Chapters V1–V14 define numbered requirements at three levels: L1 (minimum, all apps), L2 (standard, sensitive data), L3 (advanced, critical/high-assurance).

Level → Priority mapping: L1 requirements → P0; L2 requirements → P1; L3 requirements → P2.

Key themes for rule authoring:
- V1 ARCHITECTURE: threat model documented; security architecture documented; component inventory for all trust boundaries.
- V2 AUTHENTICATION: TOTP/FIDO2 for level 2+; breached-password check; credential storage using bcrypt/Argon2; no hardcoded credentials.
- V3 SESSION: session tokens with sufficient entropy; inactivity timeout; session invalidation on logout and privilege change.
- V4 ACCESS CONTROL: least privilege; deny by default; access control enforced server-side; IDOR prevention.
- V5 INPUT VALIDATION: input validation for all untrusted data; output encoding; parameterised queries / ORMs.
- V6 CRYPTOGRAPHY: FIPS-approved or NIST-recommended algorithms; key management documented; no weak algorithms (MD5, SHA-1, DES, RC4).
- V7 LOGGING: security-relevant events logged; logs protected from tampering; no sensitive data in logs.
- V8 DATA PROTECTION: sensitive data classified; data at rest and in transit encrypted; PII minimised.
- V9 COMMUNICATIONS: TLS 1.2+ enforced; certificate pinning for mobile; HSTS headers.
- V13 API: REST/SOAP security headers; GraphQL depth limiting; API authentication (OAuth 2.0 / API keys with expiry).
- V14 CONFIGURATION: security headers (CSP, X-Frame-Options, HSTS); dependency scanning; secrets management; no debug features in production.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not OWASP ASVS certification or formal security verification report."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- owasp-api-top10 (#8): API Top 10 is risk-category oriented; ASVS is verification-level — complementary, not duplicate
- security-architecture-baseline (#2): generic authentication/encryption rules overlap; ASVS adds verification-level depth
- entra-iam-baseline (#14): authentication themes overlap; cross-reference identity foundations
- cis-azure-foundations (#7): configuration hardening overlaps; cross-reference CIS controls
```

---

## Wave 4 — GitHub Engineering Posture (pack #37)

```
PACK_DISPLAY_NAME:   GitHub Engineering Posture
PACK_DESCRIPTION:    Architecture-review baseline for GitHub organisation and repository security posture — branch protection, required reviews, CODEOWNERS, GitHub Advanced Security (GHAS: code scanning / secret scanning / Dependabot), OIDC for deployments, reusable workflows, and organisation-level controls. Distinct from supply-chain SBOM focus; covers the GitHub platform as the development and deployment control surface. Not a GitHub certification.
PACK_CATEGORY:       DevSecOps
SLUG:                github-engineering-posture
RULE_PREFIX:         gh-
TARGET_RULE_COUNT:   30
FRAMEWORK_SHORT_NAME: GitHub

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix         | Theme                                                         | Target rules | Priority skew |
|----------------|---------------------------------------------------------------|-------------|---------------|
| gh-org-        | Organisation controls (SSO enforcement, 2FA requirement, IP allowlist, audit log streaming) | 5 | P0-heavy |
| gh-branch-     | Branch protection (required reviews, status checks, signed commits, linear history, force-push prohibition) | 6 | P0-heavy |
| gh-ghas-       | GitHub Advanced Security (code scanning, secret scanning with push protection, Dependabot alerts + PRs) | 7 | P0/P1 |
| gh-deploy-     | Deployment security (OIDC for cloud deployments, environment protection rules, required reviewers, deployment logs) | 6 | P0/P1 |
| gh-workflow-   | Workflow security (reusable workflows, pinned actions to SHA, GITHUB_TOKEN least privilege, pull_request_target risks) | 6 | P1/P2 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: GitHub documentation (organisation security, branch protection, GHAS, OIDC), CISA and NSA "Defending Continuous Integration/Continuous Delivery (CI/CD) Environments" (2023), SLSA supply chain framework (informative reference).

Key themes for rule authoring:
- ORGANISATION CONTROLS: Entra ID / SAML SSO enforced for all members; 2FA required at org level; IP allowlist for self-hosted runners or sensitive repos; audit log streaming to SIEM (Sentinel) for security events.
- BRANCH PROTECTION: default branch and release branches protected; required review count ≥ 1 (≥ 2 for regulated repos); status checks (CI) must pass; dismiss stale reviews when new commits pushed; force-push and deletion prohibited.
- CODEOWNERS: CODEOWNERS file in repo root defining owners for sensitive paths; combined with required review count means owners must approve changes to owned paths.
- GHAS: code scanning (CodeQL or 3rd party) enabled; secret scanning with push protection enabled (blocks commits containing secrets); Dependabot alerts for known CVEs; Dependabot auto-PRs for patch updates.
- OIDC DEPLOYMENTS: deployments to cloud environments (Azure, AWS, GCP) should use GitHub Actions OIDC rather than long-lived secrets; OIDC subject claims scoped to specific repo + environment + ref to prevent privilege escalation.
- WORKFLOW SECURITY: 3rd-party actions pinned to full commit SHA (not floating tag); GITHUB_TOKEN permissions set to minimum required; pull_request_target with checkout from PR head is a well-known injection risk — document if used and why.
- REUSABLE WORKFLOWS: organisation-level reusable workflows for common security controls (SAST, DAST, dependency scan, sign) reduce duplication and enforce consistency.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not GitHub certification or DevSecOps maturity attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- supply-chain-sbom (#20): SBOM generation via GitHub Actions overlaps; cross-reference, SBOM lives in supply-chain pack
- dora-devsecops (#21): DORA metrics and delivery posture overlap; this pack is GitHub-platform-specific
- defender-for-cloud-architecture (#26): Defender for DevOps integrates with GitHub; cross-reference security findings
- owasp-asvs (#33): SDLC controls in ASVS V1 overlap; cross-reference architecture requirements
```

---

## Wave 5 — MITA — Medicare Information Technology Architecture (pack #35)

```
PACK_DISPLAY_NAME:   MITA — Medicare Information Technology Architecture
PACK_DESCRIPTION:    Architecture-review baseline aligned to CMS MITA 3.0 — the Medicare / Medicaid IT architecture framework for state Medicaid Management Information Systems (MMIS). Covers business architecture (BA), information architecture (IA), and technical architecture (TA) across the seven Medicaid business areas, and maps to MITA maturity levels 1–5. Pairs with ARC-AMPE for comprehensive CMS-programme governance. Not CMS MITA-MECT certification or MMIS certification.
PACK_CATEGORY:       Public Sector / Healthcare
SLUG:                mita-architecture
RULE_PREFIX:         mita-
TARGET_RULE_COUNT:   40
FRAMEWORK_SHORT_NAME: MITA (CMS)

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix          | Theme                                                           | Target rules | Priority skew |
|-----------------|-----------------------------------------------------------------|-------------|---------------|
| mita-ba-        | Business Architecture (seven Medicaid business areas: Member, Provider, Operations, Plan Management, Claims, Care Management, Programme) | 7 | All P0 |
| mita-ia-        | Information Architecture (data entities, interoperability, HL7 FHIR, information exchange standards) | 8 | P0/P1 |
| mita-ta-        | Technical Architecture (service orientation, cloud adoption, API-first, standards compliance) | 8 | P0/P1 |
| mita-maturity-  | Maturity levels 1–5 (architecture evidence for maturity self-assessment) | 7 | P1/P2 |
| mita-interop-   | Interoperability (CMS interoperability rule, FHIR API requirements, payer-to-payer data exchange) | 7 | P0-heavy |
| mita-security-  | Security and privacy alignment (HIPAA, ARC-AMPE cross-reference, data use agreements) | 3 | P0 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: CMS MITA 3.0 Framework (https://www.medicaid.gov/medicaid/data-and-systems/mita/index.html), CMS Interoperability and Patient Access Final Rule (CMS-9115-F), HL7 FHIR R4.

Key themes for rule authoring:
- SEVEN BUSINESS AREAS: Member management, Provider management, Managed care operations / plan management, Claims processing, Care management, Programme integrity, Programme operations. Each has defined MITA business processes.
- INFORMATION ARCHITECTURE: data entities aligned to MITA IE (Information Exchange) standards; HL7 FHIR R4 APIs for patient access and payer-to-payer exchange; NDC / ICD-10 / CPT code systems documented.
- TECHNICAL ARCHITECTURE: SOA/microservices-oriented; APIs exposing MITA services documented; cloud-native deployment on FedRAMP-authorised platforms; API gateway for Medicaid services.
- MITA MATURITY: maturity levels 1–5 (1 = ad-hoc, 5 = optimised); evidence for maturity claims must be in the architecture manifest; self-assessment must map specific manifest artefacts to maturity dimensions.
- INTEROPERABILITY: CMS interoperability rule requires FHIR-based Patient Access API and Provider Directory API; payer-to-payer data exchange via FHIR; manifest must document API endpoints, authentication (SMART on FHIR), and data retention.
- SECURITY ALIGNMENT: ARC-AMPE (#24) covers the security control surface; MITA pack covers the architecture alignment — cross-reference rather than duplicate security rules.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not CMS MITA-MECT certification, MMIS certification, or Medicaid programme compliance attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- arc-ampe-architecture-themes (#24): ARC-AMPE covers security controls; MITA covers business/info/technical architecture — complementary
- hipaa-architecture (#11): HIPAA PHI safeguards; cross-reference for data privacy obligations
- azure-caf-landing-zone (#4): cloud platform for MMIS; cross-reference landing zone for public sector
- data-classification-lineage (#16): MITA IA data entities and lineage; cross-reference
```

---

## Wave 5 — Snowflake Platform Governance (pack #34)

```
PACK_DISPLAY_NAME:   Snowflake Platform Governance
PACK_DESCRIPTION:    Architecture-review baseline for Snowflake cloud data platform — account and role hierarchy, network policy and private connectivity, data masking and row-access policies, multi-cluster warehouse sizing, replication and failover, Tri-Secret Secure (customer-managed keys), and cost governance. First cross-cloud pack: reflects ArchLucid's platform-agnostic data governance scope. Not a Snowflake certification.
PACK_CATEGORY:       Data Platform
SLUG:                snowflake-platform-governance
RULE_PREFIX:         snow-
TARGET_RULE_COUNT:   30
FRAMEWORK_SHORT_NAME: Snowflake

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix          | Theme                                                          | Target rules | Priority skew |
|-----------------|----------------------------------------------------------------|-------------|---------------|
| snow-iam-       | Account and role hierarchy (ACCOUNTADMIN / SYSADMIN / SECURITYADMIN separation, custom roles, SCIM provisioning) | 6 | P0-heavy |
| snow-net-       | Network policy and private connectivity (network policies, Snowflake Private Link, IP allowlisting) | 5 | P0-heavy |
| snow-data-      | Data security (dynamic data masking, row-access policies, column-level security, Tri-Secret Secure / CMK) | 7 | P0/P1 |
| snow-ha-        | Replication and business continuity (database replication, failover groups, Business Continuity Plan) | 4 | P1 |
| snow-cost-      | Cost governance (warehouse auto-suspend/auto-resume, multi-cluster warehouse scaling policy, query acceleration, credit monitoring) | 5 | P1/P2 |
| snow-observe-   | Observability (Query History, ACCESS_HISTORY, DATA_TRANSFER_HISTORY, audit logging via Snowflake-provided event tables) | 3 | P1 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Snowflake documentation (security guide, governance guide, cost optimisation guide), Snowflake CIS Benchmark (if available), NIST SP 800-53 R5 (for control mapping where applicable).

Key themes for rule authoring:
- ROLE HIERARCHY: ACCOUNTADMIN should have ≤ 2 members and MFA required; SYSADMIN for object creation; SECURITYADMIN for users/roles; custom roles follow principle of least privilege; service accounts use dedicated roles, not ACCOUNTADMIN.
- NETWORK POLICIES: network policies restrict inbound IP ranges; Snowflake Private Link (AWS PrivateLink / Azure Private Link / GCP Private Service Connect) for enterprise connectivity; no broad 0.0.0.0/0 policies in production.
- DATA MASKING: dynamic data masking policies applied to PII/sensitive columns; row-access policies for row-level security; column-level security via secure views or masking policies; masking policy governance (who can see unmasked data, audit trail).
- TRI-SECRET SECURE: customer-managed encryption keys via AWS KMS / Azure Key Vault / GCP KMS; Tri-Secret Secure requires both Snowflake-managed key and customer-managed key; relevant for regulated data requirements.
- REPLICATION: database replication for cross-region DR; failover groups for business continuity; RPO/RTO documented.
- COST: warehouses must have auto-suspend enabled (max 10 minutes for analytics, 1 minute for infrequent); multi-cluster for concurrency; credit budgets and alerting via Snowflake Resource Monitors.
- NOTE FOR RULE AUTHORS: evidence hints for Snowflake rules will necessarily rely on narrative fields (metadata.ChangeDescription, governance.PolicyConstraints) and services[].Tags since ArchLucid does not have a Snowflake extractor. Evidence hints should focus on what an architect would document in the manifest narrative rather than structured extractor fields.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Snowflake certification or cloud data platform compliance attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- azure-data-layer-security (#23): Azure SQL/Cosmos DB data layer; Snowflake is a distinct cross-cloud platform
- data-classification-lineage (#16): data governance overlap; cross-reference classification standards
- azure-storage-architecture (#25): staging/landing zone data flows into Snowflake; cross-reference storage security
- cis-azure-foundations (#7): Azure-side controls for Snowflake data integration paths; cross-reference only
```

---

## Wave 5 — Azure Monitor & Alerting Architecture (pack #38)

```
PACK_DISPLAY_NAME:   Azure Monitor & Alerting Architecture
PACK_DESCRIPTION:    Architecture-review baseline for Azure Monitor platform design — Log Analytics workspace strategy, diagnostic settings coverage, metric alerts and log alerts, action groups and notification routing, Azure Monitor Private Link Scope (AMPLS), and dashboards / workbooks. Complements the OpenTelemetry instrumentation baseline (pack #22), which covers application-layer observability. Not a Microsoft monitoring certification.
PACK_CATEGORY:       Operations
SLUG:                azure-monitor-alerting
RULE_PREFIX:         az-mon-
TARGET_RULE_COUNT:   30
FRAMEWORK_SHORT_NAME: Azure Monitor

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Theme                                                           | Target rules | Priority skew |
|------------------|-----------------------------------------------------------------|-------------|---------------|
| az-mon-workspace-| Log Analytics workspace strategy (single vs regional, data retention, commitment tiers, access control) | 6 | P0/P1 |
| az-mon-diag-     | Diagnostic settings coverage (all resource types with diagnostic settings enabled, category selection, destination) | 6 | P0-heavy |
| az-mon-alerts-   | Alert rules (metric alert vs log alert selection, alert severity, action groups, suppression rules) | 7 | P0/P1 |
| az-mon-action-   | Action groups and notification routing (email, ITSM, webhook, Logic App, runbook) | 4 | P1 |
| az-mon-ampls-    | Azure Monitor Private Link Scope (AMPLS for isolated monitoring traffic, private DNS, workspace linking) | 4 | P1 |
| az-mon-dash-     | Dashboards and workbooks (shared dashboards, workbook templates, Azure Managed Grafana) | 3 | P1/P2 |

SOURCE FRAMEWORK SUMMARY:
Authoritative sources: Microsoft Azure Monitor documentation, Azure Well-Architected Framework (Operational Excellence and Reliability pillars), Microsoft MCSB Logging and Threat Detection controls.

Key themes for rule authoring:
- WORKSPACE STRATEGY: centralised Log Analytics workspace for most tenants; regional workspaces for data residency; data retention: interactive (90 days default), archive (up to 7 years); commitment tiers for high ingestion volume.
- DIAGNOSTIC SETTINGS: every Azure resource should have diagnostic settings configured; categories selected (administrative, security, service health, alert, policy, autoscale, resource logs); destinations: Log Analytics, storage account (long-term), Event Hub (streaming to SIEM).
- ALERT RULES: metric alerts for resource-level signals (CPU, memory, latency); log alerts for security and compliance signals; alert severity (0–4) must be documented; smart detection / dynamic thresholds for baselines.
- ACTION GROUPS: action groups should be environment-scoped (prod vs non-prod); ITSM connector for ticket creation; runbook automation for known remediations; on-call webhook for paging.
- AMPLS: Azure Monitor Private Link Scope isolates monitoring traffic from public internet; required for environments where all traffic must traverse private network; private DNS zones for OMS, ODS, agentsvc, blob endpoints.
- RELATIONSHIP WITH SENTINEL: Sentinel workspace is a Log Analytics workspace; Sentinel ingestion is separate from Monitor diagnostic settings in cost model; avoid duplicating security logs between both.
- RELATIONSHIP WITH OTEL PACK (#22): OTel covers Application Insights / SDK instrumentation; Azure Monitor pack covers platform-level infrastructure monitoring.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft Azure Monitor certification or SRE maturity attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- observability-otel (#22): OTel is application instrumentation; Azure Monitor is platform infrastructure monitoring — complementary
- sentinel-soc-architecture (#27): Sentinel ingests from Log Analytics; cross-reference SIEM connectivity
- azure-resiliency-dr (#14): reliability alerting overlaps; cross-reference without duplicating availability rules
- defender-for-cloud-architecture (#26): Defender uses Log Analytics; cross-reference agent and workspace settings
```

---

## AI Pack Wave — 20 AI-Oriented Packs (priority tier A first)

---

## AI-01 — OWASP Top 10 for LLM Applications

```
PACK_DISPLAY_NAME:   OWASP Top 10 for LLM Applications
PACK_DESCRIPTION:    Architecture-review posture mapped to OWASP Top 10 for LLM Applications v1.1 (OWASP GenAI Security Project, 2025). Covers LLM01 Prompt Injection, LLM02 Insecure Output Handling, LLM03 Training Data Poisoning, LLM04 Model Denial of Service, LLM05 Supply-Chain Vulnerabilities, LLM06 Sensitive Information Disclosure, LLM07 Insecure Plugin Design, LLM08 Excessive Agency, LLM09 Overreliance, and LLM10 Model Theft. Not OWASP certification or penetration-test findings.
PACK_CATEGORY:       Application Security
SLUG:                owasp-llm-top10
RULE_PREFIX:         owasp-llm-
TARGET_RULE_COUNT:   31
FRAMEWORK_SHORT_NAME: OWASP LLM Top 10 v1.1

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix          | OWASP risk                         | Target rules | Priority skew |
|-----------------|------------------------------------|-------------|---------------|
| owasp-llm-01-   | LLM01 Prompt Injection             | 4           | P0-heavy      |
| owasp-llm-02-   | LLM02 Insecure Output Handling     | 3           | P0/P1         |
| owasp-llm-03-   | LLM03 Training Data Poisoning      | 3           | P0/P1         |
| owasp-llm-04-   | LLM04 Model Denial of Service      | 3           | P0/P1         |
| owasp-llm-05-   | LLM05 Supply-Chain Vulnerabilities | 3           | P0/P1         |
| owasp-llm-06-   | LLM06 Sensitive Information Disclosure | 3       | P0-heavy      |
| owasp-llm-07-   | LLM07 Insecure Plugin Design       | 3           | P0/P1         |
| owasp-llm-08-   | LLM08 Excessive Agency             | 3           | P0-heavy      |
| owasp-llm-09-   | LLM09 Overreliance                 | 3           | P1/P2         |
| owasp-llm-10-   | LLM10 Model Theft                  | 3           | P1/P2         |

SOURCE FRAMEWORK SUMMARY:
Authoritative source: OWASP Top 10 for LLM Applications v1.1 (OWASP GenAI Security Project, 2025). Rules describe architecture posture — not runtime detection.

Key themes for rule authoring:
- PROMPT INJECTION (LLM01): Input validation boundary documentation, prompt construction patterns, system prompt isolation from user-supplied data, indirect injection via retrieved documents.
- INSECURE OUTPUT HANDLING (LLM02): Output sanitisation before rendering in UI, command injection via LLM output, SSRF via LLM-generated URLs.
- TRAINING DATA POISONING (LLM03): Training data access control, data integrity verification, fine-tune supply chain.
- MODEL DENIAL OF SERVICE (LLM04): Token limit enforcement, concurrent request limits, recursive prompt protection.
- SUPPLY-CHAIN VULNERABILITIES (LLM05): Model dependency pinning, third-party plugin audit, model provenance.
- SENSITIVE INFO DISCLOSURE (LLM06): PII in training data, system prompt exfiltration prevention, model memorisation design.
- INSECURE PLUGIN DESIGN (LLM07): Plugin authority scope, plugin input validation, plugin auth.
- EXCESSIVE AGENCY (LLM08): Tool authority documentation, destructive-action approval gates, blast-radius documentation.
- OVERRELIANCE (LLM09): Grounding and citation documentation, human-review trigger design, overreliance disclaimer.
- MODEL THEFT (LLM10): Model access control, API rate limiting for extraction prevention, model weight protection.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not OWASP certification, penetration-test findings, or runtime security validation."

ADJACENT PACKS (do not duplicate):
- agentic-ai-mcp (AI-06): LLM07/plugin rules cross-reference agentic tool-use
- ai-governance-responsible-ai (#1): general RAI themes; do not duplicate model ownership rules
- owasp-api-top10 (#8): REST/GraphQL surface; distinct from LLM surface
```

---

## AI-02 — ISO/IEC 42001 AI Management System

```
PACK_DISPLAY_NAME:   ISO/IEC 42001 — AI Management System Architecture Themes
PACK_DESCRIPTION:    Architecture-review themes aligned to ISO/IEC 42001:2023 — the ISO standard for AI Management Systems. Covers normative Clauses 4–10 (context, leadership, planning, operation, performance evaluation, improvement) and Annex A controls A.2–A.9 (AI policy, lifecycle, data for AI, transparency, third-party). Not ISO certification, accredited conformity assessment, or auditor opinion.
PACK_CATEGORY:       Compliance
SLUG:                iso-42001-aims
RULE_PREFIX:         iso-42001-
TARGET_RULE_COUNT:   50
FRAMEWORK_SHORT_NAME: ISO/IEC 42001:2023

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix            | Theme                                                                     | Target rules | Priority skew |
|-------------------|---------------------------------------------------------------------------|-------------|---------------|
| iso-42001-ctx-    | Clause 4 — Context (AI system scope, stakeholders, risk context)          | 4           | All P0        |
| iso-42001-lead-   | Clause 5 — Leadership (AI policy, roles, responsibilities)                | 4           | All P0        |
| iso-42001-plan-   | Clause 6 — Planning (risk/opportunity, AI system impact assessment)       | 5           | P0/P1         |
| iso-42001-ops-    | Clause 8 — Operation (AI system lifecycle: design, data, testing, deploy) | 8           | P0/P1         |
| iso-42001-eval-   | Clause 9 — Performance evaluation (monitoring, internal audit themes)     | 5           | P1            |
| iso-42001-anx-a-  | Annex A controls A.2–A.9                                                  | 20          | Mixed P0/P1/P2|
| iso-42001-anx-b-  | Annex B — AI system impact categories                                     | 4           | P2            |

SOURCE FRAMEWORK SUMMARY:
Authoritative source: ISO/IEC 42001:2023. Rules cite clause/control ID and brief intent without reproducing normative text.

Key themes for rule authoring:
- CLAUSE 4/5: AI system scope definition, stakeholder analysis, AI policy statement documented in manifest metadata.
- CLAUSE 6: AI system impact assessment documented, risk and opportunity treatment plans referenced.
- CLAUSE 8: AI system design documented, training data quality evidence, testing evidence before deployment.
- ANNEX A.2: AI policies for purpose, objectives, responsibilities.
- ANNEX A.6: AI system lifecycle process coverage (data acquisition, design, development, testing, deployment, monitoring, decommission).
- ANNEX A.7: Data for AI — data quality, data management, dataset documentation.
- ANNEX A.8: Information for interested parties — transparency and disclosure.
- ANNEX A.9: Third-party and customer AI relationships — vendor AI governance requirements.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not ISO/IEC 42001 certification, accredited conformity assessment, or auditor opinion."

ADJACENT PACKS (do not duplicate):
- ai-governance-responsible-ai (#1): general RAI cross-cutting themes
- eu-ai-act-high-risk (AI-04): EU regulatory complement
- nist-ai-600-1-genai (AI-07): US GenAI risk profile complement
```

---

## AI-03 — Azure OpenAI / AI Foundry Architecture

```
PACK_DISPLAY_NAME:   Azure OpenAI & AI Foundry Architecture
PACK_DESCRIPTION:    Architecture-review posture for Azure OpenAI Service and Azure AI Foundry deployments. Covers private networking (private endpoints, no public access for production), encryption (CMK, BYOK for fine-tune storage), Entra ID authentication, content safety policy documentation, PTU/PAYG deployment design, regional data residency, fine-tuning data isolation, AI Foundry hub/project topology, AI Foundry agent service tool registry, and monitoring. Not Microsoft certification or Azure OpenAI Service Terms compliance.
PACK_CATEGORY:       Azure Platform
SLUG:                azure-openai-foundry
RULE_PREFIX:         az-oai- and az-foundry-
TARGET_RULE_COUNT:   43
FRAMEWORK_SHORT_NAME: Azure OpenAI / AI Foundry

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix            | Theme                                                                           | Target rules | Priority skew |
|-------------------|---------------------------------------------------------------------------------|-------------|---------------|
| az-oai-net-       | Private networking (private endpoint, VNet integration, no public access)       | 5           | All P0        |
| az-oai-enc-       | Encryption (CMK, double encryption, BYOK for fine-tune)                         | 4           | P0-heavy      |
| az-oai-auth-      | Authentication (Entra ID / managed identity, key rotation)                      | 4           | P0-heavy      |
| az-oai-content-   | Content safety (filter policy, abuse monitoring, jailbreak shield)              | 5           | P0/P1         |
| az-oai-ptu-       | Provisioned throughput (PTU deployment, PAYG fallback, capacity reservation)    | 4           | P1            |
| az-oai-residency- | Regional data residency (EU boundary, US-only, model region pinning)           | 4           | P0-heavy      |
| az-oai-ft-        | Fine-tuning data isolation (storage isolation, training data access control)    | 3           | P0/P1         |
| az-foundry-hub-   | AI Foundry hub/project topology (hierarchy, managed VNet, connections)          | 5           | P0/P1         |
| az-foundry-agent- | AI Foundry agent service (tool registry, connection scope, agent identity)      | 5           | P0/P1         |
| az-foundry-mon-   | Monitoring (diagnostic settings, token usage metrics, latency alerting)         | 4           | P1            |

SOURCE FRAMEWORK SUMMARY:
Sources: Microsoft Azure OpenAI Service docs, Azure AI Foundry docs, Microsoft Cloud Security Benchmark (MCSB) AI workload controls, Azure Well-Architected Framework AI workload guidance.

Key themes for rule authoring:
- PRIVATE NETWORKING: Azure OpenAI account must have public access disabled in production; private DNS zone for cognitiveservices.azure.com; VNet integration for outbound connections.
- ENCRYPTION: CMK via Azure Key Vault for both Azure OpenAI and AI Foundry; double encryption for fine-tune training data storage.
- CONTENT SAFETY: Content filter policy documented in manifest; abuse monitoring opt-in; jailbreak shield (Prompt Shields) enabled.
- AI FOUNDRY HUB: Hub-project hierarchy; managed VNet for hub; connections use managed identity not stored credentials.
- AI FOUNDRY AGENT: Tool connections scoped to project; agent identity via Entra managed identity; tool registry documented in services[].
- DATA RESIDENCY: Model deployment region must match data residency policy; cross-geo inference must be explicitly documented and justified.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft certification or Azure OpenAI Service Terms compliance validation."

ADJACENT PACKS (do not duplicate):
- agentic-ai-mcp (AI-06): tool-use / plugin governance at the architecture pattern level
- ai-training-data-provenance (AI-15): fine-tune data lineage and consent
- entra-iam-baseline (#14): Entra ID / managed identity general rules
```

---

## AI-04 — EU AI Act High-Risk AI Architecture

```
PACK_DISPLAY_NAME:   EU AI Act — High-Risk AI Architecture Themes
PACK_DESCRIPTION:    Architecture-review themes for EU AI Act (Regulation EU 2024/1689) high-risk AI obligations. Covers Articles 9–16 (provider obligations: risk management system, data governance, technical documentation, logging, transparency, human oversight, accuracy/robustness) and Article 26 (deployer obligations). Conditionally framed for systems designated high-risk under Annex II/III. Not EU AI Act conformity assessment, notified body certification, CE marking authority, or legal classification.
PACK_CATEGORY:       Compliance
SLUG:                eu-ai-act-high-risk
RULE_PREFIX:         eu-ai-act-
TARGET_RULE_COUNT:   46
FRAMEWORK_SHORT_NAME: EU AI Act (Regulation EU 2024/1689)

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix              | Article | Theme                                         | Target rules | Priority skew |
|---------------------|---------|-----------------------------------------------|-------------|---------------|
| eu-ai-act-art9-     | Art. 9  | Risk management system                        | 5           | All P0        |
| eu-ai-act-art10-    | Art. 10 | Data and data governance                      | 6           | P0-heavy      |
| eu-ai-act-art11-    | Art. 11 | Technical documentation                       | 5           | P0/P1         |
| eu-ai-act-art12-    | Art. 12 | Record-keeping and logging                    | 4           | P0/P1         |
| eu-ai-act-art13-    | Art. 13 | Transparency (information to deployers)       | 4           | P1            |
| eu-ai-act-art14-    | Art. 14 | Human oversight                               | 5           | P0/P1         |
| eu-ai-act-art15-    | Art. 15 | Accuracy, robustness, cybersecurity           | 5           | P1            |
| eu-ai-act-art26-    | Art. 26 | Deployer obligations                          | 4           | P1/P2         |
| eu-ai-act-annex3-   | Annex III | High-risk category self-identification      | 5           | P1/P2         |
| eu-ai-act-fria-     | Art. 27 | Fundamental Rights Impact Assessment          | 3           | All P2        |

SOURCE FRAMEWORK SUMMARY:
Source: Regulation (EU) 2024/1689. High-risk AI obligations apply from August 2, 2026.

Key themes for rule authoring:
- ART. 9: Risk management system documented, risk-assessment process designed, residual risk acceptance recorded.
- ART. 10: Training/validation/test data separation; data quality criteria documented; bias assessment for protected attributes.
- ART. 11: Technical documentation present covering model purpose, architecture, training, testing, expected performance, limitations.
- ART. 12: Automatic logging of system operation (input, output, datetime, version); logs retained per regulatory requirement.
- ART. 14: Human oversight mechanism designed: intervention point documented, override capability described.
- ART. 15: Accuracy metrics documented; adversarial robustness testing evidence; cybersecurity posture aligned to Art. 42.
- ALL RULES: Conditional framing — "If this system is deployed as high-risk under EU AI Act Annex III/II..."

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not EU AI Act conformity assessment, notified body certification, CE marking authority, or legal classification."

ADJACENT PACKS (do not duplicate):
- iso-42001-aims (AI-02): AI management system governance complement
- nist-ai-600-1-genai (AI-07): US regulatory counterpart
- gdpr-baseline (#5): data protection rules; Art. 10 data governance cross-references GDPR but does not duplicate
```

---

## AI-05 — RAG Architecture Governance

```
PACK_DISPLAY_NAME:   RAG Architecture Governance
PACK_DESCRIPTION:    Architecture-review posture for Retrieval-Augmented Generation (RAG) systems. Covers knowledge source governance (inventory, classification, access control, freshness), embedding pipeline (model governance, chunking, PII in embeddings), vector store security (auth, encryption, private endpoint, tenant isolation), retrieval layer (auth propagation, scope limits), grounding and citation (provenance, attribution design), content filter chain (pre/post-retrieval and post-generation), and knowledge freshness policy. Not certification of RAG output accuracy or grounding guarantee.
PACK_CATEGORY:       AI Governance
SLUG:                rag-architecture
RULE_PREFIX:         rag-
TARGET_RULE_COUNT:   34
FRAMEWORK_SHORT_NAME: RAG Architecture

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix          | Theme                                                            | Target rules | Priority skew |
|-----------------|------------------------------------------------------------------|-------------|---------------|
| rag-src-        | Knowledge source governance (inventory, classification, freshness policy) | 6   | P0-heavy      |
| rag-embed-      | Embedding pipeline (model governance, chunking, PII, versioning) | 5           | P0/P1         |
| rag-vecstore-   | Vector store security (auth, encryption, private endpoint, tenant isolation) | 5  | P0-heavy      |
| rag-retrieval-  | Retrieval layer (auth context propagation, scope limits, result filtering) | 5 | P0/P1         |
| rag-grounding-  | Grounding and citation (provenance, hallucination-reduction design) | 5         | P1            |
| rag-filter-     | Content filter chain (pre/post-retrieval, post-generation)       | 4           | P0/P1         |
| rag-freshness-  | Knowledge freshness (re-indexing policy, stale-document TTL)     | 4           | P1/P2         |

SOURCE FRAMEWORK SUMMARY:
Sources: Microsoft RAG reference architecture (Azure AI Search + Azure OpenAI), OWASP LLM Top 10 v1.1 (LLM05, LLM06, LLM09), NIST AI 600-1 §GAI-9.

Key themes for rule authoring:
- KNOWLEDGE SOURCE: All knowledge sources must be inventoried in datastores[]; sources containing PII/PHI must be classified with access controls documented.
- EMBEDDING PIPELINE: Embedding model must be versioned and change-controlled; PII in documents must be detected and handled before embedding.
- VECTOR STORE: Private endpoint required for production; per-tenant index isolation or namespace separation for multi-tenant; CMK or service-managed encryption.
- RETRIEVAL AUTH: User's access context must be propagated to the retrieval layer so retrieved chunks respect the user's document ACL (no retrieving documents the user cannot read).
- GROUNDING: Citation provenance must be documented in the architecture (source document ID, chunk ID, retrieval timestamp).
- FILTER CHAIN: Content filters applied at: (1) user query before retrieval, (2) retrieved chunks before prompt injection, (3) LLM response before display.
- FRESHNESS: Stale knowledge (documents older than TTL) must be flagged in retrieval or excluded; re-indexing cadence documented.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not certification of RAG output accuracy or grounding guarantee."

ADJACENT PACKS (do not duplicate):
- owasp-llm-top10 (AI-01): LLM09 overreliance cross-reference
- agentic-ai-mcp (AI-06): agentic RAG boundary (tool-call retrieval)
- llm-observability-evals (AI-10): eval harness for grounding quality
```

---

## AI-06 — Agentic AI & Tool-Use Governance

```
PACK_DISPLAY_NAME:   Agentic AI & Tool-Use Governance
PACK_DESCRIPTION:    Architecture-review posture for agentic AI systems where LLMs autonomously invoke tools, call APIs, execute code, or orchestrate multi-step workflows. Covers MCP server inventory, tool authentication, authority bounds (least-privilege, destructive-action approval), sandbox isolation, human-in-loop gates, action audit trails, and blast-radius containment. Not safety certification of autonomous AI agents.
PACK_CATEGORY:       AI Governance
SLUG:                agentic-ai-mcp
RULE_PREFIX:         agent-
TARGET_RULE_COUNT:   33
FRAMEWORK_SHORT_NAME: Agentic AI / MCP

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Theme                                                               | Target rules | Priority skew |
|------------------|---------------------------------------------------------------------|-------------|---------------|
| agent-registry-  | Tool / MCP server inventory (all tools enumerated, purpose, version pinned) | 5   | All P0        |
| agent-auth-      | Tool authentication (managed identity / credential-store, no hardcoded secrets) | 4 | P0-heavy      |
| agent-bounds-    | Authority bounds (least-privilege scope, read-before-write, destructive approval) | 6 | P0-heavy      |
| agent-sandbox-   | Sandbox isolation (code execution container, no host network access) | 4           | P0/P1         |
| agent-gate-      | Human-in-loop gates (approval workflow, confidence threshold, time-bound autonomy) | 5 | P0/P1         |
| agent-audit-     | Action audit trail (tool invocation log, inputs/outputs, session correlation) | 5  | P0/P1         |
| agent-blast-     | Blast-radius containment (failure isolation, rollback capability)   | 4           | P1            |

SOURCE FRAMEWORK SUMMARY:
Sources: OWASP LLM08 (Excessive Agency), NIST AI 600-1 §GAI-6 (Human-AI Configuration), Anthropic MCP Specification (2025), Azure AI Foundry Agent Service docs.

Key themes for rule authoring:
- TOOL REGISTRY: Every MCP server or tool connection must appear as a services[] entry with ServiceName, Purpose, version, and authority scope documented.
- TOOL AUTH: No tool connection may use hardcoded credentials; all connections must reference Key Vault or use managed identity.
- AUTHORITY BOUNDS: Each tool must have an explicitly bounded permission scope; write operations require narrower scope than reads; destructive operations (delete, send email, execute code) require documented approval gate.
- SANDBOX: Code execution must occur in an isolated container with no access to host filesystem or network outside documented scope.
- HUMAN GATES: High-impact actions (financial, infrastructure change, communication) require human approval before execution.
- AUDIT: Every tool invocation logged with agent session ID, tool name, input hash, output hash, timestamp, latency.
- BLAST-RADIUS: Agent failure must not cascade to unrelated systems; isolation boundary documented.

DISCLAIMER TEXT:
"Architecture-review mapping for agentic AI posture; not safety certification of autonomous AI agents or guarantee of bounded agent behaviour."

ADJACENT PACKS (do not duplicate):
- owasp-llm-top10 (AI-01): LLM07 (plugin) and LLM08 (excessive agency) cross-reference
- azure-openai-foundry (AI-03): Foundry agent connections (do not duplicate networking rules)
- multi-agent-orchestration (AI-19): supervisor topology (this pack is single-agent tool-use)
```

---

## AI-07 — NIST AI 600-1 Generative AI Profile

```
PACK_DISPLAY_NAME:   NIST AI 600-1 — Generative AI Risk Profile
PACK_DESCRIPTION:    Architecture-review posture aligned to NIST AI 600-1 (July 2024) — the US NIST Generative AI Profile mapping 12 GenAI-specific risks to the NIST AI RMF Govern/Map/Measure/Manage framework. Covers: CBRN Information, Confabulation, Data Privacy, Data Poisoning, Homogenisation, Human-AI Configuration, Information Integrity, Information Security, Intellectual Property, ODA Content, Societal Impacts, and Value Chain / Component Integration. Not NIST endorsement or formal AI risk assessment.
PACK_CATEGORY:       Compliance
SLUG:                nist-ai-600-1-genai
RULE_PREFIX:         nist-ai-600-
TARGET_RULE_COUNT:   35
FRAMEWORK_SHORT_NAME: NIST AI 600-1

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix               | GAI Risk                              | Target rules | Priority skew |
|----------------------|---------------------------------------|-------------|---------------|
| nist-ai-600-gai1-    | CBRN Information                      | 2           | P2            |
| nist-ai-600-gai2-    | Confabulation                         | 4           | P0/P1         |
| nist-ai-600-gai3-    | Data Privacy                          | 4           | P0-heavy      |
| nist-ai-600-gai4-    | Data Poisoning                        | 3           | P0/P1         |
| nist-ai-600-gai5-    | Homogenisation                        | 2           | P1/P2         |
| nist-ai-600-gai6-    | Human-AI Configuration                | 3           | P0/P1         |
| nist-ai-600-gai7-    | Information Integrity                 | 3           | P0/P1         |
| nist-ai-600-gai8-    | Information Security                  | 4           | P0-heavy      |
| nist-ai-600-gai9-    | Intellectual Property                 | 3           | P1            |
| nist-ai-600-gai10-   | ODA Content                           | 2           | P1/P2         |
| nist-ai-600-gai11-   | Societal Impacts                      | 2           | P2            |
| nist-ai-600-gai12-   | Value Chain / Component Integration   | 3           | P0/P1         |

SOURCE FRAMEWORK SUMMARY:
Source: NIST AI 600-1 (July 2024). Cite GAI risk number and name; map to RMF function (Govern/Map/Measure/Manage) and suggested action ID.

Key themes for rule authoring:
- GAI-2 CONFABULATION: Grounding and citation policy documented; confabulation rate measurement design described (eval harness reference).
- GAI-3 DATA PRIVACY: PII detection at prompt boundary documented; no-train contractual posture; GDPR erasure-from-training design.
- GAI-4 DATA POISONING: Training data integrity controls; provenance documentation; access control on training pipeline.
- GAI-6 HUMAN-AI: Disclosure of AI involvement to end users; human review trigger design; override capability.
- GAI-8 INFORMATION SECURITY: Model access control; output restriction policy; adversarial input handling.
- GAI-12 VALUE CHAIN: Third-party model provenance; SBOM for AI dependencies; vendor AI governance requirements.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not NIST endorsement or formal risk assessment under NIST AI 600-1."

ADJACENT PACKS (do not duplicate):
- ai-governance-responsible-ai (#1): NIST AI RMF v1.0 cross-cutting themes
- eu-ai-act-high-risk (AI-04): EU regulatory counterpart
- ai-public-sector-us (AI-13): OMB M-24-10 federal alignment
```

---

## AI-08 — AI Gateway / LLM Reverse-Proxy Architecture

```
PACK_DISPLAY_NAME:   AI Gateway / LLM Reverse-Proxy Architecture
PACK_DESCRIPTION:    Architecture-review posture for the AI gateway layer — the reverse-proxy / policy-enforcement layer between consuming applications and LLM backends. Covers gateway placement (private endpoint, no direct backend exposure), gateway authentication (Entra ID / managed identity for backend, API key governance for consumers), token-limit policies, model routing (primary/fallback, PTU/PAYG, circuit-breaker), semantic caching (cache key design, TTL, PII bypass, multi-tenant isolation), content safety at gateway, and multi-tenant isolation. Not certification of gateway performance.
PACK_CATEGORY:       Azure Platform
SLUG:                ai-gateway
RULE_PREFIX:         ai-gw-
TARGET_RULE_COUNT:   29
FRAMEWORK_SHORT_NAME: AI Gateway (APIM / LiteLLM / Kong)

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix          | Theme                                                                | Target rules | Priority skew |
|-----------------|----------------------------------------------------------------------|-------------|---------------|
| ai-gw-net-      | Gateway placement (private endpoint, no direct backend exposure)     | 4           | All P0        |
| ai-gw-auth-     | Gateway authentication (Entra / MI for backend, API key governance) | 4           | P0-heavy      |
| ai-gw-token-    | Token-limit policies (per-consumer limits, rate limiting, burst)     | 5           | P0/P1         |
| ai-gw-route-    | Model routing (primary/fallback, PTU vs PAYG, circuit-breaker)       | 4           | P1            |
| ai-gw-cache-    | Semantic caching (cache key, TTL, PII bypass, tenant isolation)      | 4           | P1            |
| ai-gw-safety-   | Content safety at gateway (jailbreak detection, prompt inspection)   | 4           | P0/P1         |
| ai-gw-isolation-| Multi-tenant isolation (per-tenant token budget, credentials, correlation) | 4       | P0-heavy      |

SOURCE FRAMEWORK SUMMARY:
Sources: Microsoft APIM AI Gateway documentation; LiteLLM proxy docs; CNCF AI Gateway Working Group.

Key themes for rule authoring:
- GATEWAY PLACEMENT: Gateway must be deployed with a private endpoint to the LLM backend; consuming applications must connect to the gateway, not directly to the LLM endpoint.
- GATEWAY AUTH: Backend connection uses managed identity or certificate; consumer API keys rotated on schedule; no static shared API key for all consumers.
- TOKEN LIMITS: Per-consumer token-per-minute limit documented; burst protection configured; response returns 429 with retry-after header on limit breach.
- MODEL ROUTING: Fallback model documented (e.g. GPT-4o-mini on GPT-4o PTU exhaustion); circuit-breaker pattern described.
- SEMANTIC CACHE: Cache key excludes PII fields; TTL policy documented per query category; per-tenant cache namespace isolation for multi-tenant deployments.
- MULTI-TENANT ISOLATION: Each tenant has an isolated credential set for backend; token budget tracked per tenant; request correlation includes tenant ID.

DISCLAIMER TEXT:
"Architecture-review mapping for AI gateway posture; not certification of gateway performance or throughput guarantees."

ADJACENT PACKS (do not duplicate):
- azure-openai-foundry (AI-03): LLM backend posture (do not duplicate private endpoint rules)
- llm-finops (AI-17): tenant-level token budget governance (gateway is enforcement layer; FinOps is design layer)
```

---

## AI-09 — MLOps Platform Architecture

```
PACK_DISPLAY_NAME:   MLOps Platform Architecture
PACK_DESCRIPTION:    Architecture-review posture for MLOps platform design — model registry security and access control, training pipeline governance (pipeline-as-code, environment isolation), model promotion gates (dev→staging→prod: automated quality check + human approval), model card governance (presence, required fields, update cadence), deployment patterns (shadow, canary, blue/green), model drift monitoring, and model decommission policy. Not model performance certification or reproducibility guarantee.
PACK_CATEGORY:       AI Governance
SLUG:                mlops-platform
RULE_PREFIX:         mlops-
TARGET_RULE_COUNT:   34
FRAMEWORK_SHORT_NAME: MLOps Platform

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix          | Theme                                                                  | Target rules | Priority skew |
|-----------------|------------------------------------------------------------------------|-------------|---------------|
| mlops-registry- | Model registry (security, RBAC, versioning, immutability of promoted)  | 6           | P0-heavy      |
| mlops-pipeline- | Training pipeline (pipeline-as-code, reproducibility, compute security) | 5          | P0/P1         |
| mlops-gate-     | Promotion gates (automated quality check + human approval)              | 6           | P0-heavy      |
| mlops-card-     | Model card governance (presence, fields, update on re-train)           | 4           | P0/P1         |
| mlops-deploy-   | Deployment patterns (shadow, canary, blue/green, endpoint isolation)   | 5           | P1            |
| mlops-drift-    | Drift monitoring (data drift, concept drift, performance alerting)     | 4           | P1/P2         |
| mlops-retire-   | Model decommission (policy, endpoint shutdown, artifact retention)     | 4           | P1/P2         |

SOURCE FRAMEWORK SUMMARY:
Sources: Azure ML documentation; MLflow documentation; Databricks ML (Unity Catalog) documentation; Google MLOps Maturity Model.

Key themes for rule authoring:
- MODEL REGISTRY: Registry access controlled via RBAC; promoted model artifacts are immutable (digest-pinned); all registry write operations logged; registry access scoped by environment.
- TRAINING PIPELINE: Pipeline defined as code in source control; no credentials embedded in pipeline scripts; training compute identity scoped to training data only.
- PROMOTION GATES: Dev→staging gate: automated quality check (metrics vs. threshold); staging→prod gate: human approval documented; no production promotion without gate evidence in audit trail.
- MODEL CARD: Model card required before production promotion; fields: intended use, training data summary, evaluation results, known limitations, contacts.
- DEPLOYMENT: Shadow deployment described for major model changes; canary percentage documented; rollback trigger defined.
- DRIFT: Data drift monitoring (statistical divergence from training distribution); performance degradation alert configured; alert routes to on-call.

DISCLAIMER TEXT:
"Architecture-review mapping for MLOps platform posture; not model performance certification or reproducibility guarantee."

ADJACENT PACKS (do not duplicate):
- ai-training-data-provenance (AI-15): training data lineage and consent
- llm-observability-evals (AI-10): eval harness for model quality
- ai-governance-responsible-ai (#1): model ownership and oversight themes
```

---

## AI-10 — LLM Observability & Evaluation Architecture

```
PACK_DISPLAY_NAME:   LLM Observability & Evaluation Architecture
PACK_DESCRIPTION:    Architecture-review posture for LLM evaluation and observability systems. Covers LLM trace design (gen_ai.* attribute coverage, prompt version pinning, session correlation), golden dataset governance (versioning, coverage, access control), offline evaluation pipeline (eval harness presence, metric selection, gating threshold), online production monitoring (sampling, metric aggregation, drift alerting), and regression gating (promotion blocker on metric degradation, canary eval before rollout). Not certification of LLM output quality.
PACK_CATEGORY:       AI Governance
SLUG:                llm-observability-evals
RULE_PREFIX:         llm-eval-
TARGET_RULE_COUNT:   25
FRAMEWORK_SHORT_NAME: LLM Observability / Evals

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix            | Theme                                                              | Target rules | Priority skew |
|-------------------|--------------------------------------------------------------------|-------------|---------------|
| llm-eval-trace-   | LLM trace design (gen_ai.* attributes, prompt version, session correlation) | 5   | P0-heavy      |
| llm-eval-golden-  | Golden dataset governance (versioning, coverage, access control)   | 5           | P0/P1         |
| llm-eval-offline- | Offline evaluation pipeline (harness, metrics, gating threshold)   | 5           | P0/P1         |
| llm-eval-online-  | Online monitoring (production sampling, aggregation, drift alert)  | 5           | P1            |
| llm-eval-regress- | Regression gating (promotion blocker, canary eval before rollout)  | 5           | P0/P1         |

SOURCE FRAMEWORK SUMMARY:
Sources: OpenTelemetry GenAI semantic conventions; Azure AI Evaluation SDK; HELM (Stanford, 2023–2024); MLflow evaluation module.

Key themes for rule authoring:
- TRACE DESIGN: Every LLM request must emit gen_ai.* OTel attributes (gen_ai.system, gen_ai.request.model, gen_ai.usage.input_tokens, gen_ai.usage.output_tokens, gen_ai.response.finish_reason); prompt version must be included in trace; session/conversation ID must correlate multi-turn traces.
- GOLDEN DATASET: Golden dataset versioned in source control; coverage documented per user intent category; access controlled (not writable by eval pipeline); contains ≥ representative examples of P0 use cases.
- OFFLINE EVAL: Eval harness present and integrated into CI; selected metrics documented (faithfulness, relevance, harmlessness, task-specific); pass/fail threshold documented.
- ONLINE MONITORING: Production response sampling (≥ 1% or ≥ N requests per hour); metric aggregation dashboard present; drift alert configured for key metric degradation.
- REGRESSION GATE: Promotion from staging to production blocked if eval metric degrades below threshold; canary promotion runs eval on live sample before full rollout.

DISCLAIMER TEXT:
"Architecture-review mapping for LLM evaluation and observability posture; not certification of LLM output quality or faithfulness guarantee."

ADJACENT PACKS (do not duplicate):
- observability-otel (#22): general OTel instrumentation (this pack adds gen_ai.* AI-specific attributes)
- mlops-platform (AI-09): MLOps promotion gates (this pack adds LLM-specific eval pipeline)
- ai-red-team-safety (AI-18): red-team testing that feeds back into eval pipeline
```

---

## AI-11 — AI in Financial Services: Model Risk Management

```
PACK_DISPLAY_NAME:   AI in Financial Services — Model Risk Management
PACK_DESCRIPTION:    Architecture-review themes for AI model risk management (MRM) in financial services, aligned to Federal Reserve SR 11-7 (2011), OCC Bulletin 2011-12, and FRB SR 23-4 (2023). Covers model inventory, model development documentation, independent validation architecture, ongoing monitoring, champion/challenger deployment patterns, third-party model risk, and MRM governance structure. Conditionally framed for AI models used in material financial risk decisions. Not OCC/Federal Reserve examination or determination of MRM adequacy.
PACK_CATEGORY:       Compliance
SLUG:                ai-financial-mrm
RULE_PREFIX:         fin-mrm-
TARGET_RULE_COUNT:   33
FRAMEWORK_SHORT_NAME: SR 11-7 MRM

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Theme                                                                | Target rules | Priority skew |
|------------------|----------------------------------------------------------------------|-------------|---------------|
| fin-mrm-inv-     | Model inventory (all in-use AI models registered, purpose, risk tier) | 5          | All P0        |
| fin-mrm-dev-     | Model development (training doc, data quality, assumption documentation) | 5       | P0/P1         |
| fin-mrm-val-     | Independent validation (validator isolation, challenge model, independence) | 6    | P0-heavy      |
| fin-mrm-monitor- | Ongoing monitoring (drift, outcome analysis, back-testing architecture) | 5         | P0/P1         |
| fin-mrm-champ-   | Champion/challenger (A/B deployment architecture, challenger access control) | 4    | P1            |
| fin-mrm-3p-      | Third-party model risk (vendor due diligence doc, access controls, SLA) | 4         | P0/P1         |
| fin-mrm-govern-  | Governance (MRM policy doc, escalation path, board attestation reference) | 4        | P1/P2         |

SOURCE FRAMEWORK SUMMARY:
Sources: Federal Reserve SR 11-7 (2011), OCC Bulletin 2011-12, FRB SR 23-4 (2023), OCC AI in banking guidance (2023).

Key themes for rule authoring:
- MODEL INVENTORY: Every AI model used in material risk decisions must be registered in a model inventory with: model purpose, risk tier (low/medium/high), model owner, validation status, approval date.
- INDEPENDENT VALIDATION: Validation environment isolated from development environment (separate workspace, separate data access); validators cannot modify model before validation; challenge model or benchmark required for high-tier models.
- ONGOING MONITORING: Performance monitoring against known benchmarks; outcome analysis comparing model predictions to actual outcomes; back-testing on recent data cadence documented.
- THIRD-PARTY: Vendor model documentation requirements documented; contractual right to audit vendor model; SLA for model performance guarantees documented.
- CONDITIONAL FRAMING: "If this AI model is used in material financial risk decisions covered by SR 11-7…"

DISCLAIMER TEXT:
"Thematic architecture-review mapping toward SR 11-7 MRM principles for AI; not OCC/Federal Reserve examination or regulatory determination of model risk adequacy."

ADJACENT PACKS (do not duplicate):
- mlops-platform (AI-09): MLOps promotion gates (MRM validation is SR 11-7 specific)
- llm-observability-evals (AI-10): monitoring architecture complement
```

---

## AI-12 — AI in Healthcare: FDA SaMD / GMLP / PCCP

```
PACK_DISPLAY_NAME:   AI in Healthcare — FDA SaMD / GMLP / PCCP Architecture Themes
PACK_DESCRIPTION:    Architecture-review themes for AI/ML-based Software as a Medical Device (SaMD) aligned to FDA GMLP 10 guiding principles (2021) and FDA PCCP final guidance (December 2024). Covers data governance (train/val/test split, PHI handling, demographic representativeness), algorithm transparency (model card for SaMD, intended use), PCCP architecture evidence (change scope, monitoring triggers), bias and subgroup analysis documentation, post-market monitoring design, and cybersecurity (GMLP Principle 10). Conditionally framed. Not FDA 510(k) clearance, De Novo determination, PMA approval, or legal advice.
PACK_CATEGORY:       Compliance
SLUG:                ai-healthcare-fda
RULE_PREFIX:         fda-samd-
TARGET_RULE_COUNT:   29
FRAMEWORK_SHORT_NAME: FDA SaMD / GMLP

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Theme                                                                     | Target rules | Priority skew |
|------------------|---------------------------------------------------------------------------|-------------|---------------|
| fda-samd-data-   | Data governance (train/val/test split, PHI handling, representativeness)  | 6           | P0-heavy      |
| fda-samd-alg-    | Algorithm transparency (model card, intended use, GMLP Principles 4–6)   | 5           | P0/P1         |
| fda-samd-pccp-   | PCCP architecture evidence (change scope, impact assessment, triggers)    | 5           | P0/P1         |
| fda-samd-bias-   | Bias and subgroup analysis (subgroup performance, representative data)    | 4           | P0/P1         |
| fda-samd-monitor-| Post-market monitoring (design, real-world data collection, alerts)       | 5           | P1            |
| fda-samd-cyber-  | Cybersecurity (GMLP Principle 10 — device security, update mechanism)    | 4           | P0/P1         |

SOURCE FRAMEWORK SUMMARY:
Sources: FDA GMLP 10 guiding principles (2021); FDA PCCP final guidance (December 2024); IMDRF SaMD framework (2013–2014).

Key themes for rule authoring:
- DATA GOVERNANCE: Training/validation/test data must be separated with documented split rationale; PHI must be de-identified or appropriately controlled; demographic coverage documented.
- PCCP: Predetermined Change Control Plan documents the scope of algorithm changes that can be made without new 510(k) submission; monitoring triggers for when a PCCP change has been made must be defined.
- BIAS: Subgroup performance documented across protected attributes (age, sex, race, ethnicity) where clinically relevant; disparate performance triggers PCCP or new submission evaluation.
- CYBERSECURITY: GMLP Principle 10 — device security plan documented; software update mechanism designed; incident response plan for cybersecurity events affecting medical device.
- CONDITIONAL FRAMING: "If this software is developed or deployed as SaMD under FDA jurisdiction…"

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not FDA 510(k) clearance, De Novo determination, PMA approval, or regulatory legal advice."

ADJACENT PACKS (do not duplicate):
- hipaa-architecture (#11): PHI handling (cross-reference, do not duplicate HIPAA data-at-rest rules)
- arc-ampe-architecture-themes (#24): ACA/Medicaid partner entity complement
```

---

## AI-13 — AI in US Public Sector: OMB M-24-10

```
PACK_DISPLAY_NAME:   AI in US Public Sector — OMB M-24-10 Architecture Themes
PACK_DESCRIPTION:    Architecture-review themes for federal AI governance aligned to OMB M-24-10 (March 2024) and OMB M-24-18 (August 2024). Covers AI use-case inventory (CAIO accountability), rights-impacting AI controls (human review, appeal mechanism, notice design), safety-impacting AI controls (human oversight, fail-safe, monitoring), CAIO governance structure, AI acquisition governance (M-24-18), and ATO alignment for AI systems. Conditionally framed. Not OMB compliance determination, ATO issuance, or federal legal opinion.
PACK_CATEGORY:       Compliance
SLUG:                ai-public-sector-us
RULE_PREFIX:         gov-ai-
TARGET_RULE_COUNT:   32
FRAMEWORK_SHORT_NAME: OMB M-24-10

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix          | Theme                                                                     | Target rules | Priority skew |
|-----------------|---------------------------------------------------------------------------|-------------|---------------|
| gov-ai-inv-     | AI use-case inventory (registration, CAIO accountability, purpose doc)    | 5           | All P0        |
| gov-ai-rights-  | Rights-impacting AI controls (human review, appeal, notice, explanation)  | 7           | P0-heavy      |
| gov-ai-safety-  | Safety-impacting AI controls (human oversight, fail-safe, monitoring)     | 6           | P0-heavy      |
| gov-ai-caio-    | CAIO accountability architecture (governance structure, escalation path)  | 4           | P1            |
| gov-ai-proc-    | AI acquisition governance (M-24-18 procurement controls, transparency)    | 5           | P1            |
| gov-ai-ato-     | ATO alignment for AI systems (FISMA categorisation, CM integration)       | 5           | P0/P1         |

SOURCE FRAMEWORK SUMMARY:
Sources: OMB M-24-10 (March 28, 2024), OMB M-24-18 (August 27, 2024), EO 14110 (October 30, 2023), NIST AI 600-1 (July 2024).

Key themes for rule authoring:
- AI USE-CASE INVENTORY: All AI systems must be registered in the agency AI use-case inventory; mandatory fields per M-24-10 Appendix; CAIO designated and documented.
- RIGHTS-IMPACTING AI (§5(b)): Minimum practices — human review available, appeal mechanism designed, plain-language notice to affected individuals, explanation of AI involvement in decision.
- SAFETY-IMPACTING AI (§5(c)): Human oversight mechanism documented; fail-safe designed (system defaults to safe state on failure); performance monitoring and reporting designed.
- ATO ALIGNMENT: AI system must be included in FISMA system boundary; categorisation reflects AI-specific risks; continuous monitoring covers AI model performance, not just infrastructure.
- CONDITIONAL FRAMING: "If this AI system is designated rights-impacting under OMB M-24-10 §5(b)…" or "If this AI system is designated safety-impacting under OMB M-24-10 §5(c)…"

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not OMB compliance determination, ATO issuance, or federal agency legal opinion."

ADJACENT PACKS (do not duplicate):
- nist-ai-600-1-genai (AI-07): NIST AI 600-1 technical counterpart
- nist-csf-2-architecture (#19): FedRAMP/FISMA general security controls
- us-state-ai-laws (AI-20): state-level AI requirements
```

---

## AI-14 — MITRE ATLAS: Adversarial ML Threat Architecture

```
PACK_DISPLAY_NAME:   MITRE ATLAS — Adversarial ML Threat Architecture
PACK_DESCRIPTION:    Defensive architecture-review posture mapped to MITRE ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems) matrix v4+. Covers defensive architecture for: data poisoning threats, model evasion, model extraction, model inversion, backdoor/trojan attacks, supply-chain compromise, and persistence/behavioral drift. Not adversarial ML attack simulation, red-team execution, or MITRE endorsement.
PACK_CATEGORY:       Security
SLUG:                mitre-atlas
RULE_PREFIX:         atlas-
TARGET_RULE_COUNT:   30
FRAMEWORK_SHORT_NAME: MITRE ATLAS v4+

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Defensive theme (ATLAS tactic area)                                 | Target rules | Priority skew |
|------------------|---------------------------------------------------------------------|-------------|---------------|
| atlas-poison-    | Data poisoning defences (training data access control, integrity)   | 5           | P0-heavy      |
| atlas-evade-     | Evasion defences (input validation, adversarial input detection design) | 5        | P1            |
| atlas-extract-   | Model extraction defences (API rate limiting, output restriction)   | 5           | P0/P1         |
| atlas-invert-    | Model inversion defences (output truncation, differential privacy)  | 4           | P1            |
| atlas-backdoor-  | Backdoor/trojan defences (training pipeline integrity, provenance)  | 4           | P0/P1         |
| atlas-supply-    | Supply-chain compromise defences (third-party model provenance)     | 4           | P0/P1         |
| atlas-persist-   | Persistence defences (behavioral drift monitoring from baseline)    | 3           | P1/P2         |

SOURCE FRAMEWORK SUMMARY:
Source: MITRE ATLAS matrix v4+ (atlasai.mitre.org). Cite ATLAS tactic and technique IDs (AML.T*, AML.TA*).

Key themes for rule authoring:
- DATA POISONING DEFENCE: Training data access restricted to authorised pipeline only; data integrity verification (checksums / provenance) before training; data change detection logging.
- MODEL EXTRACTION DEFENCE: API access rate-limited per consumer; output confidence scores suppressed or binned (not raw probabilities); API access logged and anomalous extraction patterns alerted.
- BACKDOOR DEFENCE: Training pipeline changes require approval and audit; model weights verified against known-good digest before deployment; third-party model supply chain documented.
- SUPPLY CHAIN DEFENCE: All third-party models documented with version, source, and provenance; model integrity verified (digest pinning) before serving.
- ALL RULES: Framed as defensive posture questions — "does the architecture document a control for…?"; no attack execution instructions.
- HUMAN SME REVIEW: All rules involving model inversion and model extraction must be reviewed by human SME for attack-instruction specificity before publishing.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not adversarial ML attack simulation, red-team execution, or MITRE endorsement."

ADJACENT PACKS (do not duplicate):
- owasp-llm-top10 (AI-01): GenAI app-layer attacks (distinct from ML-model-level attacks)
- ai-red-team-safety (AI-18): red-team programme that executes ATLAS-inspired testing
- ai-training-data-provenance (AI-15): training data supply chain complement
```

---

## AI-15 — AI Training Data Governance & Provenance

```
PACK_DISPLAY_NAME:   AI Training Data Governance & Provenance
PACK_DESCRIPTION:    Architecture-review posture for AI training data governance. Covers dataset card governance (presence, required fields, update cadence), source lineage documentation, consent and opt-out signal architecture (opt-out pipeline, GDPR erasure-from-training), copyright and license posture (license classification per dataset, legal review documentation), contamination testing (train/eval separation, contamination test pipeline), and C2PA content provenance (content credential attachment, do-not-train signal). Not legal clearance of dataset copyright, GDPR compliance determination, or content authenticity certification.
PACK_CATEGORY:       AI Governance
SLUG:                ai-training-data-provenance
RULE_PREFIX:         train-data-
TARGET_RULE_COUNT:   26
FRAMEWORK_SHORT_NAME: Training Data Governance

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix            | Theme                                                                 | Target rules | Priority skew |
|-------------------|-----------------------------------------------------------------------|-------------|---------------|
| train-data-card-  | Dataset card governance (presence, required fields, update cadence)   | 5           | P0-heavy      |
| train-data-lineage-| Source lineage (data source doc, transformation pipeline, reproducibility) | 5      | P0/P1         |
| train-data-consent-| Consent and opt-out signals (opt-out pipeline, GDPR erasure-from-training) | 4    | P0/P1         |
| train-data-license-| Copyright and license posture (license classification, legal review)  | 4           | P0/P1         |
| train-data-contam-| Contamination testing (train/eval separation, contamination test pipeline) | 4       | P0/P1         |
| train-data-c2pa-  | C2PA content provenance (content credentials, do-not-train signal)    | 4           | P1/P2         |

SOURCE FRAMEWORK SUMMARY:
Sources: EU AI Act Art. 10 (2024); Gebru et al. "Datasheets for Datasets" (2021); C2PA Content Credentials Specification (2024); NIST AI 600-1 §GAI-3/4 (2024).

Key themes for rule authoring:
- DATASET CARD: Dataset card must be present before production use of training data; required fields: name, version, intended use, source(s), collection process, preprocessing steps, license, known biases, out-of-scope uses.
- SOURCE LINEAGE: Data source URLs, collection timestamps, and transformation steps documented; lineage traceable from raw source to model training run.
- OPT-OUT SIGNALS: robots.txt AI crawling opt-out respected and documented; C2PA do-not-train assertion processing pipeline documented; GDPR erasure-from-training requests handled by pipeline design.
- LICENSE: Each dataset source classified by license (CC0, CC-BY, proprietary, web-scraped); legal review documented for scraped or proprietary data.
- CONTAMINATION: Test/evaluation data must not appear in training data; contamination test pipeline (n-gram overlap or embedding similarity check) documented and run before training.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not legal clearance of dataset copyright, GDPR compliance determination, or content authenticity certification."

ADJACENT PACKS (do not duplicate):
- eu-ai-act-high-risk (AI-04): Art. 10 data governance cross-reference
- mitre-atlas (AI-14): data poisoning defence complement
- azure-openai-foundry (AI-03): fine-tune storage isolation (do not duplicate)
```

---

## AI-16 — AI Privacy & Confidential AI Architecture

```
PACK_DISPLAY_NAME:   AI Privacy & Confidential AI Architecture
PACK_DESCRIPTION:    Architecture-review posture for AI privacy and confidential computing for AI. Covers PII detection at the prompt boundary (detection pipeline, redaction, classification before LLM forwarding), no-train contractual posture documentation, confidential compute for AI (Confidential VM / container for inference, TEE attestation design), customer data isolation in multi-tenant AI (per-customer keys, prompt isolation), AI log retention and DSR (retention policy, erasure pipeline), and embedding privacy (PII in embeddings, de-identification). Not privacy certification, TEE security assurance, or regulatory compliance determination.
PACK_CATEGORY:       Security
SLUG:                ai-privacy-confidential
RULE_PREFIX:         ai-priv-
TARGET_RULE_COUNT:   27
FRAMEWORK_SHORT_NAME: AI Privacy / Confidential AI

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Theme                                                                   | Target rules | Priority skew |
|------------------|-------------------------------------------------------------------------|-------------|---------------|
| ai-priv-prompt-  | Prompt PII boundary (detection, redaction, classification)              | 5           | P0-heavy      |
| ai-priv-notrain- | No-train contractual posture (service agreement reference, opt-out)     | 4           | P0/P1         |
| ai-priv-tee-     | Confidential compute (Confidential VM/container, TEE attestation)       | 5           | P0/P1         |
| ai-priv-iso-     | Customer data isolation (per-customer keys, prompt isolation, output)   | 5           | P0-heavy      |
| ai-priv-retain-  | AI log retention and DSR (retention policy, erasure pipeline)           | 4           | P1            |
| ai-priv-embed-   | Embedding privacy (PII in embeddings, store access control, de-id)      | 4           | P1            |

SOURCE FRAMEWORK SUMMARY:
Sources: Confidential Computing Consortium; Microsoft Confidential AI documentation; NIST SP 800-188 (2023); EU AI Act Art. 10 (2024).

Key themes for rule authoring:
- PROMPT PII: PII detection service (e.g. Microsoft Presidio, Azure AI PII) integrated at prompt ingestion; detected PII redacted or pseudonymised before LLM forwarding; detection pipeline latency < 500ms documented.
- NO-TRAIN: Service agreement section documenting no-train clause referenced in manifest metadata; fine-tune data consent posture documented separately.
- CONFIDENTIAL COMPUTE: Inference workload on Confidential VM or Confidential Container where model confidentiality required; TEE attestation endpoint documented for remote verification.
- TENANT ISOLATION: Each tenant's prompts and responses encrypted with tenant-specific CMK; no cross-tenant data in shared cache without anonymisation.
- AI LOG DSR: AI interaction logs subject to GDPR Art. 17 erasure on request; erasure pipeline designed; retention policy documented (no indefinite retention of AI conversation logs).

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not privacy certification, TEE security assurance, or regulatory compliance determination."

ADJACENT PACKS (do not duplicate):
- gdpr-baseline (#5): general GDPR data protection rules
- azure-openai-foundry (AI-03): private networking (do not duplicate)
- rag-architecture (AI-05): embedding store security complement
```

---

## AI-17 — LLM Cost & Token Governance (FinOps for AI)

```
PACK_DISPLAY_NAME:   LLM Cost & Token Governance (FinOps for AI)
PACK_DESCRIPTION:    Architecture-review posture for LLM cost governance. Covers per-consumer/per-tenant token budget design (budget definition, monitoring, alert thresholds), model-tier routing (primary/fallback documented, tier selection criteria), semantic caching design (strategy, TTL, bypass rules), kill-switch and circuit-breaker (hard spend limit, automatic suspension, executive alert), cost allocation and tagging (per-workload tags, showback/chargeback, FOCUS-aligned), and batch vs realtime optimisation (async request design). Not cost guarantee or billing commitment.
PACK_CATEGORY:       Cost
SLUG:                llm-finops
RULE_PREFIX:         llm-cost-
TARGET_RULE_COUNT:   24
FRAMEWORK_SHORT_NAME: LLM FinOps

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix           | Theme                                                              | Target rules | Priority skew |
|------------------|--------------------------------------------------------------------|-------------|---------------|
| llm-cost-budget- | Per-consumer/per-tenant token budgets (definition, monitoring, alerts) | 5        | P0-heavy      |
| llm-cost-route-  | Model-tier routing (primary/fallback, tier criteria, cost-vs-quality) | 4         | P0/P1         |
| llm-cost-cache-  | Semantic caching design (strategy, TTL, bypass rules)              | 4           | P1            |
| llm-cost-kill-   | Kill-switch and circuit-breaker (hard limit, auto suspension, alert) | 4          | P0-heavy      |
| llm-cost-alloc-  | Cost allocation and tagging (per-workload tags, showback, FOCUS)   | 4           | P1            |
| llm-cost-batch-  | Batch vs realtime optimisation (async request design)              | 3           | P1/P2         |

SOURCE FRAMEWORK SUMMARY:
Sources: FinOps Foundation FOCUS specification; Microsoft Azure OpenAI cost documentation; APIM AI token-limit policy documentation.

Key themes for rule authoring:
- TOKEN BUDGETS: Per-consumer or per-tenant daily/monthly token budget documented in governance.PolicyConstraints; budget tracked and monitored; budget alert threshold (e.g. 80%) triggers notification.
- MODEL ROUTING: Primary model and fallback model documented; fallback triggers defined (PTU exhaustion, latency threshold); cost-vs-quality trade-off rationale documented.
- KILL-SWITCH: Hard spend limit in absolute currency or token count; automatic suspension of LLM access when limit reached; executive-level alert on suspension; grace period for critical workloads.
- COST ALLOCATION: Every LLM-consuming service tagged with: workload, team, environment, and model; showback report generated ≥ monthly; chargeback model documented for multi-team tenants.
- FOCUS TAGGING: Tags align to FinOps Foundation FOCUS schema where applicable (ServiceName, SkuName, SubAccountId).

DISCLAIMER TEXT:
"Architecture-review mapping for LLM cost governance posture; not cost guarantee or billing commitment."

ADJACENT PACKS (do not duplicate):
- cost-optimization (#7): general Azure FinOps (this pack adds LLM token-level economics)
- ai-gateway (AI-08): gateway-layer token-limit enforcement (this pack is design-level)
```

---

## AI-18 — AI Red-Team & Safety Assurance Architecture

```
PACK_DISPLAY_NAME:   AI Red-Team & Safety Assurance Architecture
PACK_DESCRIPTION:    Architecture-review posture for AI red-team and safety assurance programmes. Covers red-team programme design (scope, charter, independence), attack library governance (versioned, coverage mapped), safety eval pipeline integration (jailbreak resistance testing in CI, harmful-output eval gating), dual-use review architecture (board existence, review trigger, escalation), red-team cadence and findings remediation (pre/post-deployment cadence, remediation SLA, tracking), and AI safety incident response (classification, playbook, disclosure policy). Not safety certification or red-team results attestation.
PACK_CATEGORY:       Security
SLUG:                ai-red-team-safety
RULE_PREFIX:         ai-rt-
TARGET_RULE_COUNT:   27
FRAMEWORK_SHORT_NAME: AI Red Team / Safety

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix             | Theme                                                                | Target rules | Priority skew |
|--------------------|----------------------------------------------------------------------|-------------|---------------|
| ai-rt-prog-        | Programme design (scope, charter, independence, resourcing)          | 5           | P0-heavy      |
| ai-rt-atk-lib-     | Attack library governance (versioned, coverage, update cadence)      | 4           | P0/P1         |
| ai-rt-safety-eval- | Safety eval pipeline integration (CI jailbreak, harmful-output gate) | 5           | P0-heavy      |
| ai-rt-dual-use-    | Dual-use review architecture (board, trigger, escalation)            | 4           | P0/P1         |
| ai-rt-cadence-     | Red-team cadence and findings remediation (cadence SLA, tracking)    | 5           | P0/P1         |
| ai-rt-incident-    | AI safety incident response (classification, playbook, disclosure)   | 4           | P1/P2         |

SOURCE FRAMEWORK SUMMARY:
Sources: Microsoft AI Red Team practices and published reports; NIST AI 600-1 §Govern 4.3 (2024); HELM-Safety (Stanford, 2024).

Key themes for rule authoring:
- PROGRAMME DESIGN: Red-team programme has a documented charter with: scope (which AI systems), objectives, independence requirement (separate from AI development team), minimum cadence.
- ATTACK LIBRARY: Library of AI attack scenarios (jailbreak prompts, adversarial inputs, social engineering scenarios) versioned in a repository; coverage mapped to OWASP LLM Top 10 and MITRE ATLAS categories.
- SAFETY EVAL PIPELINE: Jailbreak resistance test suite integrated into CI/CD pipeline; pre-production deployment blocked if failure rate exceeds threshold; harmful-output evaluation cadence documented.
- DUAL-USE REVIEW: Review board (or equivalent process) evaluates AI capabilities for dual-use potential (CBRN information, deepfake generation, autonomous attack tooling); trigger criteria documented.
- FINDINGS REMEDIATION: Red-team findings tracked in a dedicated backlog; severity classification defined; remediation SLA per severity documented.
- HUMAN SME REVIEW: All rules in ai-rt-atk-lib-* and ai-rt-safety-eval-* must be reviewed by human SME for attack-instruction specificity before publishing.

DISCLAIMER TEXT:
"Architecture-review mapping for AI red-team programme posture; not safety certification, red-team results attestation, or guarantee of safe AI behaviour."

ADJACENT PACKS (do not duplicate):
- mitre-atlas (AI-14): adversarial ML defensive architecture
- llm-observability-evals (AI-10): eval pipeline that consumes red-team findings
- owasp-llm-top10 (AI-01): OWASP LLM attack categories that feed attack library
```

---

## AI-19 — Multi-Agent System Orchestration

```
PACK_DISPLAY_NAME:   Multi-Agent System Orchestration
PACK_DESCRIPTION:    Architecture-review posture for multi-agent AI systems where multiple AI agents collaborate via supervisor/orchestrator, critic, and worker topologies. Covers topology documentation (supervisor/worker/critic roles), supervisor authority bounds (scope limit, escalation, delegation design), inter-agent trust (message authentication, session binding, impersonation prevention), shared state security (access control, schema validation, rollback), loop termination and circuit-breaker (max iteration bound, timeout, forced human escalation), and attribution tracing (per-agent action attribution, multi-agent audit trail). Not safety certification of autonomous multi-agent behaviour.
PACK_CATEGORY:       AI Governance
SLUG:                multi-agent-orchestration
RULE_PREFIX:         mas-
TARGET_RULE_COUNT:   27
FRAMEWORK_SHORT_NAME: Multi-Agent Orchestration

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix        | Theme                                                                  | Target rules | Priority skew |
|---------------|------------------------------------------------------------------------|-------------|---------------|
| mas-topo-     | Topology documentation (supervisor/worker/critic roles, dependency graph) | 4        | P0-heavy      |
| mas-super-    | Supervisor authority bounds (scope limit, escalation, delegation)      | 5           | P0-heavy      |
| mas-trust-    | Inter-agent trust (message authentication, session binding)            | 5           | P0-heavy      |
| mas-state-    | Shared state security (access control, schema validation, rollback)    | 4           | P0/P1         |
| mas-loop-     | Loop termination and circuit-breaker (max iterations, timeout, escalation) | 5      | P0-heavy      |
| mas-attr-     | Attribution tracing (per-agent action attribution, audit trail chain)  | 4           | P0/P1         |

SOURCE FRAMEWORK SUMMARY:
Sources: Microsoft AutoGen documentation; LangGraph documentation; CrewAI documentation; Microsoft Magentic-One (2024).

Key themes for rule authoring:
- TOPOLOGY: Every agent in the system must appear as a services[] entry; agent roles (supervisor, worker, critic) documented in Purpose field; InvokesAgent relationships in manifest graph.
- SUPERVISOR AUTHORITY: Supervisor cannot delegate permissions it does not have; supervisor scope is limited to the task objective; escalation to human is defined when supervisor is uncertain or confidence below threshold.
- INTER-AGENT TRUST: Agent-to-agent messages must carry a session-bound identity token; no agent accepts task instructions from an unverified sender; message signing or HMAC for high-stakes inter-agent calls.
- SHARED STATE: Shared state store has per-agent write-scope (supervisor state is read-only for workers); schema validation enforced on write; state rollback capability documented for failure scenarios.
- LOOP TERMINATION: Maximum iteration count enforced (hard stop); wall-clock timeout enforced independently of iteration count; human escalation path when loop approaches limit.
- ATTRIBUTION: Every agent action tagged with originating agent ID, session ID, and instruction source; multi-agent audit trail reconstructable from correlation IDs.

DISCLAIMER TEXT:
"Architecture-review mapping for multi-agent system orchestration posture; not safety certification of autonomous multi-agent behaviour."

ADJACENT PACKS (do not duplicate):
- agentic-ai-mcp (AI-06): single-agent tool-use posture (this pack is multi-agent topology)
- ai-red-team-safety (AI-18): red-team testing of multi-agent systems
- llm-finops (AI-17): loop cost control / kill-switch complement
```

---

## AI-20 — US State AI Laws

```
PACK_DISPLAY_NAME:   US State AI Laws — Architecture Themes (Colorado, NYC, California, Texas)
PACK_DESCRIPTION:    Architecture-review themes emerging from US state AI laws. Covers: consequential-decision scope identification (employment, credit, housing, healthcare), bias audit architecture (audit service design, annual cadence, third-party audit documentation), transparency and notice mechanism design (AI disclosure, purpose notice), opt-out and appeal mechanism design (opt-out pipeline, human review appeal path, explanation), and impact assessment documentation (bias impact assessment, disparate impact analysis). Thematically organised for durability across rapidly evolving state legislation. Not legal compliance determination, legal advice, or equivalence to qualified legal opinion on state law applicability.
PACK_CATEGORY:       Compliance
SLUG:                us-state-ai-laws
RULE_PREFIX:         us-state-ai-
TARGET_RULE_COUNT:   22
FRAMEWORK_SHORT_NAME: US State AI Laws

SUB-CORPORA AND RULE DISTRIBUTION:
| Prefix               | Theme                                                               | Target rules | Priority skew |
|----------------------|---------------------------------------------------------------------|-------------|---------------|
| us-state-ai-scope-   | Consequential decision scope (employment, credit, housing, healthcare) | 4         | P0-heavy      |
| us-state-ai-audit-   | Bias audit architecture (design, annual cadence, third-party doc)   | 5           | P0-heavy      |
| us-state-ai-notice-  | Transparency and notice design (AI disclosure, purpose, contact)    | 4           | P0/P1         |
| us-state-ai-optout-  | Opt-out and appeal mechanism (opt-out pipeline, human review, explanation) | 5     | P0/P1         |
| us-state-ai-impact-  | Impact assessment documentation (bias impact, disparate impact)     | 4           | P1            |

SOURCE FRAMEWORK SUMMARY:
Sources: Colorado SB 24-205 (May 2024, effective February 2026); NYC Local Law 144 (effective 2023); California AB 302 (2023); Texas SB 2037 (Texas RAGA, 2025).

Key themes for rule authoring:
- SCOPE: "Consequential decisions" include: employment screening (NYC LL 144), credit/insurance/housing decisions (Colorado SB 24-205 categories), healthcare triage (California AB 302 government AI). Conditional framing required.
- BIAS AUDIT (NYC LL 144): Annual bias audit by independent auditor required for automated employment decision tools; audit covers disparate impact by sex, race/ethnicity; audit summary published.
- BIAS AUDIT (CO SB 24-205): Developer and deployer must use reasonable care to protect consumers from algorithmic discrimination; impact assessment required.
- TRANSPARENCY NOTICE: Consumer must be notified when AI is used in a consequential decision; notice must include: nature of AI use, purpose, right to appeal/opt-out, contact for inquiry.
- OPT-OUT / APPEAL: Consumer right to opt out of solely automated decisions (Colorado) or request human review (NYC); appeal mechanism designed in architecture; explanation of decision factors provided.
- CONDITIONAL FRAMING: "If this system makes or substantially assists in consequential decisions covered by applicable state law…"; do not classify the customer's specific obligations.
- RAPIDLY EVOLVING LANDSCAPE: ~15 states have passed or introduced AI legislation; pack designed for thematic durability; annual review for new state laws.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not legal compliance determination, legal advice, or qualified legal opinion on state law applicability. Consult qualified legal counsel for jurisdiction-specific obligations."

ADJACENT PACKS (do not duplicate):
- ai-public-sector-us (AI-13): federal rights-impacting AI requirements (OMB M-24-10)
- eu-ai-act-high-risk (AI-04): EU AI Act counterpart
- ai-governance-responsible-ai (#1): general RAI accountability and oversight themes
```
