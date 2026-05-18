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
- RBAC: storage accounts should use Azure AD / managed identity for access rather than storage access keys; access keys should be rotated and stored in Key Vault.
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
- HIGH-RISK CONNECTORS: HTTP, HTTP with Azure AD, Custom connectors, and connectors to regulated data sources must be in Business group or Blocked at minimum; SharePoint/Teams/Outlook connectors are Business by default.
- DATAVERSE SECURITY: business units should mirror organisational hierarchy; security roles should follow least-privilege; field-level security for sensitive Dataverse columns (e.g. Social Security Number, medical data); row-level security via predicate-based filters.
- ALM: all production apps/flows should be packaged as solutions; publisher prefix prevents naming conflicts; source control integration (GitHub or Azure DevOps); automated deployment pipelines rather than manual export/import.
- COE: CoE Starter Kit (free Microsoft tool) provides inventory, compliance assessment, and capacity management; manifest should document whether CoE is deployed and in scope.
- DEFAULT ENVIRONMENT: the default environment is accessible to all licensed users; should be treated as a test sandbox with strict DLP preventing data exfiltration.

DISCLAIMER TEXT:
"Thematic architecture-review mapping; not Microsoft Power Platform certification or CoE maturity attestation."

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
- azure-rbac-architecture (#30): Dataverse admin roles use Azure AD groups; cross-reference RBAC design
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
