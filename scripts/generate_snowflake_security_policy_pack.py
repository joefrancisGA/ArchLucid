#!/usr/bin/env python3
"""Generate Snowflake Security curated rules and GA starter catalog stubs."""

from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
CURATED_PATH = REPO_ROOT / "docs/samples/policy-packs/snowflake-security-rules-v1.json"
GA_STARTER_PATH = REPO_ROOT / "ArchLucid.Decisioning/Compliance/RulePacks/ga-starter-compliance.rules.json"

# (id, title, severity, priority, category, description, remediation, evidence_hints, framework, requirement)
RULES: list[tuple] = [
    (
        "sf-id-001",
        "Human users must use MFA or federated SSO with equivalent controls",
        "Critical",
        "P0",
        "Identity and authentication",
        "Password-only interactive access to Snowflake increases account takeover risk for production data. "
        "Review SHOW USERS, DESCRIBE USER, login history, IdP/SSO exports, and authentication policies. "
        "Pass when all human users require MFA or federated SSO. Fail when password-only human users access production without MFA/SSO. "
        "Insufficient evidence when no user or authentication exports are provided. "
        "False positive: documented break-glass accounts with compensating monitoring and risk acceptance.",
        "Enforce MFA or federated SSO for all human users; disable password-only paths except approved break-glass with monitoring.",
        [
            "snowflake.showUsers",
            "snowflake.describeUser",
            "snowflake.accountUsage.loginHistory",
            "snowflake.authenticationPolicy",
            "governance.RequiredControls",
            "metadata.ChangeDescription",
        ],
        "Snowflake Security",
        "MFA and federated authentication for human users",
    ),
    (
        "sf-id-002",
        "Shared human accounts are prohibited",
        "Critical",
        "P0",
        "Identity and authentication",
        "Shared human logins prevent attribution, access review, and MFA binding. "
        "Review user inventory, login history, and naming patterns for generic/shared accounts. "
        "Pass when each human has an individual Snowflake user mapped to corporate identity. "
        "Fail when shared or generic human accounts are used for interactive access. "
        "Insufficient evidence when user inventory is absent.",
        "Replace shared human accounts with individual federated users; rotate credentials and disable shared logins.",
        ["snowflake.showUsers", "snowflake.accountUsage.users", "snowflake.accountUsage.loginHistory"],
        "NIST CSF",
        "PR.AC-1 identities are managed",
    ),
    (
        "sf-id-003",
        "Automation users must be separate from human users",
        "High",
        "P0",
        "Identity and authentication",
        "Mixing automation and human identities complicates least privilege and access reviews. "
        "Review user types, comments, default roles, and service naming conventions. "
        "Pass when service/automation users are distinct from human users with dedicated roles. "
        "Fail when the same user serves both interactive and batch automation. "
        "Insufficient evidence when user purpose is not documented.",
        "Create dedicated service users per integration; prohibit interactive login on automation accounts.",
        ["snowflake.showUsers", "snowflake.describeUser", "snowflake.showRoles"],
        "Snowflake Security",
        "Service identity separation",
    ),
    (
        "sf-id-004",
        "Service accounts should use key-pair authentication or approved non-password authentication",
        "High",
        "P0",
        "Identity and authentication",
        "Password-based automation is difficult to rotate and prone to leakage. "
        "Review DESCRIBE USER RSA public keys, OAuth/security integrations, and password login history for service users. "
        "Pass when automation uses key-pair or approved non-password auth. "
        "Fail when service users authenticate with passwords for routine jobs. "
        "Insufficient evidence when service auth method is not shown.",
        "Migrate automation to key-pair or OAuth; disable password auth on service users and rotate keys on schedule.",
        ["snowflake.describeUser", "snowflake.accountUsage.loginHistory", "snowflake.showIntegrations"],
        "CIS Benchmarks",
        "Strong authentication for non-human identities (thematic)",
    ),
    (
        "sf-id-005",
        "Break-glass administrative accounts must be documented, monitored, and controlled",
        "Critical",
        "P0",
        "Identity and authentication",
        "Uncontrolled ACCOUNTADMIN or break-glass paths enable undetected privileged compromise. "
        "Review break-glass user list, login alerts, network restrictions, and governance records. "
        "Pass when break-glass accounts are named, monitored, time-bound, and approved. "
        "Fail when undocumented ACCOUNTADMIN-style accounts exist without monitoring. "
        "Insufficient evidence when admin account inventory is missing.",
        "Document break-glass process, restrict network access, alert on use, and review each activation.",
        ["snowflake.showUsers", "snowflake.accountUsage.loginHistory", "governance.PolicyConstraints"],
        "SOC 2",
        "CC6.1 logical access (thematic)",
    ),
    (
        "sf-id-006",
        "Stale or inactive users must be disabled or reviewed",
        "Medium",
        "P1",
        "Identity and authentication",
        "Dormant enabled accounts expand credential theft surface. "
        "Review ACCOUNT_USAGE.USERS last login, disabled flags, and access review exports. "
        "Pass when inactive users are disabled or reviewed on schedule. "
        "Fail when long-idle enabled users remain without review. "
        "Insufficient evidence when login history or user exports are absent.",
        "Disable or remove stale users; implement quarterly access review for enabled accounts.",
        ["snowflake.accountUsage.users", "snowflake.accountUsage.loginHistory"],
        "ISO 27001",
        "A.9.2.6 removal of access rights (thematic)",
    ),
    (
        "sf-rbac-001",
        "ACCOUNTADMIN usage must be limited and justified",
        "Critical",
        "P0",
        "RBAC and privilege management",
        "Broad ACCOUNTADMIN grants enable full account compromise. "
        "Review grants to ACCOUNTADMIN, role assignments, and privileged session evidence. "
        "Pass when ACCOUNTADMIN is rare, justified, and monitored. "
        "Fail when many users hold ACCOUNTADMIN for routine work. "
        "Insufficient evidence when role grant exports are missing.",
        "Remove routine ACCOUNTADMIN grants; use functional admin roles and monitor privileged use.",
        ["snowflake.showGrantsToRole", "snowflake.showGrantsOfRole", "snowflake.accountUsage.grantsToUsers"],
        "Snowflake Security",
        "ACCOUNTADMIN least use",
    ),
    (
        "sf-rbac-002",
        "SECURITYADMIN and SYSADMIN privileges must be separated by responsibility",
        "High",
        "P0",
        "RBAC and privilege management",
        "Combining security administration and system administration weakens segregation of duties. "
        "Review role grants for SECURITYADMIN, SYSADMIN, and custom admin roles. "
        "Pass when security and platform admin duties are separated. "
        "Fail when the same principals hold both without documented exception. "
        "Insufficient evidence when admin role grants are not exported.",
        "Split SECURITYADMIN and SYSADMIN assignments; document SoD exceptions with expiry.",
        ["snowflake.showGrantsToRole", "snowflake.showRoles", "governance.RequiredControls"],
        "SOX ITGC",
        "Segregation of duties (thematic)",
    ),
    (
        "sf-rbac-003",
        "Grants should be assigned to roles, not directly to users",
        "High",
        "P0",
        "RBAC and privilege management",
        "Direct user grants bypass role governance and access reviews. "
        "Review SHOW GRANTS TO USER versus role-based inheritance. "
        "Pass when object privileges flow through roles. "
        "Fail when production privileges are granted directly to users. "
        "Insufficient evidence when grant exports omit user-level grants.",
        "Reassign direct grants to roles; remove ad hoc user privileges and revalidate effective access.",
        ["snowflake.showGrantsToUser", "snowflake.accountUsage.grantsToUsers"],
        "Snowflake RBAC",
        "Role-based grants",
    ),
    (
        "sf-rbac-004",
        "PUBLIC role must not grant access to sensitive objects",
        "Critical",
        "P0",
        "RBAC and privilege management",
        "PUBLIC grants apply account-wide and can unintentionally expose data or metadata. "
        "Review grants to PUBLIC on databases, schemas, tables, stages, and warehouses. "
        "Pass when PUBLIC has only safe baseline privileges. "
        "Fail when PUBLIC can read production sensitive objects. "
        "Insufficient evidence when PUBLIC grants are not listed.",
        "Revoke production privileges from PUBLIC; assign access through governed functional roles.",
        ["snowflake.showGrantsToRole PUBLIC", "snowflake.showGrantsOnAccount"],
        "Snowflake Security",
        "PUBLIC role hardening",
    ),
    (
        "sf-rbac-005",
        "OWNERSHIP grants must be limited and reviewed",
        "High",
        "P1",
        "RBAC and privilege management",
        "OWNERSHIP enables grant management and object lifecycle control beyond read/write. "
        "Review ownership on databases, schemas, tables, stages, tasks, and integrations. "
        "Pass when ownership is limited to accountable admin/service roles. "
        "Fail when broad analyst roles own production objects. "
        "Insufficient evidence when ownership grants are not exported.",
        "Transfer ownership to governed admin roles; review ownership quarterly.",
        ["snowflake.showGrantsToRole", "snowflake.showGrantsOnDatabase"],
        "Snowflake RBAC",
        "Ownership governance",
    ),
    (
        "sf-rbac-006",
        "Future grants must be explicitly governed",
        "High",
        "P1",
        "RBAC and privilege management",
        "Future grants expand access automatically as new objects are created. "
        "Review FUTURE GRANTS in role definitions and schema/database defaults. "
        "Pass when future grants are documented and least-privilege. "
        "Fail when future grants grant broad access to analyst or PUBLIC roles. "
        "Insufficient evidence when future grant inventory is missing.",
        "Remove or narrow future grants; require change control for new future grant patterns.",
        ["snowflake.showGrantsToRole", "snowflake.showGrantsOnSchema"],
        "Snowflake RBAC",
        "Future grant control",
    ),
    (
        "sf-rbac-007",
        "Role hierarchy must avoid unintended privilege escalation",
        "High",
        "P0",
        "RBAC and privilege management",
        "Deep or cyclic role grants can accumulate privileges beyond intent. "
        "Review role hierarchy exports and grants of role to role. "
        "Pass when hierarchy is understandable and escalation paths are controlled. "
        "Fail when junior roles inherit admin privileges through nesting. "
        "Insufficient evidence when role hierarchy diagram or exports are absent.",
        "Flatten or redesign role hierarchy; remove escalation paths and validate effective grants.",
        ["snowflake.showGrantsOfRole", "snowflake.showRoles", "governance.ComplianceTags"],
        "Snowflake RBAC",
        "Role hierarchy design",
    ),
    (
        "sf-rbac-008",
        "Service roles must be least-privilege",
        "High",
        "P0",
        "RBAC and privilege management",
        "Over-privileged service roles enable pipeline or integration abuse. "
        "Review grants on service roles for warehouses, stages, tables, and integrations. "
        "Pass when each service role has minimum required privileges. "
        "Fail when service roles own broad database or warehouse access. "
        "Insufficient evidence when service role grants are not shown.",
        "Scope service roles per workload; remove unused privileges and document purpose.",
        ["snowflake.showGrantsToRole", "snowflake.showGrantsOfRole"],
        "CIS Benchmarks",
        "Least privilege for service accounts (thematic)",
    ),
    (
        "sf-rbac-009",
        "Privileged role use must be periodically reviewed",
        "Medium",
        "P1",
        "RBAC and privilege management",
        "Without review, privileged access drifts and accumulates. "
        "Review access review records, ACCOUNT_USAGE grants history, and governance sign-offs. "
        "Pass when privileged roles are reviewed on schedule with evidence. "
        "Fail when no review evidence exists for admin or sensitive-data roles. "
        "Insufficient evidence when review cadence is undocumented.",
        "Implement quarterly privileged access review with owner attestation and remediation tracking.",
        ["governance.RequiredControls", "snowflake.accountUsage.grantsToRoles", "metadata.ChangeDescription"],
        "SOC 2",
        "CC6.2 access review (thematic)",
    ),
    (
        "sf-data-001",
        "Sensitive production data must be classified or tagged",
        "High",
        "P0",
        "Sensitive data protection",
        "Unclassified sensitive tables cannot drive masking, row access, or review controls. "
        "Review object tags, classification exports, and schema inventory for production. "
        "Pass when sensitive production objects carry classification tags. "
        "Fail when likely sensitive production tables lack tags. "
        "Insufficient evidence when classification/tag exports are missing.",
        "Implement object tagging for PHI/PII/PCI/confidential data; cover high-value schemas first.",
        ["snowflake.showTags", "snowflake.tableClassification", "governance.ComplianceTags"],
        "NIST Privacy Framework",
        "Data inventory and classification (thematic)",
    ),
    (
        "sf-data-002",
        "Sensitive tables must have owner or steward metadata",
        "Medium",
        "P1",
        "Sensitive data protection",
        "Without ownership, classification exceptions and access decisions lack accountability. "
        "Review tags, comments, governance metadata, and data catalog exports. "
        "Pass when sensitive tables identify an owner or steward. "
        "Fail when high-value schemas lack ownership metadata. "
        "Insufficient evidence when stewardship model is not documented.",
        "Assign data owners/stewards via tags or catalog; include in access review workflows.",
        ["snowflake.showTags", "governance.RequiredControls", "metadata.ChangeDescription"],
        "Data governance",
        "Data ownership accountability",
    ),
    (
        "sf-data-003",
        "Unclassified production schemas containing likely sensitive data require review",
        "High",
        "P1",
        "Sensitive data protection",
        "Schemas with member, payment, clinical, or credential-like columns need classification scrutiny. "
        "Review DDL extracts, column names, and sample classification coverage reports. "
        "Pass when likely sensitive schemas are classified or explicitly accepted. "
        "Fail when production schemas with sensitive column patterns remain untagged. "
        "Insufficient evidence when schema inventory is incomplete.",
        "Scan production schemas for sensitive patterns; classify or document risk acceptance.",
        ["snowflake.informationSchema.columns", "snowflake.tableClassification", "governance.PolicyConstraints"],
        "HIPAA Security Rule",
        "Information system activity review themes (thematic)",
    ),
    (
        "sf-data-004",
        "Tags and classifications should drive masking, access, or review controls",
        "Medium",
        "P1",
        "Sensitive data protection",
        "Tags without linked controls provide cosmetic governance only. "
        "Review mapping between tags and masking/row access policies or documented equivalents. "
        "Pass when classified tags trigger protective controls or review workflows. "
        "Fail when sensitive tags exist without masking, row access, or access restrictions. "
        "Insufficient evidence when tag-to-control mapping is not shown.",
        "Link classification tags to masking/row access policies and validate effective behavior.",
        ["snowflake.showTags", "snowflake.showMaskingPolicies", "snowflake.showRowAccessPolicies"],
        "Snowflake Tag-based governance",
        "Policy linkage to tags",
    ),
    (
        "sf-prot-001",
        "Sensitive columns must have masking or tokenization controls",
        "Critical",
        "P0",
        "Sensitive data protection",
        "Unmasked sensitive columns allow broad roles to query regulated data beyond minimum necessary use. "
        "Review SHOW MASKING POLICIES, policy references, and column classifications. "
        "Pass when sensitive columns are masked or tokenized appropriately. "
        "Fail when likely PHI/PII/PCI columns lack masking/tokenization. "
        "Insufficient evidence when masking inventory or DDL is absent.",
        "Apply masking or tokenization to sensitive columns; validate by representative roles.",
        ["snowflake.showMaskingPolicies", "snowflake.describeTable", "snowflake.tableClassification"],
        "PCI DSS",
        "Protection of cardholder data (thematic)",
    ),
    (
        "sf-prot-002",
        "Derived tables and views must preserve sensitive-data protections",
        "High",
        "P0",
        "Sensitive data protection",
        "Views, materialized views, clones, and CTAS outputs can bypass source masking or row policies. "
        "Review secure view usage, derived object DDL, and policy attachment on downstream objects. "
        "Pass when derived objects preserve masking and row access controls. "
        "Fail when derived tables expose unmasked sensitive data. "
        "Insufficient evidence when lineage/protection on derived objects is not shown.",
        "Use secure views where required; reapply masking/row policies on derived objects and test outputs.",
        ["snowflake.showViews", "snowflake.showMaterializedViews", "snowflake.showMaskingPolicies"],
        "Snowflake Secure Views",
        "Derived object protection",
    ),
    (
        "sf-prot-003",
        "Multi-tenant or jurisdiction-restricted tables require row access controls",
        "Critical",
        "P0",
        "Sensitive data protection",
        "Shared tables without row segmentation risk cross-tenant or cross-region exposure. "
        "Review row access policies, tenant/region columns, and analyst role grants. "
        "Pass when row access policies or equivalent segmentation is enforced. "
        "Fail when multi-tenant tables lack row access controls. "
        "Insufficient evidence when table tenancy model is undocumented.",
        "Implement row access policies for tenant/region/business-unit columns; test cross-tenant queries fail.",
        ["snowflake.showRowAccessPolicies", "snowflake.describeTable", "snowflake.showGrantsToRole"],
        "Snowflake Row Access Policies",
        "Row-level segmentation",
    ),
    (
        "sf-prot-004",
        "Masking and row access policies must be tested by role",
        "Medium",
        "P1",
        "Sensitive data protection",
        "Policies that are untested may not enforce intended visibility. "
        "Review test scripts, query samples, or validation reports by role. "
        "Pass when masking/row access behavior is validated per role class. "
        "Fail when no test evidence exists for production policies. "
        "Insufficient evidence when policy tests are not provided.",
        "Execute role-based SELECT tests documenting masked/unmasked outcomes; store results for audit.",
        ["governance.RequiredControls", "metadata.ChangeDescription", "snowflake.queryHistorySample"],
        "SOC 2",
        "Control operating effectiveness (thematic)",
    ),
    (
        "sf-prot-005",
        "Privileged masking bypass must be documented and limited",
        "High",
        "P1",
        "Sensitive data protection",
        "Masking policies that exempt broad admin roles undermine sensitive-data protection. "
        "Review masking policy body, exempt roles, and approval records. "
        "Pass when bypass roles are minimal, monitored, and approved. "
        "Fail when analyst or wide admin roles bypass masking without justification. "
        "Insufficient evidence when masking policy definitions are missing.",
        "Limit bypass to named break-glass roles; monitor unmasked queries and document approvals.",
        ["snowflake.showMaskingPolicies", "snowflake.accountUsage.queryHistory"],
        "HIPAA Security Rule",
        "Minimum necessary (thematic)",
    ),
    (
        "sf-net-001",
        "Administrative access should be restricted by network policy or approved equivalent",
        "High",
        "P0",
        "Network security",
        "Unrestricted admin login paths increase credential theft impact. "
        "Review SHOW NETWORK POLICIES, account parameters, and private connectivity design. "
        "Pass when admin paths are network-restricted or equivalent controls exist. "
        "Fail when ACCOUNTADMIN users can authenticate from any network without restriction. "
        "Insufficient evidence when network policies are not exported.",
        "Apply network policies to admin roles/users; pair with SSO and IP allowlists.",
        ["snowflake.showNetworkPolicies", "governance.PolicyConstraints"],
        "Snowflake Network Policies",
        "Administrative network restriction",
    ),
    (
        "sf-net-002",
        "Production account access from broad internet ranges requires risk acceptance",
        "High",
        "P1",
        "Network security",
        "Permissive IP ranges increase exposure to credential stuffing and data exfiltration. "
        "Review network policy allowed lists and remote access patterns. "
        "Pass when production access is limited to managed networks or documented exceptions. "
        "Fail when 0.0.0.0/0 or overly broad ranges are allowed for production roles. "
        "Insufficient evidence when network policy details are absent.",
        "Tighten network policies; document and expire any broad-range exceptions.",
        ["snowflake.showNetworkPolicies", "snowflake.accountUsage.loginHistory"],
        "NIST CSF",
        "PR.AC-5 network integrity (thematic)",
    ),
    (
        "sf-net-003",
        "Private connectivity requirements must be evidenced for regulated workloads",
        "High",
        "P1",
        "Network security",
        "Regulated workloads often require PrivateLink or approved private paths instead of public endpoints. "
        "Review architecture diagrams, PrivateLink configuration, and network policy design. "
        "Pass when private connectivity is documented for regulated paths. "
        "Fail when regulated data paths rely on public internet without acceptance. "
        "Insufficient evidence when connectivity architecture is not provided.",
        "Implement PrivateLink or approved private access; update network policies accordingly.",
        ["governance.PolicyConstraints", "metadata.ChangeDescription", "snowflake.privateLink"],
        "Enterprise network security",
        "Private connectivity for regulated data",
    ),
    (
        "sf-net-004",
        "External network access must be allowlisted and governed",
        "High",
        "P1",
        "Network security",
        "External access integrations can egress data to unmanaged endpoints. "
        "Review external access integrations, network rules, and allowlists. "
        "Pass when outbound network access is explicitly allowlisted and owned. "
        "Fail when integrations can reach broad external hosts without governance. "
        "Insufficient evidence when external access configuration is missing.",
        "Define network rules with minimal host allowlists; review integrations quarterly.",
        ["snowflake.showIntegrations", "snowflake.showNetworkRules", "snowflake.externalAccessIntegrations"],
        "Snowflake External Access",
        "Outbound allowlisting",
    ),
    (
        "sf-stage-001",
        "External stages must use governed storage integrations, not embedded credentials",
        "Critical",
        "P0",
        "Data sharing and exfiltration",
        "Inline credentials in stage definitions are hard to rotate and audit. "
        "Review SHOW STAGES, DESCRIBE STAGE, and storage integration references. "
        "Pass when external stages use storage integrations with cloud IAM roles. "
        "Fail when stages embed secrets or long-lived keys in URLs/options. "
        "Insufficient evidence when stage definitions are not provided.",
        "Migrate stages to storage integrations; remove embedded credentials and rotate cloud identities.",
        ["snowflake.showStages", "snowflake.describeStage", "snowflake.showIntegrations"],
        "Snowflake Storage Integrations",
        "Stage credential hygiene",
    ),
    (
        "sf-stage-002",
        "Storage integrations must be least-privilege",
        "High",
        "P0",
        "Data sharing and exfiltration",
        "Over-scoped cloud IAM roles increase blast radius if Snowflake stage access is misused. "
        "Review storage integration cloud IAM policies and allowed locations/prefixes. "
        "Pass when integrations can access only required bucket/container paths. "
        "Fail when integrations can list or read broad storage accounts. "
        "Insufficient evidence when cloud IAM scope is not shown.",
        "Restrict storage integration IAM to minimum prefix; separate ingest and export paths.",
        ["snowflake.showIntegrations", "snowflake.terraform.storageIntegration", "governance.PolicyConstraints"],
        "Cloud IAM",
        "Least-privilege storage access (thematic)",
    ),
    (
        "sf-stage-003",
        "Unload and export locations must be controlled and monitored",
        "High",
        "P0",
        "Data sharing and exfiltration",
        "Uncontrolled COPY INTO/unload paths enable data exfiltration. "
        "Review unload stages, query history for COPY INTO, and export monitoring design. "
        "Pass when export locations are governed and monitored. "
        "Fail when users can unload to unmanaged external locations. "
        "Insufficient evidence when export/unload patterns are not described.",
        "Restrict unload stages to approved integrations; alert on large exports.",
        ["snowflake.showStages", "snowflake.accountUsage.queryHistory", "snowflake.copyIntoPatterns"],
        "Data exfiltration prevention",
        "Controlled unload paths",
    ),
    (
        "sf-stage-004",
        "Sensitive staged files require retention and cleanup controls",
        "Medium",
        "P1",
        "Data sharing and exfiltration",
        "Temporary stages and export files may retain sensitive data beyond need. "
        "Review stage lifecycle, cloud object retention, and cleanup jobs. "
        "Pass when sensitive staged files have retention and deletion controls. "
        "Fail when sensitive exports persist without lifecycle management. "
        "Insufficient evidence when stage retention practices are undocumented.",
        "Define retention for temp/export stages; automate cleanup and verify in cloud storage.",
        ["snowflake.showStages", "governance.PolicyConstraints", "metadata.ChangeDescription"],
        "Data lifecycle",
        "Stage file retention",
    ),
    (
        "sf-stage-005",
        "External functions must not send sensitive data to unmanaged endpoints",
        "Critical",
        "P0",
        "Operational governance",
        "External functions and API integrations can egress query results or parameters off-platform. "
        "Review external function definitions, secrets, network rules, and endpoint allowlists. "
        "Pass when endpoints are approved and sensitive payloads are controlled. "
        "Fail when functions call unmanaged endpoints with sensitive inputs. "
        "Insufficient evidence when external function inventory is missing.",
        "Allowlist external function endpoints; redact or block sensitive columns from function calls.",
        ["snowflake.showExternalFunctions", "snowflake.externalAccessIntegrations", "snowflake.showNetworkRules"],
        "Snowflake External Functions",
        "Managed endpoint egress",
    ),
    (
        "sf-log-001",
        "Login and query activity must be retained and reviewable",
        "High",
        "P0",
        "Logging and monitoring",
        "Without retained login/query history, investigations and audits are impaired. "
        "Review ACCOUNT_USAGE retention, export processes, and review cadence. "
        "Pass when login and query history meet retention and review requirements. "
        "Fail when retention is shorter than compliance needs or reviews are absent. "
        "Insufficient evidence when retention/review design is not documented.",
        "Configure retention aligned to policy; schedule login/query reviews and archive to durable store.",
        ["snowflake.accountUsage.loginHistory", "snowflake.accountUsage.queryHistory", "governance.RequiredControls"],
        "SOC 2",
        "CC7.2 monitoring (thematic)",
    ),
    (
        "sf-log-002",
        "Privileged actions must be monitored",
        "High",
        "P0",
        "Logging and monitoring",
        "Undetected privileged changes to roles, integrations, or policies increase compromise dwell time. "
        "Review alerts on ACCOUNTADMIN/SECURITYADMIN actions and admin query patterns. "
        "Pass when privileged actions generate alerts or SIEM events. "
        "Fail when no monitoring exists for privileged role activity. "
        "Insufficient evidence when monitoring design is not provided.",
        "Alert on privileged grants, integration changes, and policy edits; integrate with SIEM.",
        ["snowflake.accountUsage.queryHistory", "snowflake.siemIntegration", "governance.PolicyConstraints"],
        "NIST CSF",
        "DE.CM-1 network monitoring (thematic)",
    ),
    (
        "sf-log-003",
        "Mass export and unload activity must be detectable",
        "High",
        "P1",
        "Logging and monitoring",
        "Large COPY INTO or result downloads may indicate exfiltration. "
        "Review query history alerts, bytes scanned thresholds, and unload monitoring. "
        "Pass when mass export/unload patterns trigger alerts. "
        "Fail when large exports occur without detection mechanisms. "
        "Insufficient evidence when export monitoring is not described.",
        "Define thresholds for COPY INTO/bytes transferred; alert and investigate anomalies.",
        ["snowflake.accountUsage.queryHistory", "snowflake.copyIntoPatterns", "snowflake.siemIntegration"],
        "Data loss prevention",
        "Export anomaly detection",
    ),
    (
        "sf-log-004",
        "Snowflake audit events should integrate with SIEM or equivalent monitoring",
        "Medium",
        "P1",
        "Logging and monitoring",
        "Centralized monitoring improves correlation and incident response. "
        "Review SIEM ingestion design, log export jobs, and alert runbooks. "
        "Pass when Snowflake audit/login/query events feed SIEM or equivalent. "
        "Fail when no central monitoring integration is evidenced. "
        "Insufficient evidence when logging architecture is absent.",
        "Integrate ACCOUNT_USAGE and alert streams with SIEM; document alert ownership.",
        ["snowflake.siemIntegration", "governance.RequiredControls", "metadata.ChangeDescription"],
        "SOC 2",
        "CC7.3 incident response support (thematic)",
    ),
    (
        "sf-log-005",
        "Access reviews must be evidenced for privileged and sensitive-data roles",
        "Medium",
        "P1",
        "Logging and monitoring",
        "Periodic review reduces privilege drift for roles touching sensitive data. "
        "Review access review exports, attestations, and remediation records. "
        "Pass when reviews occur on schedule with named owners. "
        "Fail when sensitive-data roles lack review evidence. "
        "Insufficient evidence when review process is undocumented.",
        "Run quarterly reviews for privileged/sensitive roles; track removals and exceptions.",
        ["governance.RequiredControls", "snowflake.accountUsage.grantsToRoles", "metadata.ChangeDescription"],
        "ISO 27001",
        "A.9.2.5 review of user access rights (thematic)",
    ),
    (
        "sf-key-001",
        "Key management model must satisfy workload sensitivity and enterprise policy",
        "High",
        "P1",
        "Key management and encryption",
        "Encryption ownership must match data sensitivity and enterprise KMS requirements. "
        "Review encryption-at-rest posture, Tri-Secret Secure, and key custody documentation. "
        "Pass when key model aligns with workload classification and enterprise policy. "
        "Fail when regulated workloads use default encryption without required enterprise controls. "
        "Insufficient evidence when encryption/key model is not documented.",
        "Document encryption and key custody; implement CMK/Tri-Secret Secure where required.",
        ["governance.PolicyConstraints", "governance.ComplianceTags", "metadata.ChangeDescription"],
        "NIST CSF",
        "PR.DS-1 data-at-rest protection (thematic)",
    ),
    (
        "sf-key-002",
        "External storage encryption must be evidenced",
        "High",
        "P1",
        "Key management and encryption",
        "Data in external stages relies on cloud storage encryption as well as Snowflake controls. "
        "Review cloud bucket/container encryption settings tied to storage integrations. "
        "Pass when external storage uses required encryption (SSE-KMS/CMK etc.). "
        "Fail when external locations lack encryption evidence. "
        "Insufficient evidence when cloud storage config is not provided.",
        "Enable required cloud encryption on stage locations; document key ownership.",
        ["snowflake.terraform.storageIntegration", "snowflake.showIntegrations", "governance.ComplianceTags"],
        "Cloud storage security",
        "External stage encryption (thematic)",
    ),
    (
        "sf-key-003",
        "Customer-managed key or enhanced key-control requirements must be assessed for regulated data",
        "Medium",
        "P1",
        "Key management and encryption",
        "Some regulated programs require CMK or Tri-Secret Secure rather than default Snowflake-managed keys. "
        "Review compliance tags, enterprise KMS standards, and Snowflake encryption parameters. "
        "Pass when CMK/enhanced controls are implemented or formally deferred with acceptance. "
        "Fail when regulated data lacks required key-control assessment. "
        "Insufficient evidence when workload regulation context is unknown.",
        "Assess CMK/Tri-Secret Secure need per workload; document decision and exceptions.",
        ["governance.ComplianceTags", "governance.PolicyConstraints", "metadata.ChangeDescription"],
        "Enterprise encryption policy",
        "Customer-managed keys for regulated data",
    ),
    (
        "sf-share-001",
        "Outbound data shares must be approved and classified",
        "High",
        "P0",
        "Data sharing and exfiltration",
        "Outbound shares move data across account boundaries and require governance. "
        "Review SHOW SHARES, share grants, and approval records. "
        "Pass when each outbound share is approved and classified. "
        "Fail when shares exist without documented authorization. "
        "Insufficient evidence when share inventory is missing.",
        "Inventory outbound shares; require classification and approval before publication.",
        ["snowflake.showShares", "governance.RequiredControls", "governance.ComplianceTags"],
        "Snowflake Data Sharing",
        "Outbound share approval",
    ),
    (
        "sf-share-002",
        "Shared objects must not expose sensitive data without documented authorization",
        "Critical",
        "P0",
        "Data sharing and exfiltration",
        "Shares can expose tables/views with sensitive columns if masking/row policies do not apply cross-account. "
        "Review shared object lists, classifications, and consumer contracts. "
        "Pass when sensitive shared objects have documented authorization and controls. "
        "Fail when sensitive datasets are shared without approval. "
        "Insufficient evidence when shared object inventory is incomplete.",
        "Remove sensitive objects from shares or apply approved sharing pattern with legal/compliance sign-off.",
        ["snowflake.showShares", "snowflake.tableClassification", "governance.PolicyConstraints"],
        "Data sharing governance",
        "Sensitive data in shares",
    ),
    (
        "sf-share-003",
        "Reader accounts and consumers require periodic access review",
        "Medium",
        "P1",
        "Data sharing and exfiltration",
        "Consumer access can persist after business need ends. "
        "Review reader account list, consumer mappings, and review attestations. "
        "Pass when consumer access is reviewed on schedule. "
        "Fail when reader accounts lack review evidence. "
        "Insufficient evidence when consumer inventory is absent.",
        "Review reader accounts/consumers quarterly; revoke unused access.",
        ["snowflake.showShares", "snowflake.readerAccounts", "governance.RequiredControls"],
        "SOC 2",
        "Third-party access review (thematic)",
    ),
    (
        "sf-share-004",
        "Data sharing revocation process must be documented",
        "Medium",
        "P2",
        "Data sharing and exfiltration",
        "Without revocation runbooks, shared data may remain accessible after contract termination. "
        "Review share revocation procedures and past revocation records. "
        "Pass when revocation steps and owners are documented. "
        "Fail when no revocation process exists for outbound shares. "
        "Insufficient evidence when sharing lifecycle is not described.",
        "Document share revocation runbook including consumer notification and verification queries.",
        ["governance.PolicyConstraints", "metadata.ChangeDescription", "snowflake.showShares"],
        "Vendor management",
        "Share revocation procedure",
    ),
    (
        "sf-sdlc-001",
        "Production data in nonproduction environments must be masked, minimized, or approved",
        "Critical",
        "P0",
        "Dev/test/prod governance",
        "Dev/test clones with production sensitive data increase breach and compliance risk. "
        "Review clone inventory, masking in nonprod, and risk acceptance records. "
        "Pass when nonprod uses masked/minimized data or documented approval. "
        "Fail when full production sensitive clones exist in dev/test without controls. "
        "Insufficient evidence when environment data lineage is not shown.",
        "Mask or subset production data in nonprod; prohibit full sensitive clones without acceptance.",
        ["snowflake.showDatabases", "snowflake.showClones", "snowflake.showMaskingPolicies"],
        "HIPAA Security Rule",
        "Minimum necessary in nonproduction (thematic)",
    ),
    (
        "sf-sdlc-002",
        "Role, grant, policy, and integration changes must be peer-reviewed or change-controlled",
        "High",
        "P0",
        "Dev/test/prod governance",
        "Manual privilege changes without review cause privilege drift and audit gaps. "
        "Review change tickets, IaC pull requests, and peer review evidence for Snowflake changes. "
        "Pass when changes follow peer review or formal change control. "
        "Fail when production grants/policies change ad hoc without review. "
        "Insufficient evidence when change process is undocumented.",
        "Require PR/change ticket for Snowflake DDL/grants; store approval evidence.",
        ["snowflake.terraform", "governance.RequiredControls", "metadata.ChangeDescription"],
        "ITIL change management",
        "Controlled configuration changes (thematic)",
    ),
    (
        "sf-sdlc-003",
        "Environment boundaries must be clear and documented",
        "Medium",
        "P1",
        "Dev/test/prod governance",
        "Unclear dev/test/prod separation leads to wrong-environment access and data mixing. "
        "Review account/database naming, role boundaries, and architecture diagrams. "
        "Pass when environment boundaries are documented and reflected in RBAC. "
        "Fail when prod and nonprod boundaries are ambiguous. "
        "Insufficient evidence when environment model is not provided.",
        "Document account/database boundaries; align roles and warehouses per environment.",
        ["governance.PolicyConstraints", "metadata.ChangeDescription", "snowflake.showDatabases"],
        "Architecture governance",
        "Environment separation",
    ),
    (
        "sf-sdlc-004",
        "Snowflake configuration should be managed as code where practical",
        "Medium",
        "P2",
        "Dev/test/prod governance",
        "IaC improves repeatability, review, and drift detection for Snowflake security settings. "
        "Review Terraform/Pulumi/schemachange artifacts and deployment pipelines. "
        "Pass when critical config is managed as code with review. "
        "Fail when security-sensitive objects are only managed manually at scale. "
        "Insufficient evidence when IaC approach is not described.",
        "Manage roles, grants, policies, and integrations via reviewed IaC pipelines.",
        ["snowflake.terraform", "governance.RequiredControls", "metadata.ChangeDescription"],
        "Secure SDLC",
        "Infrastructure as code for Snowflake",
    ),
    (
        "sf-comp-001",
        "PHI workloads require evidence of access control, masking/classification, auditability, and minimum necessary use",
        "High",
        "P0",
        "Compliance readiness",
        "Healthcare workloads need demonstrable safeguards beyond generic security hygiene. "
        "Review PHI tags, masking, access reviews, and audit retention when PHI is evidenced. "
        "Pass when PHI controls are evidenced end-to-end. "
        "Fail when PHI is indicated but masking/access/audit evidence is missing. "
        "Not applicable when no PHI is evidenced; insufficient evidence when workload type is unknown.",
        "Map PHI tables to classification, masking, row access, and audit controls; document minimum necessary roles.",
        ["governance.ComplianceTags", "snowflake.showMaskingPolicies", "snowflake.accountUsage.queryHistory"],
        "HIPAA Security Rule",
        "Safeguards for ePHI (thematic)",
    ),
    (
        "sf-comp-002",
        "PCI-like data requires tokenization/masking and restricted access evidence",
        "High",
        "P0",
        "Compliance readiness",
        "Payment or cardholder-like fields require strong column protection and restricted roles. "
        "Review PCI tags, masking/tokenization, and role grants on payment schemas. "
        "Pass when PCI-like data has masking/tokenization and restricted access. "
        "Fail when cardholder-like columns are broadly readable. "
        "Not applicable when no PCI-like data is evidenced.",
        "Tokenize or mask PCI-like columns; restrict roles and monitor access.",
        ["snowflake.showMaskingPolicies", "snowflake.tableClassification", "snowflake.showGrantsToRole"],
        "PCI DSS",
        "Protect stored cardholder data (thematic)",
    ),
    (
        "sf-comp-003",
        "Data residency requirements must be mapped to Snowflake account region, replication, sharing, and external stages",
        "High",
        "P1",
        "Compliance readiness",
        "Cross-border replication, sharing, or external stages can violate residency obligations. "
        "Review account region, replication config, shares, and stage cloud regions. "
        "Pass when residency requirements are mapped to Snowflake topology. "
        "Fail when residency is required but cross-region paths are unaddressed. "
        "Insufficient evidence when residency requirements are not stated.",
        "Document region/replication/sharing/stage map; block noncompliant cross-region paths.",
        ["governance.ComplianceTags", "snowflake.showShares", "snowflake.showStages", "metadata.ChangeDescription"],
        "GDPR",
        "Cross-border transfer controls (thematic)",
    ),
    (
        "sf-comp-004",
        "Exceptions must have owner, rationale, expiry, and renewal review",
        "Medium",
        "P1",
        "Compliance readiness",
        "Permanent security exceptions undermine control effectiveness and audits. "
        "Review exception register, owners, expiry dates, and renewal approvals. "
        "Pass when exceptions are time-bound with accountable owners. "
        "Fail when open-ended exceptions lack renewal review. "
        "Insufficient evidence when exception process is not documented.",
        "Maintain exception register with owner, rationale, expiry, and renewal workflow.",
        ["governance.PolicyConstraints", "metadata.ChangeDescription", "governance.RequiredControls"],
        "Risk management",
        "Time-bound control exceptions",
    ),
    (
        "sf-wh-001",
        "Production warehouses must use auto-suspend and appropriate sizing",
        "Medium",
        "P2",
        "Operational governance",
        "Oversized always-on warehouses increase cost and broaden compute access windows. "
        "Review warehouse properties, auto-suspend/resume, and role grants. "
        "Pass when production warehouses auto-suspend and sizes match workload. "
        "Fail when warehouses never suspend or are oversized without justification. "
        "Insufficient evidence when warehouse inventory is missing.",
        "Enable auto-suspend; right-size warehouses and restrict grants to needed roles.",
        ["snowflake.showWarehouses", "snowflake.accountUsage.warehouseMeteringHistory"],
        "FinOps",
        "Warehouse auto-suspend (thematic)",
    ),
    (
        "sf-wh-002",
        "Resource monitors should protect production warehouses from runaway cost or abuse",
        "Low",
        "P2",
        "Operational governance",
        "Missing resource monitors allow unbounded credit consumption and delayed detection of abuse. "
        "Review resource monitor configuration and alert routing. "
        "Pass when production warehouses have monitors or equivalent controls. "
        "Fail when high-risk warehouses lack credit limits/monitors. "
        "Insufficient evidence when warehouse governance is not described.",
        "Configure resource monitors with alerts; tie to incident response for anomalies.",
        ["snowflake.showWarehouses", "snowflake.resourceMonitors", "governance.PolicyConstraints"],
        "Operational governance",
        "Warehouse resource monitors",
    ),
    (
        "sf-derived-001",
        "Development clones containing production sensitive data require equivalent controls or masking",
        "High",
        "P1",
        "Sensitive data protection",
        "Clones can copy production sensitive data with weaker downstream controls. "
        "Review clone lineage, environment tags, and masking on cloned objects. "
        "Pass when sensitive clones inherit controls or are masked/subset. "
        "Fail when dev clones expose uncontrolled production sensitive data. "
        "Insufficient evidence when clone inventory is absent.",
        "Mask or restrict sensitive clones; limit clone access roles and lifecycle.",
        ["snowflake.showClones", "snowflake.showMaskingPolicies", "snowflake.showDatabases"],
        "Snowflake Zero Copy Clone",
        "Clone sensitive-data governance",
    ),
    (
        "sf-task-001",
        "Tasks, streams, and stored procedures must use least-privilege owners and reviewed execution context",
        "High",
        "P1",
        "Operational governance",
        "Tasks/procedures running as owner with elevated privileges can bypass user-level controls. "
        "Review task/procedure owners, EXECUTE AS settings, and change history. "
        "Pass when owners are least-privilege and execution context is reviewed. "
        "Fail when high-privilege roles own broad automation without review. "
        "Insufficient evidence when task/procedure inventory is missing.",
        "Assign dedicated service roles to tasks/procedures; review EXECUTE AS CALLER vs OWNER choices.",
        ["snowflake.showTasks", "snowflake.showProcedures", "snowflake.showGrantsToRole"],
        "Snowflake Tasks",
        "Automation privilege model",
    ),
]


