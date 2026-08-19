#!/usr/bin/env python3
"""Apply AWS-native copy fixes to peer-generated aws-data-layer-security curated rules (TB-715)."""

from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
RULES_PATH = REPO / "docs" / "samples" / "policy-packs" / "aws-data-layer-security-rules-v1.json"

RULE_COPY: dict[str, dict[str, str]] = {
    "aws-data-001": {
        "title": "RDS encryption at rest enabled for all databases",
        "description": (
            "Every RDS or Aurora database storing sensitive data must document encryption at rest "
            "with AWS KMS."
        ),
        "remediationGuidance": (
            "Tag encryption-at-rest on datastores[].Tags; verify storageEncrypted in awsExtractor RDS inventory."
        ),
    },
    "aws-data-002": {
        "title": "RDS and database audit logs to secure destination",
        "description": (
            "Database audit and activity logs must route to CloudWatch Logs, S3, or CloudTrail data events — "
            "not disabled."
        ),
        "remediationGuidance": "List audit destination in governance.RequiredControls.",
    },
    "aws-data-003": {
        "title": "RDS threat detection and Security Hub controls",
        "description": (
            "RDS instances must document GuardDuty RDS protection findings or Security Hub "
            "database security controls enabled."
        ),
    },
    "aws-data-004": {
        "title": "RDS security groups and VPC-only access",
        "description": (
            "RDS must document security-group allowlists and private subnet placement — "
            "not public internet accessibility."
        ),
        "remediationGuidance": (
            "Map VPC security groups in metadata.ChangeDescription; align with awsExtractor RDS inventory."
        ),
    },
    "aws-data-005": {
        "title": "IAM database authentication preferred over passwords",
        "description": (
            "RDS and Aurora should document IAM database authentication or Secrets Manager rotation — "
            "not long-lived master passwords in application config."
        ),
    },
    "aws-data-006": {
        "title": "Row-level or tenant isolation documented where multi-tenant",
        "description": (
            "Multi-tenant data stores must document application-level RLS, schema separation, "
            "or per-tenant DynamoDB partition keys."
        ),
    },
    "aws-data-007": {
        "title": "Field-level encryption for highly sensitive columns",
        "description": (
            "Highly sensitive columns must document KMS envelope encryption, DynamoDB client-side encryption, "
            "or application-layer tokenization."
        ),
    },
    "aws-data-008": {
        "title": "DynamoDB VPC endpoints and resource policies",
        "description": (
            "DynamoDB tables must document VPC interface endpoints and restrictive resource policies — "
            "not open public access."
        ),
    },
    "aws-data-009": {
        "title": "DynamoDB encryption with customer-managed KMS keys",
        "description": (
            "DynamoDB tables storing regulated data must document server-side encryption with "
            "customer-managed KMS keys."
        ),
    },
    "aws-data-010": {
        "title": "DynamoDB IAM policies over long-lived access keys",
        "description": (
            "Application access to DynamoDB must use IAM roles and fine-grained resource policies — "
            "not embedded access keys."
        ),
    },
    "aws-data-011": {
        "title": "DynamoDB consistency and conditional writes for isolation",
        "description": (
            "DynamoDB access patterns must document consistent reads or conditional writes "
            "where tenant isolation depends on item-level guards."
        ),
    },
    "aws-data-012": {
        "title": "S3 bucket encryption and bucket-key optimization",
        "description": (
            "S3 buckets must document SSE-KMS or SSE-S3 with bucket keys for data at rest."
        ),
    },
    "aws-data-013": {
        "title": "S3 Object Lock for audit and compliance objects",
        "description": (
            "Audit and compliance S3 prefixes must document Object Lock governance or compliance mode."
        ),
    },
    "aws-data-014": {
        "title": "S3 presigned URLs with minimal permission and short expiry",
        "description": (
            "Presigned URL patterns must document least-privilege actions and short TTL — "
            "not broad read/write grants."
        ),
    },
    "aws-data-015": {
        "title": "S3 prefix policies and Lake Formation-style access",
        "description": (
            "Data lake S3 layouts must document prefix-scoped IAM policies or Lake Formation "
            "grants for fine-grained access."
        ),
    },
    "aws-data-016": {
        "title": "Redshift and analytics VPC endpoints",
        "description": (
            "Redshift, Athena, or analytics workspaces must document VPC endpoints or private "
            "connectivity — not public query endpoints."
        ),
    },
    "aws-data-017": {
        "title": "Macie or Glue data classification coverage",
        "description": (
            "Sensitive data stores must document Macie classification jobs or Glue Data Catalog "
            "sensitivity labels."
        ),
    },
    "aws-data-018": {
        "title": "Masked or redacted non-production database copies",
        "description": (
            "Non-production RDS snapshots or restores must document masking, subsetting, "
            "or synthetic data substitution."
        ),
    },
    "aws-data-019": {
        "title": "Backup encryption and cross-region replication for databases",
        "description": (
            "RDS automated backups and cross-region replicas must document KMS encryption "
            "and geo-redundancy expectations."
        ),
    },
    "aws-data-020": {
        "title": "KMS key separation for data encryption keys",
        "description": (
            "Data encryption keys must use dedicated KMS keys — not reused application or logging keys."
        ),
    },
    "aws-data-021": {
        "title": "IAM roles for application data-plane access",
        "description": (
            "Applications accessing RDS, DynamoDB, or S3 must use IAM roles — not long-lived "
            "credentials in configuration."
        ),
    },
    "aws-data-022": {
        "title": "RDS vulnerability assessment remediation",
        "description": (
            "RDS instances must document Security Hub/Inspector findings remediation "
            "for known database misconfigurations."
        ),
    },
    "aws-data-023": {
        "title": "DynamoDB partition key prevents cross-tenant leakage",
        "description": (
            "Multi-tenant DynamoDB designs must document tenant-scoped partition keys "
            "and condition expressions."
        ),
    },
    "aws-data-024": {
        "title": "Diagnostic logs for all data services",
        "description": (
            "RDS, DynamoDB, and S3 must export audit and access logs to CloudWatch or S3 logging buckets."
        ),
    },
    "aws-data-025": {
        "title": "S3 data exfiltration monitoring",
        "description": (
            "S3 buckets must document access logging, Macie findings, or anomaly detection "
            "for unusual download patterns."
        ),
    },
    "aws-data-026": {
        "title": "Aurora Serverless and capacity SKU security implications",
        "description": (
            "Serverless or burstable database SKUs must document scaling, credential rotation, "
            "and network exposure trade-offs."
        ),
    },
    "aws-data-027": {
        "title": "Cross-account data access documented",
        "description": (
            "Cross-account RDS snapshots, S3 replication, or DynamoDB access must document "
            "resource policies and approval workflow."
        ),
    },
    "aws-data-028": {
        "title": "Data-layer DR tested with KMS keys available",
        "description": (
            "Database DR runbooks must document KMS key availability in the failover region "
            "and encrypted backup restore validation."
        ),
    },
}

