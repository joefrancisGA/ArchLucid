#!/usr/bin/env python3
"""Apply GCP-native copy fixes to peer-generated gcp-data-layer-security curated rules (TB-716)."""

from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
RULES_PATH = REPO / "docs" / "samples" / "policy-packs" / "gcp-data-layer-security-rules-v1.json"

RULE_COPY: dict[str, dict[str, str]] = {
    "gcp-data-001": {
        "title": "Cloud SQL encryption at rest enabled for all databases",
        "description": (
            "Every Cloud SQL instance storing sensitive data must document encryption at rest "
            "with Google-managed or customer-managed encryption keys (CMEK)."
        ),
        "remediationGuidance": (
            "Tag encryption-at-rest on datastores[].Tags; verify diskEncryptionConfiguration in gcpExtractor Cloud SQL inventory."
        ),
    },
    "gcp-data-002": {
        "title": "Cloud SQL audit logs to secure destination",
        "description": (
            "Database audit and activity logs must route to Cloud Logging or Pub/Sub sinks — "
            "not disabled."
        ),
        "remediationGuidance": "List audit destination in governance.RequiredControls.",
    },
    "gcp-data-003": {
        "title": "Database threat detection and Security Command Center",
        "description": (
            "Cloud SQL and Spanner must document Security Command Center findings or "
            "Database Threat Detection controls enabled."
        ),
    },
    "gcp-data-004": {
        "title": "Cloud SQL private IP and authorized networks only",
        "description": (
            "Cloud SQL must document private IP connectivity and authorized network allowlists — "
            "not open public internet accessibility."
        ),
        "remediationGuidance": (
            "Map private networking in metadata.ChangeDescription; align with gcpExtractor Cloud SQL inventory."
        ),
    },
    "gcp-data-005": {
        "title": "Cloud IAM database authentication preferred over passwords",
        "description": (
            "Cloud SQL should document IAM database authentication or Secret Manager rotation — "
            "not long-lived passwords in application config."
        ),
    },
    "gcp-data-006": {
        "title": "Row-level or tenant isolation documented where multi-tenant",
        "description": (
            "Multi-tenant data stores must document application-level RLS, schema separation, "
            "or per-tenant Firestore/Spanner key prefixes."
        ),
    },
    "gcp-data-007": {
        "title": "Field-level encryption for highly sensitive columns",
        "description": (
            "Highly sensitive columns must document CMEK envelope encryption, application-layer "
            "tokenization, or Cloud DLP de-identification."
        ),
    },
    "gcp-data-008": {
        "title": "Firestore and Spanner VPC Service Controls",
        "description": (
            "Firestore and Spanner must document VPC Service Controls perimeters and private "
            "Google Access — not open public API exposure."
        ),
    },
    "gcp-data-009": {
        "title": "Firestore and Spanner encryption with CMEK",
        "description": (
            "Firestore and Spanner storing regulated data must document customer-managed "
            "encryption keys."
        ),
    },
    "gcp-data-010": {
        "title": "IAM policies over long-lived service account keys",
        "description": (
            "Application access to Firestore and Spanner must use workload identity and IAM — "
            "not downloaded service account keys."
        ),
    },
    "gcp-data-011": {
        "title": "Spanner and Firestore consistency for tenant isolation",
        "description": (
            "Datastore access patterns must document transaction boundaries or conditional writes "
            "where tenant isolation depends on item-level guards."
        ),
    },
    "gcp-data-012": {
        "title": "Cloud Storage bucket encryption and uniform access",
        "description": (
            "GCS buckets must document CMEK or Google-managed encryption with uniform bucket-level access."
        ),
    },
    "gcp-data-013": {
        "title": "GCS retention and hold for audit objects",
        "description": (
            "Audit and compliance GCS prefixes must document retention policies or bucket locks."
        ),
    },
    "gcp-data-014": {
        "title": "GCS signed URLs with minimal permission and short expiry",
        "description": (
            "Signed URL patterns must document least-privilege actions and short TTL — "
            "not broad read/write grants."
        ),
    },
    "gcp-data-015": {
        "title": "GCS prefix IAM and fine-grained access",
        "description": (
            "Data lake GCS layouts must document prefix-scoped IAM conditions or "
            "IAM Conditions for fine-grained access."
        ),
    },
    "gcp-data-016": {
        "title": "BigQuery and analytics VPC Service Controls",
        "description": (
            "BigQuery datasets and analytics workspaces must document VPC-SC perimeters or "
            "private Google Access — not public query endpoints."
        ),
    },
    "gcp-data-017": {
        "title": "Cloud DLP classification scan coverage",
        "description": (
            "Sensitive data stores must document Cloud DLP inspection jobs or "
            "Dataplex sensitivity labels."
        ),
    },
    "gcp-data-018": {
        "title": "Masked or redacted non-production database copies",
        "description": (
            "Non-production Cloud SQL clones must document masking, subsetting, "
            "or synthetic data substitution."
        ),
    },
    "gcp-data-019": {
        "title": "Backup encryption and cross-region replication for databases",
        "description": (
            "Cloud SQL automated backups and cross-region replicas must document CMEK encryption "
            "and geo-redundancy expectations."
        ),
    },
    "gcp-data-020": {
        "title": "Cloud KMS key separation for data encryption keys",
        "description": (
            "Data encryption keys must use dedicated Cloud KMS keys — not reused application or logging keys."
        ),
    },
    "gcp-data-021": {
        "title": "Service accounts for application data-plane access",
        "description": (
            "Applications accessing Cloud SQL, Firestore, or GCS must use dedicated service accounts — "
            "not long-lived keys in configuration."
        ),
    },
    "gcp-data-022": {
        "title": "Cloud SQL security posture remediation",
        "description": (
            "Cloud SQL instances must document Security Command Center posture findings remediation "
            "for known database misconfigurations."
        ),
    },
    "gcp-data-023": {
        "title": "Firestore document path prevents cross-tenant leakage",
        "description": (
            "Multi-tenant Firestore designs must document tenant-scoped collection paths "
            "and security rules."
        ),
    },
    "gcp-data-024": {
        "title": "Diagnostic logs for all data services",
        "description": (
            "Cloud SQL, Firestore, Spanner, and GCS must export audit and access logs to Cloud Logging."
        ),
    },
    "gcp-data-025": {
        "title": "GCS data exfiltration monitoring",
        "description": (
            "GCS buckets must document access logging, Cloud DLP findings, or anomaly detection "
            "for unusual download patterns."
        ),
    },
    "gcp-data-026": {
        "title": "Serverless and autoscaling database SKU security implications",
        "description": (
            "Serverless or autoscaling database SKUs must document scaling, credential rotation, "
            "and network exposure trade-offs."
        ),
    },
    "gcp-data-027": {
        "title": "Cross-project data access documented",
        "description": (
            "Cross-project Cloud SQL exports, GCS replication, or Firestore access must document "
            "IAM conditions and approval workflow."
        ),
    },
    "gcp-data-028": {
        "title": "Data-layer DR tested with KMS keys available",
        "description": (
            "Database DR runbooks must document Cloud KMS key availability in the failover region "
            "and encrypted backup restore validation."
        ),
    },
}