def build_curated_document() -> dict:
    rules = []

    for (
        rule_id,
        title,
        severity,
        priority,
        category,
        description,
        remediation,
        evidence_hints,
        framework,
        requirement,
    ) in RULES:
        rules.append(
            {
                "id": rule_id,
                "title": title,
                "description": f"Category: {category}. {description}",
                "severity": severity,
                "priority": priority,
                "remediationGuidance": remediation,
                "evidenceHints": evidence_hints,
                "frameworkMappings": [{"framework": framework, "requirement": requirement}],
            }
        )

    return {
        "schemaVersion": 1,
        "kind": "archlucid.policyPack.curatedRules.v1",
        "pack": {
            "name": "Snowflake Security",
            "description": "Snowflake-specific security, governance, least privilege, sensitive-data protection, auditability, and operational risk checks for architecture reviews. Thematic mapping only — not certification or compliance attestation.",
            "version": "1.0.0",
            "category": "Data Platform Security",
            "isDefault": True,
            "suggestedPackType": "PlatformDefault",
            "policyPackContentDocumentPath": "docs/samples/policy-packs/snowflake-security.json",
        },
        "rules": rules,
    }


def build_content_document() -> dict:
    rule_keys = [rule[0] for rule in RULES]

    return {
        "complianceRuleIds": [],
        "complianceRuleKeys": rule_keys,
        "alertRuleIds": [],
        "compositeAlertRuleIds": [],
        "advisoryDefaults": {
            "severityFloor": "warning",
            "priorityFloor": "P0",
            "scanDepth": "standard",
        },
        "metadata": {
            "templateId": "snowflake-security-v1",
            "pack.displayName": "Snowflake Security",
            "pack.category": "Data Platform Security",
            "pack.version": "1.0.0",
            "pack.isDefault": "true",
            "pack.description": "Snowflake-specific identity, RBAC, masking, network, sharing, logging, encryption, and compliance-readiness checks for architecture reviews. Not Snowflake certification or statutory compliance.",
            "frameworkMappingDisclaimer": "Framework and regulation references are thematic mapping only — not certification, attestation, or legal compliance.",
            "curatedRulesArtifact": "docs/samples/policy-packs/snowflake-security-rules-v1.json",
            "pack.appliesTo": "Snowflake accounts; databases; schemas; tables and views; roles and grants; stages and storage integrations; data sharing; tasks; streams; functions; procedures; Snowpark workloads",
            "pack.intendedUsers": "enterprise architects; cloud security architects; data platform owners; compliance reviewers; governance boards; audit stakeholders",
        },
    }