THEME_COPY: dict[str, str] = {
    "AWS data services — TDE": "AWS data services — Encryption at rest",
    "AWS data services — SQL auditing": "AWS data services — RDS auditing",
    "AWS data services — Private endpoints": "AWS data services — VPC endpoints",
}


def dedupe_hints(hints: list[str]) -> list[str]:
    fixed: list[str] = []
    for hint in hints:
        normalized = hint.replace("awsExtractor.manifest.manifest.", "awsExtractor.manifest.")
        if normalized not in fixed:
            fixed.append(normalized)
    return fixed


def apply_global_text(text: str) -> str:
    pairs = [
        ("Azure SQL", "RDS"),
        ("Cosmos DB", "DynamoDB"),
        ("Cosmos", "DynamoDB"),
        ("Key Vault", "KMS"),
        ("Log Analytics", "CloudWatch Logs"),
        ("private endpoint", "VPC endpoint"),
        ("Private endpoint", "VPC endpoint"),
        ("VNet", "VPC"),
        ("AAD", "IAM"),
        ("Transparent Data Encryption", "encryption at rest"),
        ("Synapse", "Redshift"),
        ("Purview", "Macie"),
        ("subscription", "AWS account"),
        ("Storage account", "S3 bucket"),
        ("managed identity", "IAM role"),
    ]
    result = text
    for old, new in pairs:
        result = result.replace(old, new)
    return result


def main() -> None:
    doc = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    doc["pack"]["name"] = "AWS Data-Layer Security"
    doc["pack"]["description"] = (
        "RDS, DynamoDB, S3, and KMS encryption and private access themes for AWS data platforms."
    )

    for rule in doc["rules"]:
        rule_id = rule["id"]
        overrides = RULE_COPY.get(rule_id, {})
        for field, value in overrides.items():
            rule[field] = value

        for field in ("title", "description", "remediationGuidance"):
            if field in rule and field not in overrides:
                rule[field] = apply_global_text(str(rule[field]))

        rule["evidenceHints"] = dedupe_hints(list(rule.get("evidenceHints", [])))

        for mapping in rule.get("frameworkMappings", []):
            if "framework" in mapping:
                mapping["framework"] = apply_global_text(str(mapping["framework"]))
            theme = str(mapping.get("theme", ""))
            if theme in THEME_COPY:
                mapping["theme"] = THEME_COPY[theme]
            else:
                mapping["theme"] = apply_global_text(theme)

    RULES_PATH.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"fixed {RULES_PATH.name} ({len(doc['rules'])} rules)")


if __name__ == "__main__":
    main()