THEME_COPY: dict[str, str] = {
    "GCP data services — TDE": "GCP data services — Encryption at rest",
    "GCP data services — SQL auditing": "GCP data services — Cloud SQL auditing",
    "GCP data services — Private endpoints": "GCP data services — Private Service Connect",
}


def dedupe_hints(hints: list[str]) -> list[str]:
    fixed: list[str] = []
    for hint in hints:
        normalized = hint.replace("gcpExtractor.manifest.manifest.", "gcpExtractor.manifest.")
        if normalized not in fixed:
            fixed.append(normalized)
    return fixed


def apply_global_text(text: str) -> str:
    pairs = [
        ("Azure SQL", "Cloud SQL"),
        ("Cosmos DB", "Firestore"),
        ("Cosmos", "Firestore"),
        ("Key Vault", "Secret Manager"),
        ("Log Analytics", "Cloud Logging"),
        ("private endpoint", "Private Service Connect endpoint"),
        ("Private endpoint", "Private Service Connect endpoint"),
        ("VNet", "VPC"),
        ("AAD", "Cloud IAM"),
        ("Transparent Data Encryption", "encryption at rest"),
        ("Synapse", "BigQuery"),
        ("Purview", "Cloud DLP"),
        ("subscription", "GCP project"),
        ("Storage account", "GCS bucket"),
        ("managed identity", "service account"),
    ]
    result = text
    for old, new in pairs:
        result = result.replace(old, new)
    return result


def main() -> None:
    doc = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    doc["pack"]["name"] = "GCP Data-Layer Security"
    doc["pack"]["description"] = (
        "Cloud SQL, Spanner, Firestore, BigQuery, and Cloud Storage data-control themes."
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