def category_for_rule(rule_id: str) -> str:
    prefix = rule_id.split("-")[1] if rule_id.startswith("sf-") else "governance"

    mapping = {
        "id": "identity",
        "rbac": "access",
        "data": "data",
        "prot": "data",
        "net": "network",
        "stage": "integration",
        "log": "logging",
        "key": "encryption",
        "share": "sharing",
        "sdlc": "governance",
        "comp": "compliance",
        "wh": "compute",
        "derived": "data",
        "task": "integration",
    }

    return mapping.get(prefix, "governance")


def append_ga_starter_stubs() -> None:
    document = json.loads(GA_STARTER_PATH.read_text(encoding="utf-8"))
    existing = {rule["ruleId"] for rule in document["rules"]}
    curated = build_curated_document()

    for rule in curated["rules"]:
        rule_id = rule["id"]

        if rule_id in existing:
            continue

        control_id = rule_id.upper().replace("-", "-")

        document["rules"].append(
            {
                "ruleId": rule_id,
                "controlId": control_id,
                "controlName": rule["title"],
                "appliesToCategory": category_for_rule(rule_id),
                "requiredNodeType": "PolicyControl",
                "requiredEdgeType": "APPLIES_TO",
                "severity": "Warning",
                "description": f"Stub for {rule_id}; see docs/samples/policy-packs/snowflake-security-rules-v1.json for narrative.",
                "priority": rule["priority"],
            }
        )

    GA_STARTER_PATH.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    curated = build_curated_document()
    CURATED_PATH.write_text(json.dumps(curated, indent=2) + "\n", encoding="utf-8")

    content = build_content_document()
    bundled_path = REPO_ROOT / "ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/snowflake-security.json"
    sample_path = REPO_ROOT / "docs/samples/policy-packs/snowflake-security.json"

    bundled_path.write_text(json.dumps(content, indent=2) + "\n", encoding="utf-8")
    sample_path.write_text(json.dumps(content, indent=2) + "\n", encoding="utf-8")

    append_ga_starter_stubs()

    print(f"Wrote {len(RULES)} rules to {CURATED_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
