#!/usr/bin/env python3
"""Expand ARC-AMPE policy pack from placeholder rules to 80 substantive architecture-review rules.

Writes docs/samples/policy-packs/arc-ampe-architecture-themes-rules-v1.json only.
Bundled pack content metadata is synced by scripts/generate_v1_bundled_policy_packs.py.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[1]
SAMPLES = REPO / "docs" / "samples" / "policy-packs"
OUTPUT_PATH = SAMPLES / "arc-ampe-architecture-themes-rules-v1.json"
SLUG = "arc-ampe-architecture-themes"
RULE_COUNT = 80
PACK_VERSION = "1.1.0"

ARC_FRAMEWORK = "ARC-AMPE Volume I (CMS, v1.02)"
NIST_FRAMEWORK = "NIST SP 800-53 R5"
DISCLAIMER_THEME = (
    "Thematic architecture-review mapping; not CMS conformity, SSPP authoring, or legal classification."
)

PACK_DESCRIPTION = (
    "Architecture-review themes aligned to CMS ARC-AMPE Volume I v1.02 (Pillars, ACA AE CSF Profile, "
    "Privacy Framework profile) with NIST SP 800-53 R5 control citations. Thematic mapping only; "
    "not CMS conformity, SSPP authoring, or attestation."
)

STANDARD_EVIDENCE_HINTS = [
    "governance.PolicyConstraints",
    "governance.RequiredControls",
    "governance.ComplianceTags",
    "services[].Tags",
    "metadata.ChangeDescription",
]

AZURE_EVIDENCE_HINTS = [
    "azureExtractor.manifest.RawJson",
    "datastores[].DatastoreType",
    "datastores[].RuntimePlatform",
    "datastores[].Tags",
    "relationships[].relationshipType",
    "services[].Purpose",
    "services[].Endpoints",
]


@dataclass(frozen=True)
class RuleSpec:
    title: str
    description: str
    remediation: str
    arc_theme: str
    nist_control: str
    nist_requirement: str
    severity: str
    priority: str
    azure: bool = False
    extra_hints: tuple[str, ...] = ()


def evidence_hints(spec: RuleSpec) -> list[str]:
    hints = list(STANDARD_EVIDENCE_HINTS)
    if spec.azure:
        for hint in AZURE_EVIDENCE_HINTS:
            if hint not in hints:
                hints.append(hint)
    for hint in spec.extra_hints:
        if hint not in hints:
            hints.append(hint)
    return hints


def build_rule(rule_id: str, spec: RuleSpec) -> dict[str, Any]:
    return {
        "id": rule_id,
        "title": spec.title,
        "description": spec.description,
        "severity": spec.severity,
        "priority": spec.priority,
        "remediationGuidance": spec.remediation,
        "evidenceHints": evidence_hints(spec),
        "frameworkMappings": [
            {"framework": ARC_FRAMEWORK, "theme": spec.arc_theme},
            {
                "framework": NIST_FRAMEWORK,
                "control": spec.nist_control,
                "requirement": spec.nist_requirement,
            },
            {"framework": "Disclaimer", "theme": DISCLAIMER_THEME},
        ],
    }


RULE_SPECS: list[RuleSpec] = [
    # 001-007: ACA AE Pillars — all P0, severity High
    RuleSpec(
        "Consumer engagement surfaces documented for informed enrollment decisions",
        "Exchange-facing portals, eligibility APIs, and partner enrollment channels must document how consumers "
        "receive clear plan and subsidy information before PII is collected — supporting ACA AE Pillar 1 when "
        "the tenant operates as an Administering Entity or Medicaid partner.",
        "Tag consumer-facing services with pillar:engage and enrollment-channel in services[].Tags; describe "
        "consent and disclosure touchpoints in metadata.ChangeDescription.",
        "ACA AE Pillars — Pillar 1: Engage consumers and enable informed enrollment decisions",
        "PM-1",
        "Information security program plan",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "End-to-end enrollment workflow boundaries mapped across systems",
        "Architecture must trace the seamless enrollment path from identity proofing through plan selection, "
        "subsidy determination, and issuer handoff — including every partner entity that touches applicant data.",
        "Map enrollment stages on relationships[] between eligibility, enrollment hub, and issuer integration "
        "services; document handoff contracts in governance.PolicyConstraints.",
        "ACA AE Pillars — Pillar 2: Seamless experience and end-to-end enrollment",
        "SA-8",
        "Security and privacy engineering principles",
        "High",
        "P0",
        True,
        ("relationships[].relationshipType",),
    ),
    RuleSpec(
        "Trust, transparency, and accountability controls for Exchange data handling",
        "Manifest must show auditability, breach notification paths, and public accountability mechanisms "
        "for systems processing FFE/SBE or Medicaid eligibility and enrollment data.",
        "Record accountability owners in governance.ComplianceTags; cite audit log destinations and incident "
        "escalation in governance.RequiredControls.",
        "ACA AE Pillars — Pillar 3: Trust, transparency, and accountability",
        "AU-6",
        "Audit record review, analysis, and reporting",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Coverage service availability and accessibility architecture documented",
        "Enrollment and plan-shopping surfaces must document resilience targets, regional failover, and "
        "accessibility accommodations so coverage remains available during open enrollment peaks.",
        "State RTO/RPO expectations in governance.PolicyConstraints; tag availability-tier on critical "
        "services[].Tags; align multi-region posture with azureExtractor inventory.",
        "ACA AE Pillars — Pillar 4: Accessibility and availability of coverage",
        "CP-2",
        "Contingency plan",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Federal regulatory compliance architecture for ACA and Medicaid obligations",
        "Systems in scope for ARC-AMPE must document how architecture supports HIPAA, 45 CFR Part 155, "
        "Medicaid IT standards, and CMS security/privacy contract clauses — without asserting legal classification.",
        "List applicable regulatory tags in governance.ComplianceTags; map control inheritance from platform "
        "to tenant workloads in metadata.ChangeDescription.",
        "ACA AE Pillars — Pillar 5: Compliance with federal laws and regulations",
        "PL-2",
        "System and communications protection policy",
        "High",
        "P0",
    ),
    RuleSpec(
        "Governed innovation paths for new Exchange and Medicaid capabilities",
        "New enrollment features, third-party integrations, and AI-assisted decision support must document "
        "security review gates before production — balancing Pillar 6 innovation with controlled change.",
        "Describe architecture review and threat modeling gates in governance.RequiredControls; tag experimental "
        "integrations with innovation:review-pending on services[].Tags.",
        "ACA AE Pillars — Pillar 6: Drive innovation with governed change",
        "SA-3",
        "System development life cycle",
        "High",
        "P0",
    ),
    RuleSpec(
        "Continuity of care and affordable product data flows documented",
        "Architecture must show how member, provider, and formulary data supports continuity of care and "
        "simple product presentation — including cross-plan data retention boundaries for partner entities.",
        "Document care-continuity data stores in datastores[].Tags; map issuer and MCO integration edges on "
        "relationships[] with data-classification labels.",
        "ACA AE Pillars — Pillar 7: Simple affordable products and continuity of care",
        "SI-12",
        "Information management and retention",
        "High",
        "P0",
        True,
        ("datastores[].Tags",),
    ),
    # 008-019: NIST CSF Identify (12 rules) — mix P0/P1
    RuleSpec(
        "Hardware and software asset inventory for Exchange workloads",
        "All Azure resources supporting eligibility, enrollment, or Medicaid operations must appear in the "
        "manifest with owners — not only application tiers.",
        "Ensure azureExtractor inventory populates services[] and datastores[]; add owner tags and environment "
        "class in governance.ComplianceTags.",
        "ACA AE CSF Profile — IDENTIFY / ID.AM-1: Physical devices and systems inventoried",
        "CM-8",
        "System component inventory",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Software platforms and applications inventoried with version posture",
        "PaaS runtimes, container images, and COTS packages used in Exchange integrations must be enumerated "
        "with supported-version expectations.",
        "Tag runtime and image references on services[].Tags; document patch cadence in governance.PolicyConstraints.",
        "ACA AE CSF Profile — IDENTIFY / ID.AM-2: Software platforms and applications inventoried",
        "CM-7",
        "Least functionality",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Organizational communication and data flows mapped for PII/PHI",
        "Data flows between AE systems, state Medicaid agencies, issuers, and partner entities must be mapped "
        "— especially cross-boundary transfers of applicant and member data.",
        "Draw flow narratives in metadata.ChangeDescription; link services and datastores via relationships[] "
        "with data-flow labels.",
        "ACA AE CSF Profile — IDENTIFY / ID.AM-3: Organizational communication and data flows mapped",
        "AC-4",
        "Information flow enforcement",
        "High",
        "P0",
        True,
        ("relationships[].relationshipType",),
    ),
    RuleSpec(
        "External information systems cataloged for partner entity dependencies",
        "Third-party SaaS, BPO, and cloud services processing Exchange data must be listed with contractual "
        "security expectations and data residency constraints.",
        "Tag external-system and partner-entity on affected services[].Tags; record DPA references in "
        "governance.PolicyConstraints.",
        "ACA AE CSF Profile — IDENTIFY / ID.AM-4: External information systems cataloged",
        "SA-9",
        "External system services",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Resources prioritized by criticality for enrollment peak operations",
        "Critical functions during open enrollment (eligibility, plan shopping, payment) must be tagged with "
        "business criticality so resilience investments align with ID.AM-5.",
        "Apply criticality:critical on peak-path services[].Tags; document prioritization in "
        "governance.RequiredControls.",
        "ACA AE CSF Profile — IDENTIFY / ID.AM-5: Resources prioritized based on criticality",
        "CP-2",
        "Contingency plan",
        "Medium",
        "P1",
        True,
    ),
    RuleSpec(
        "Cybersecurity roles and responsibilities documented for AE operations",
        "Named accountable roles (ISSO, privacy officer, integration owners) must be referenced for systems "
        "in Exchange or Medicaid scope — not assumed from org chart alone.",
        "Record role assignments in governance.ComplianceTags and metadata.ChangeDescription.",
        "ACA AE CSF Profile — IDENTIFY / ID.BE-3: Priorities for organizational mission communicated",
        "PM-2",
        "Information security program leadership role",
        "High",
        "P0",
    ),
    RuleSpec(
        "Dependencies and critical functions identified for Exchange services",
        "Upstream identity providers, payment processors, and state hub integrations must be documented as "
        "dependencies whose failure blocks enrollment.",
        "Map dependency edges on relationships[]; tag dependency:critical on integration services.",
        "ACA AE CSF Profile — IDENTIFY / ID.BE-4: Dependencies and critical functions identified",
        "CP-8",
        "Telecommunications services",
        "High",
        "P0",
        True,
        ("relationships[].relationshipType",),
    ),
    RuleSpec(
        "Resilience requirements aligned to enrollment and Medicaid service levels",
        "RTO, RPO, and capacity headroom for peak enrollment must be stated for systems supporting ACA AE "
        "or state Medicaid operations.",
        "Document resilience targets in governance.PolicyConstraints; align availability zones and scale rules "
        "with azureExtractor posture.",
        "ACA AE CSF Profile — IDENTIFY / ID.BE-5: Resilience requirements established",
        "CP-10",
        "System recovery and reconstitution",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Supply chain role documented for partner entity integrations",
        "When the tenant acts as a partner entity, architecture must show how subcontractor and vendor "
        "components inherit security requirements for Exchange-bound data.",
        "Tag supply-chain:in-scope on vendor-hosted services; cite SR-family mappings in governance.RequiredControls.",
        "ACA AE CSF Profile — IDENTIFY / ID.BE-1: Supply chain role in critical infrastructure",
        "SR-3",
        "Supply chain controls and processes",
        "High",
        "P0",
    ),
    RuleSpec(
        "Organizational cybersecurity policy established for Exchange scope",
        "A documented security policy covering ACA/Medicaid systems must be referenced at architecture scope — "
        "including acceptable use of cloud regions and encryption standards.",
        "Capture policy references in governance.PolicyConstraints and governance.RequiredControls.",
        "ACA AE CSF Profile — IDENTIFY / ID.GV-1: Organizational cybersecurity policy established",
        "PL-1",
        "Policy and procedures",
        "High",
        "P0",
    ),
    RuleSpec(
        "Legal and regulatory requirements mapped to architecture controls",
        "Manifest must map HIPAA, state privacy laws, CMS contract clauses, and ARC-AMPE obligations to "
        "concrete technical controls — for counsel review, not auto-classification.",
        "Use governance.ComplianceTags for regulation references; avoid asserting AE or Partner Entity status.",
        "ACA AE CSF Profile — IDENTIFY / ID.GV-3: Legal and regulatory requirements understood",
        "PM-11",
        "Mission and business process definition",
        "High",
        "P0",
    ),
    RuleSpec(
        "Governance and risk management processes tied to architecture changes",
        "Architecture change boards, risk acceptance, and exception tracking must be documented for systems "
        "handling FFE/SBE or Medicaid enrollment data.",
        "Describe governance cadence in metadata.ChangeDescription; link exceptions in governance.PolicyConstraints.",
        "ACA AE CSF Profile — IDENTIFY / ID.GV-4: Governance and risk management processes",
        "RA-7",
        "Risk response",
        "Medium",
        "P1",
    ),
    # 020-037: NIST CSF Protect (18 rules) — mix P0/P1
    RuleSpec(
        "Identities and credentials managed for Exchange administrative access",
        "Human and workload identities with access to enrollment databases or hub APIs must use federated SSO "
        "or managed identity — not long-lived shared accounts.",
        "Tag identity:entra-federated on services[].Tags; document credential types in governance.RequiredControls.",
        "ACA AE CSF Profile — PROTECT / PR.AC-1: Identities and credentials managed",
        "AC-2",
        "Account management",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Physical access limited to cloud control plane via privileged paths",
        "While PE controls are procedural, architecture must show privileged Azure control-plane access is "
        "brokered through PIM/JIT — not standing Owner on production subscriptions.",
        "Document PIM usage in governance.PolicyConstraints; align with azureExtractor RBAC inventory.",
        "ACA AE CSF Profile — PROTECT / PR.AC-2: Physical access limited (cloud control plane)",
        "AC-6",
        "Least privilege",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Remote access encrypted and brokered for partner entity operators",
        "VPN, bastion, or zero-trust broker paths for remote administration of Exchange workloads must enforce "
        "MFA and session logging.",
        "Describe remote access architecture in metadata.ChangeDescription; tag remote-access:brokered on "
        "relevant services[].Tags.",
        "ACA AE CSF Profile — PROTECT / PR.AC-3: Remote access managed",
        "AC-17",
        "Remote access",
        "High",
        "P1",
        True,
    ),
    RuleSpec(
        "Access permissions follow least privilege for enrollment data stores",
        "Database and storage RBAC must document least-privilege roles for eligibility engineers, operations, "
        "and partner entity support staff.",
        "Map data-plane roles in governance.RequiredControls; verify private endpoints on sensitive datastores.",
        "ACA AE CSF Profile — PROTECT / PR.AC-4: Access permissions managed with least privilege",
        "AC-3",
        "Access enforcement",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Network integrity protected for Exchange integration subnets",
        "Hub-spoke or segmented VNets isolating enrollment APIs from corporate networks must be documented "
        "with NSG and firewall rule intent.",
        "Tag network-segment on services[].Tags; cite NSG and Azure Firewall posture from azureExtractor.",
        "ACA AE CSF Profile — PROTECT / PR.AC-5: Network integrity protected",
        "SC-7",
        "Boundary protection",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Identity proofing architecture documented for consumer enrollment",
        "Identity verification services (RIDP, state hub matching) must document data minimization and "
        "segregation from internal admin identities.",
        "Describe proofing integration in metadata.ChangeDescription; tag identity-proofing on consumer channels.",
        "ACA AE CSF Profile — PROTECT / PR.AC-6: Identity proofing for enrollment applicants",
        "IA-5",
        "Authenticator management",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Multi-factor authentication enforced for privileged Exchange operations",
        "Conditional Access requiring MFA for admins and developers touching production enrollment data must be "
        "documented — including break-glass exceptions.",
        "Record MFA policy in governance.RequiredControls; note break-glass controls in governance.PolicyConstraints.",
        "ACA AE CSF Profile — PROTECT / PR.AC-7: Authentication strength for workforce access",
        "IA-2",
        "Identification and authentication (organizational users)",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Security awareness themes for partner entity engineering teams",
        "Architecture onboarding must reference security training for teams building Medicaid/Exchange integrations.",
        "Note training requirements in governance.ComplianceTags and metadata.ChangeDescription.",
        "ACA AE CSF Profile — PROTECT / PR.AT-1: Security awareness for workforce",
        "AT-2",
        "Literacy training and awareness",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Privileged users receive elevated training for enrollment production access",
        "Teams with standing or JIT access to member PII databases must document role-specific training.",
        "Tag privileged-training:required on governance.ComplianceTags for production data paths.",
        "ACA AE CSF Profile — PROTECT / PR.AT-2: Privileged user training",
        "AT-3",
        "Role-based training",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Data-at-rest encryption documented for applicant and member stores",
        "SQL, Cosmos, and storage accounts holding eligibility or enrollment data must document TDE/SSE and "
        "CMK usage where required by state or CMS contracts.",
        "Tag encryption-at-rest on datastores[].Tags; verify encryption settings from azureExtractor inventory.",
        "ACA AE CSF Profile — PROTECT / PR.DS-1: Data-at-rest protected",
        "SC-28",
        "Protection of information at rest",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Data-in-transit encryption for Exchange-facing API surfaces",
        "All ingress/egress paths handling PII between consumers, AEs, issuers, and partner entities must "
        "document TLS 1.2+ and mutual TLS where B2B contracts require it.",
        "Tag each ingress in services[].Tags with encryption profile; describe TLS termination in "
        "metadata.ChangeDescription.",
        "ACA AE CSF Profile — PROTECT / PR.DS-2: Data-in-transit protected (High Priority Subcategory)",
        "SC-8",
        "Transmission confidentiality and integrity",
        "High",
        "P0",
        True,
        ("services[].Endpoints",),
    ),
    RuleSpec(
        "Asset management lifecycle for enrollment platform components",
        "Decommissioning and data destruction for retired enrollment modules must be documented to prevent "
        "orphaned member data in partner entity environments.",
        "Describe retirement procedures in governance.PolicyConstraints; tag lifecycle:decommission on retired assets.",
        "ACA AE CSF Profile — PROTECT / PR.DS-3: Asset management during disposal",
        "MP-6",
        "Media sanitization",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Capacity and availability protections for open enrollment peaks",
        "Auto-scale, queue depth, and database throughput limits must be documented so availability controls "
        "protect enrollment during traffic spikes.",
        "Document capacity headroom in governance.PolicyConstraints; align scale rules with azureExtractor metrics.",
        "ACA AE CSF Profile — PROTECT / PR.DS-4: Availability and capacity maintained",
        "SC-5",
        "Denial-of-service protection",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Data leak prevention themes for outbound Exchange integrations",
        "Egress to issuers, credit agencies, and analytics partners must document DLP, field filtering, and "
        "contractual purpose limitation.",
        "Map outbound integrations on relationships[]; record DLP expectations in governance.RequiredControls.",
        "ACA AE CSF Profile — PROTECT / PR.DS-5: Data leak protections",
        "AC-4",
        "Information flow enforcement",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Integrity verification for eligibility and enrollment transactions",
        "Systems must document checksums, signed payloads, or immutable audit trails for enrollment transactions "
        "submitted to CMS or state hubs.",
        "Describe integrity controls in governance.RequiredControls; tag transaction-integrity on hub APIs.",
        "ACA AE CSF Profile — PROTECT / PR.DS-6: Integrity checking mechanisms",
        "SI-7",
        "Software, firmware, and information integrity",
        "High",
        "P0",
    ),
    RuleSpec(
        "Development and test environments separated from production enrollment data",
        "Non-production environments must not host production member snapshots without documented masking and "
        "contract approval.",
        "Tag environment:dev/test on non-prod services; prohibit prod-data:present unless explicitly justified.",
        "ACA AE CSF Profile — PROTECT / PR.DS-7: Development and test separation",
        "CM-4",
        "Impact analyses",
        "High",
        "P1",
        True,
    ),
    RuleSpec(
        "Information protection processes for Exchange change management",
        "Security impact analysis must precede architecture changes affecting eligibility rules or enrollment APIs.",
        "Link change records in metadata.ChangeDescription; cite security review gates in governance.RequiredControls.",
        "ACA AE CSF Profile — PROTECT / PR.IP-1: Information protection processes maintained",
        "CM-3",
        "Configuration change control",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Protective technology baseline for Exchange workloads on Azure",
        "Defender, WAF, and endpoint protection coverage must be documented for internet-facing enrollment surfaces.",
        "Record defender-plan and waf coverage in governance.RequiredControls; verify from azureExtractor security posture.",
        "ACA AE CSF Profile — PROTECT / PR.PT-1: Protective technology deployed",
        "SI-4",
        "System monitoring",
        "High",
        "P0",
        True,
    ),
    # 038-045: NIST CSF Detect (8 rules) — mix P0/P1
    RuleSpec(
        "Network baseline established for Exchange hub traffic patterns",
        "Expected traffic between enrollment tiers, identity services, and partner APIs must be baselined for "
        "anomaly detection during open enrollment.",
        "Document baseline sources in governance.RequiredControls; enable NSG flow logs or equivalent in Azure.",
        "ACA AE CSF Profile — DETECT / DE.AE-1: Network baseline established",
        "AU-12",
        "Audit record generation",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Security event analysis pipeline for enrollment anomalies",
        "SIEM rules covering failed authentications, unusual eligibility queries, and bulk exports must be "
        "documented for AE and partner entity operations centers.",
        "List analytic use cases in governance.RequiredControls; tag siem:onboarded on logging services.",
        "ACA AE CSF Profile — DETECT / DE.AE-2: Detected events analyzed",
        "SI-4",
        "System monitoring",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Event data aggregated from Exchange platform components",
        "Diagnostic settings forwarding App Service, SQL, Key Vault, and API Management logs to centralized "
        "analytics must be documented.",
        "Verify diagnostic destinations in azureExtractor; record workspace IDs in governance.ComplianceTags.",
        "ACA AE CSF Profile — DETECT / DE.AE-3: Event data collected and correlated",
        "AU-6",
        "Audit record review, analysis, and reporting",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Impact of detected events assessed for member data exposure",
        "Runbooks must document how enrollment security events escalate to privacy and CMS notification paths.",
        "Describe impact assessment steps in metadata.ChangeDescription and governance.PolicyConstraints.",
        "ACA AE CSF Profile — DETECT / DE.AE-4: Impact of events determined",
        "IR-4",
        "Incident handling",
        "High",
        "P0",
    ),
    RuleSpec(
        "Alert thresholds defined for enrollment fraud and abuse patterns",
        "Thresholds for abnormal plan shopping, agent impersonation, and API scraping must be documented.",
        "Record threshold policies in governance.RequiredControls; tag fraud-detection on consumer-facing APIs.",
        "ACA AE CSF Profile — DETECT / DE.AE-5: Alert thresholds established",
        "SI-4",
        "System monitoring",
        "Medium",
        "P1",
        True,
    ),
    RuleSpec(
        "Network monitoring for Exchange integration zones",
        "Azure Firewall, NDR, or NSG analytics monitoring hub-to-partner traffic must be documented.",
        "Cite monitoring tools in governance.RequiredControls; align with azureExtractor network security inventory.",
        "ACA AE CSF Profile — DETECT / DE.CM-1: Network monitored for anomalies",
        "SI-4",
        "System monitoring",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Malicious code protections on enrollment application tiers",
        "Container image scanning, App Service malware protection, and dependency scanning must be documented.",
        "Document scanning stages in governance.RequiredControls; tag image-scan:on in services[].Tags.",
        "ACA AE CSF Profile — DETECT / DE.CM-4: Malicious code detected",
        "SI-3",
        "Malicious code protection",
        "High",
        "P1",
        True,
    ),
    RuleSpec(
        "Vulnerability scanning cadence for Exchange Azure resources",
        "Defender vulnerability assessments and container/CVE scans must run on production enrollment paths.",
        "Record scan cadence in governance.PolicyConstraints; verify defender VA status from azureExtractor.",
        "ACA AE CSF Profile — DETECT / DE.CM-8: Vulnerability scans performed",
        "RA-5",
        "Vulnerability monitoring and scanning",
        "High",
        "P1",
        True,
    ),
    # 046-051: NIST CSF Respond (6 rules) — mostly P1
    RuleSpec(
        "Incident response plan covers Exchange and Medicaid data breaches",
        "Architecture must reference IR playbooks including CMS, state, and issuer notification paths for "
        "enrollment data incidents.",
        "Link IR plan identifiers in governance.PolicyConstraints; document communication trees in "
        "metadata.ChangeDescription.",
        "ACA AE CSF Profile — RESPOND / RS.RP-1: Response plan executed during incidents",
        "IR-1",
        "Incident handling policy and procedures",
        "High",
        "P1",
    ),
    RuleSpec(
        "Incident coordination with CMS and state Medicaid security contacts",
        "Contacts and escalation timelines for AE/partner entities must be documented for coordinated response.",
        "Record coordination contacts in governance.ComplianceTags — not live PII.",
        "ACA AE CSF Profile — RESPOND / RS.CO-1: Incidents coordinated with stakeholders",
        "IR-8",
        "Incident response assistance",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Forensic analysis capability for enrollment platform compromises",
        "Log retention, immutable storage, and chain-of-custody for forensic images must be documented.",
        "Describe retention periods in governance.RequiredControls; tag forensic-retention on log storage accounts.",
        "ACA AE CSF Profile — RESPOND / RS.AN-1: Incidents analyzed for root cause",
        "AU-11",
        "Audit record retention",
        "High",
        "P1",
        True,
    ),
    RuleSpec(
        "Containment procedures for compromised enrollment integration accounts",
        "Disable-token, revoke-SAS, and isolate-subnet playbooks must be documented for partner entity incidents.",
        "Document containment automation in governance.RequiredControls and metadata.ChangeDescription.",
        "ACA AE CSF Profile — RESPOND / RS.MI-1: Incidents contained to limit impact",
        "IR-4",
        "Incident handling",
        "High",
        "P1",
        True,
    ),
    RuleSpec(
        "Enrollment service restoration priorities after security incidents",
        "Recovery order (identity, eligibility, enrollment hub) must be documented to restore consumer access.",
        "State restoration sequence in governance.PolicyConstraints; align with CP-2 contingency themes.",
        "ACA AE CSF Profile — RESPOND / RS.IM-1: Incidents mitigated and services restored",
        "CP-10",
        "System recovery and reconstitution",
        "High",
        "P1",
    ),
    RuleSpec(
        "Post-incident improvements tracked for Exchange architecture",
        "Lessons learned must feed back into architecture standards and partner entity onboarding checklists.",
        "Reference post-incident review cadence in governance.ComplianceTags.",
        "ACA AE CSF Profile — RESPOND / RS.IM-2: Incident response improvements implemented",
        "PM-18",
        "Privacy program leadership responsibilities",
        "Medium",
        "P1",
    ),
    # 052-056: NIST CSF Recover (5 rules) — mostly P1
    RuleSpec(
        "Recovery plan documented for ACA enrollment platform outage",
        "DR plans covering regional failover for enrollment APIs and databases must be documented with tested "
        "runbooks — not slide-deck-only.",
        "Cross-reference DR subscriptions and paired regions in metadata.ChangeDescription; tag dr:documented.",
        "ACA AE CSF Profile — RECOVER / RC.RP-1: Recovery plan executed during disruptions",
        "CP-2",
        "Contingency plan",
        "High",
        "P1",
        True,
    ),
    RuleSpec(
        "Recovery strategies aligned to Medicaid and Exchange RTO/RPO",
        "Warm standby or active-active strategies for state hub integrations must match contractual RTO/RPO.",
        "Document RTO/RPO in governance.PolicyConstraints; verify backup policies on datastores via azureExtractor.",
        "ACA AE CSF Profile — RECOVER / RC.RP-2: Recovery strategies updated",
        "CP-6",
        "Alternate storage site",
        "Medium",
        "P1",
        True,
    ),
    RuleSpec(
        "Enrollment data backups encrypted and restorable",
        "Backup encryption, geo-redundancy, and restore drills for member databases must be documented.",
        "Tag backup:encrypted on datastores[].Tags; cite Key Vault keys for backup encryption.",
        "ACA AE CSF Profile — RECOVER / RC.IM-1: Recovery improvements incorporated",
        "CP-9",
        "System backup",
        "High",
        "P1",
        True,
    ),
    RuleSpec(
        "Communications plan for enrollment outages during open enrollment",
        "Public status pages and issuer notification paths during outages must be documented.",
        "Describe comms channels in metadata.ChangeDescription and governance.PolicyConstraints.",
        "ACA AE CSF Profile — RECOVER / RC.CO-1: Recovery communications coordinated",
        "CP-2",
        "Contingency plan",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Restoration verification for eligibility rulesets after DR failover",
        "Post-failover validation of eligibility logic and subsidy tables must be documented before traffic cutover.",
        "Document verification checklists in governance.RequiredControls.",
        "ACA AE CSF Profile — RECOVER / RC.CO-2: Recovery activities communicated to stakeholders",
        "CP-10",
        "System recovery and reconstitution",
        "Medium",
        "P1",
    ),
    # 057-066: NIST Privacy Framework (10 rules) — mix P0/P1
    RuleSpec(
        "Privacy data inventory for applicant and member information",
        "Systems must inventory PII elements collected during enrollment and Medicaid eligibility — supporting "
        "Privacy Framework Identify-P inventory themes.",
        "Map data categories in datastores[].Tags and governance.ComplianceTags; describe fields in "
        "metadata.ChangeDescription.",
        "ACA AE Privacy Framework Profile — Identify-P / ID.IM-P2: Data elements inventoried",
        "PM-5",
        "System inventory",
        "High",
        "P0",
        True,
        ("datastores[].Tags",),
    ),
    RuleSpec(
        "Data processing purposes documented for Exchange integrations",
        "Each integration must state lawful purpose and retention for applicant data shared with partner entities.",
        "Record purpose tags on relationships[]; document in governance.PolicyConstraints.",
        "ACA AE Privacy Framework Profile — Identify-P / ID.IM-P3: Processing purposes documented",
        "PT-2",
        "Authority to process personally identifiable information",
        "High",
        "P0",
    ),
    RuleSpec(
        "Data flows mapped for privacy impact on cross-state sharing",
        "Interstate or federal data exchanges (FFE, hub) must document privacy impact and minimization.",
        "Draw privacy flow narrative in metadata.ChangeDescription; tag cross-state:data-flow where applicable.",
        "ACA AE Privacy Framework Profile — Identify-P / ID.IM-P4: Data flows mapped for privacy",
        "AC-4",
        "Information flow enforcement",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Business environment privacy risks for partner entity role",
        "When acting as a data processor, architecture must document privacy risks inherited from AE customers.",
        "Describe processor obligations in governance.ComplianceTags without asserting legal status.",
        "ACA AE Privacy Framework Profile — Identify-P / ID.BE-P1: Business environment privacy risks",
        "RA-3",
        "Risk assessment",
        "High",
        "P0",
    ),
    RuleSpec(
        "Privacy governance policies referenced for Exchange systems",
        "Privacy program policies covering notice, consent, and individual rights must be cited at system scope.",
        "Link privacy policy IDs in governance.PolicyConstraints.",
        "ACA AE Privacy Framework Profile — Govern-P / GV.PO-P3: Privacy policies established",
        "PL-1",
        "Policy and procedures",
        "High",
        "P0",
    ),
    RuleSpec(
        "Privacy roles and responsibilities for enrollment data stewards",
        "Named privacy coordinators and data stewards for Medicaid/Exchange datasets must be documented.",
        "Record privacy roles in governance.ComplianceTags.",
        "ACA AE Privacy Framework Profile — Govern-P / GV.PO-P4: Privacy roles assigned",
        "PM-2",
        "Information security program leadership role",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Privacy training for teams handling member PII",
        "Engineering and operations staff touching enrollment databases must document privacy training requirements.",
        "Note privacy training in governance.ComplianceTags and metadata.ChangeDescription.",
        "ACA AE Privacy Framework Profile — Govern-P / GV.AT-P1: Privacy awareness training",
        "AT-2",
        "Literacy training and awareness",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Privacy monitoring metrics for Exchange data processing",
        "Metrics on access reviews, DSAR volume, and consent withdrawals should be referenced for architecture scope.",
        "Document monitoring hooks in governance.RequiredControls.",
        "ACA AE Privacy Framework Profile — Govern-P / GV.MT-P3: Privacy program monitored",
        "PM-9",
        "Risk management strategy",
        "Medium",
        "P1",
    ),
    RuleSpec(
        "Individual participation mechanisms for enrollment privacy rights",
        "Architecture must show how consumer portals support access, correction, and opt-out per applicable rules.",
        "Describe consumer rights flows in metadata.ChangeDescription; tag privacy-rights:supported on portals.",
        "ACA AE Privacy Framework Profile — Control-P / CT.DP-P1: Disclosures for individual participation",
        "PT-3",
        "Personally identifiable information processing purposes",
        "High",
        "P0",
    ),
    RuleSpec(
        "Data protection controls for sensitive Medicaid attributes",
        "Sensitive attributes (SSN, immigration status, health conditions) must document masking, encryption, "
        "and role-based visibility.",
        "Apply data-class:sensitive on datastores[].Tags; document masking in governance.RequiredControls.",
        "ACA AE Privacy Framework Profile — Protect-P / PR.DS-P1: Data protected consistent with risk",
        "SC-28",
        "Protection of information at rest",
        "High",
        "P0",
        True,
    ),
    # 067-072: Enterprise Risk Management / NIST 800-37 RMF (6 rules) — all P0
    RuleSpec(
        "System categorization documented for Exchange security impact level",
        "FIPS 199 / CNSSI categorization for enrollment systems must be referenced to drive control selection — "
        "typically Moderate for ARC-AMPE-aligned workloads.",
        "Record categorization in governance.PolicyConstraints and metadata.ChangeDescription.",
        "Enterprise Risk Management — NIST 800-37 RMF: Categorize system",
        "RA-2",
        "Security categorization",
        "High",
        "P0",
    ),
    RuleSpec(
        "Security control selection mapped to ARC-AMPE baseline",
        "Selected NIST SP 800-53 R5 controls (with CMS tailoring) must be traceable from architecture to "
        "SSPP control families — thematic only.",
        "Map control selections in governance.RequiredControls; cross-reference Volume II families by ID.",
        "Enterprise Risk Management — NIST 800-37 RMF: Select controls",
        "CA-2",
        "Control assessments",
        "High",
        "P0",
    ),
    RuleSpec(
        "Control implementation evidenced in architecture manifest",
        "Implemented controls (encryption, logging, IAM) must be visible in manifest evidence — not SSPP prose alone.",
        "Align services[].Tags and azureExtractor findings with selected controls in governance.RequiredControls.",
        "Enterprise Risk Management — NIST 800-37 RMF: Implement controls",
        "CM-2",
        "Baseline configuration",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Security assessment scope defined for enrollment major releases",
        "Major enrollment releases must document assessment scope (pen test, control assessment) feeding authorization.",
        "Describe assessment scope in metadata.ChangeDescription; tag assessment:required on release services.",
        "Enterprise Risk Management — NIST 800-37 RMF: Assess controls",
        "CA-2",
        "Control assessments",
        "High",
        "P0",
    ),
    RuleSpec(
        "Authorization boundary and ATO themes for AE systems",
        "Authorization boundary diagrams and responsible officials must be referenced — ArchLucid does not issue ATO.",
        "Document boundary in metadata.ChangeDescription; cite AO/ISSO roles in governance.ComplianceTags.",
        "Enterprise Risk Management — NIST 800-37 RMF: Authorize system",
        "CA-6",
        "Authorization",
        "High",
        "P0",
    ),
    RuleSpec(
        "Continuous monitoring hooks for Exchange security posture",
        "Ongoing control monitoring (Defender, config drift, log review) must feed the customer's CM program — "
        "ArchLucid is not the continuous-monitoring system of record.",
        "List monitoring sources in governance.RequiredControls; verify defender and policy assignments in Azure.",
        "Enterprise Risk Management — NIST 800-37 RMF: Monitor controls",
        "CA-7",
        "Continuous monitoring",
        "High",
        "P0",
        True,
    ),
    # 073-076: US data residency / offshore prohibition (4 rules) — all P0
    RuleSpec(
        "All Exchange and Medicaid production data hosted in US Azure regions",
        "Production datastores and compute for enrollment workloads must be pinned to US sovereign regions — "
        "ARC-AMPE eliminates offshore hosting permitted under legacy MARS-E.",
        "Tag data-residency:us-only on all production datastores[].Tags; verify locations via azureExtractor.",
        "US Data Residency — Production workloads restricted to United States Azure regions",
        "SC-7",
        "Boundary protection",
        "High",
        "P0",
        True,
        ("datastores[].RuntimePlatform",),
    ),
    RuleSpec(
        "Cross-border replication and CDN paths prohibited for member PII",
        "Geo-redundant backup, CDN, and traffic manager configurations must not replicate member PII outside "
        "the United States without documented CMS exception.",
        "Audit geo-replication settings in azureExtractor; document exceptions in governance.PolicyConstraints.",
        "US Data Residency — Cross-border replication restricted for PII",
        "SC-12",
        "Cryptographic key establishment and management",
        "High",
        "P0",
        True,
    ),
    RuleSpec(
        "Partner entity subprocessors limited to US processing for Exchange data",
        "Third-party analytics, support, and BPO services must document US-only processing in architecture scope.",
        "Tag subprocessor:us-only on external services[].Tags; record contractual clauses in governance.PolicyConstraints.",
        "US Data Residency — Partner entity subprocessors US-only processing",
        "SA-9",
        "External system services",
        "High",
        "P0",
    ),
    RuleSpec(
        "DR and backup regions remain within US geography for enrollment data",
        "Failover pairs and backup vaults must stay in US regions — not nearest global pair if outside US.",
        "Document DR region pairs in metadata.ChangeDescription; verify backup region tags in azureExtractor.",
        "US Data Residency — Disaster recovery confined to US geography",
        "CP-6",
        "Alternate storage site",
        "High",
        "P0",
        True,
    ),
    # 077-080: Volume II SSPP pointer rules (4 rules) — all P2
    RuleSpec(
        "SSPP control implementation pointers for identity and access family",
        "Architecture gaps against AC-family controls should be tracked for inclusion in the customer's Volume II "
        "SSPP — ArchLucid does not author the SSPP.",
        "Export findings to SSPP AC-family worksheet; map manifest controls in governance.RequiredControls.",
        "Volume II SSPP pointer — Access Control (AC) family implementation evidence",
        "AC-1",
        "Policy and procedures",
        "Medium",
        "P2",
    ),
    RuleSpec(
        "SSPP control implementation pointers for system and communications protection",
        "SC-family encryption and boundary controls evidenced in manifest should feed SSPP SC sections.",
        "Cross-reference SC controls in governance.RequiredControls with azureExtractor network and encryption data.",
        "Volume II SSPP pointer — System and Communications Protection (SC) family",
        "SC-1",
        "Policy and procedures",
        "Medium",
        "P2",
        True,
    ),
    RuleSpec(
        "SSPP control implementation pointers for audit and accountability",
        "AU-family logging controls should be mapped for SSPP continuous monitoring handoff.",
        "List AU control evidence in governance.RequiredControls; cite log workspace destinations.",
        "Volume II SSPP pointer — Audit and Accountability (AU) family",
        "AU-1",
        "Policy and procedures",
        "Medium",
        "P2",
        True,
    ),
    RuleSpec(
        "SSPP continuous monitoring program alignment (Volume II Section 4.2)",
        "Architecture evidence gaps should feed the customer's continuous monitoring plan — not replace it.",
        "Document CM plan cross-references in metadata.ChangeDescription; tag sspp:vol2-cm-pointer.",
        "Volume II SSPP pointer — Continuous monitoring program (Volume II §4.2)",
        "CA-7",
        "Continuous monitoring",
        "Medium",
        "P2",
    ),
]


def build_rules() -> list[dict[str, Any]]:
    if len(RULE_SPECS) != RULE_COUNT:
        raise ValueError(f"Expected {RULE_COUNT} rule specs, found {len(RULE_SPECS)}")

    rules: list[dict[str, Any]] = []
    for index, spec in enumerate(RULE_SPECS, start=1):
        rule_id = f"arc-ampe-{index:03d}"
        rules.append(build_rule(rule_id, spec))
    return rules


def build_curated_document(rules: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "kind": "archlucid.policyPack.curatedRules.v1",
        "pack": {
            "name": "ARC-AMPE Architecture Themes (CMS ACA / Medicaid Partner Entities)",
            "description": PACK_DESCRIPTION,
            "version": PACK_VERSION,
            "category": "Compliance",
            "isDefault": True,
            "suggestedPackType": "PlatformDefault",
            "policyPackContentDocumentPath": f"docs/samples/policy-packs/{SLUG}.json",
        },
        "rules": rules,
    }


def validate_output(document: dict[str, Any]) -> None:
    rules = document["rules"]
    if len(rules) != RULE_COUNT:
        raise ValueError(f"Rule count must be {RULE_COUNT}, found {len(rules)}")

    serialized = json.dumps(document)
    if "control theme" in serialized.lower():
        raise ValueError('Placeholder "control theme" text remains in output')

    for index, rule in enumerate(rules, start=1):
        expected_id = f"arc-ampe-{index:03d}"
        if rule["id"] != expected_id:
            raise ValueError(f"Expected id {expected_id}, found {rule['id']}")
        if rule["severity"] == "Critical":
            raise ValueError(f"{rule['id']} uses forbidden severity Critical")
        mappings = rule.get("frameworkMappings", [])
        has_arc = any(m.get("framework") == ARC_FRAMEWORK for m in mappings)
        has_nist = any(m.get("framework") == NIST_FRAMEWORK and m.get("control") for m in mappings)
        has_disclaimer = any(m.get("framework") == "Disclaimer" for m in mappings)
        if not (has_arc and has_nist and has_disclaimer):
            raise ValueError(f"{rule['id']} missing required frameworkMappings")


def main() -> None:
    rules = build_rules()
    document = build_curated_document(rules)
    validate_output(document)

    OUTPUT_PATH.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")

    first_pillar_title = rules[0]["title"]
    print(f"wrote: {OUTPUT_PATH.relative_to(REPO)}")
    print(f"rule count: {len(rules)}")
    print(f"control theme placeholders: 0")
    print(f"first pillar rule title: {first_pillar_title}")


if __name__ == "__main__":
    main()
