#!/usr/bin/env python3
"""Apply GCP-native copy fixes to peer-generated gcp-paas-security curated rules (TB-714)."""

from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
RULES_PATH = REPO / "docs" / "samples" / "policy-packs" / "gcp-paas-security-rules-v1.json"

RULE_COPY: dict[str, dict[str, str]] = {
    "gcp-paas-001": {
        "description": (
            "Cloud Run, Cloud Functions, and App Engine must document public ingress "
            "disabled or restricted with IAM, VPC connector, or internal load balancers only."
        ),
        "remediationGuidance": (
            "Tag public-access posture on services[].Tags; verify ingress settings and "
            "allUsers/allAuthenticatedUsers bindings in gcpExtractor."
        ),
    },
    "gcp-paas-002": {
        "title": "Serverless VPC Access for Cloud Run and Cloud Functions",
        "description": (
            "Serverless compute must document VPC connector or Direct VPC egress for outbound "
            "private connectivity to Cloud SQL, Memorystore, and internal APIs."
        ),
        "remediationGuidance": (
            "Describe VPC connector and egress settings in governance.RequiredControls and services[].Tags."
        ),
    },
    "gcp-paas-003": {
        "title": "Private Service Connect for data-plane access",
        "description": (
            "Cloud Storage, Cloud SQL, Spanner, and Secret Manager should use Private Service Connect "
            "or private IP — not public data endpoints."
        ),
        "remediationGuidance": (
            "Map PSC endpoints in metadata.ChangeDescription; align with gcpExtractor private-service inventory."
        ),
    },
    "gcp-paas-004": {
        "title": "Dedicated service accounts for PaaS to GCP resources",
        "description": (
            "Cloud Run, Cloud Functions, and App Engine must use least-privilege service accounts "
            "with workload identity — not the default compute service account."
        ),
        "remediationGuidance": (
            "Tag service-account on services[].Tags; document SA emails in governance.RequiredControls."
        ),
    },
    "gcp-paas-005": {
        "remediationGuidance": (
            "Capture TLS policy in governance.PolicyConstraints; verify Cloud Run/Load Balancer "
            "minimum TLS versions from gcpExtractor."
        ),
    },
    "gcp-paas-006": {
        "title": "Authentication enabled on Cloud Run and App Engine",
        "description": (
            "Public HTTP(S) entry points must document IAP, OIDC, or Cloud Run invoker IAM — "
            "not unauthenticated invoke."
        ),
    },
    "gcp-paas-007": {
        "title": "Cloud Run ingress restricted",
        "description": (
            "Cloud Run services must document internal-only ingress or Cloud Armor allowlists — "
            "not open internet exposure without WAF."
        ),
    },
    "gcp-paas-008": {
        "title": "Cloud Functions auth keys not used for production auth",
        "description": (
            "Production Cloud Functions invoke paths must use IAM invoker roles or OIDC — "
            "not unauthenticated HTTP triggers or long-lived API keys."
        ),
        "remediationGuidance": (
            "Describe function auth in governance.RequiredControls and services[].Purpose."
        ),
    },
    "gcp-paas-009": {
        "description": (
            "Production Cloud Run and Cloud Functions should document traffic-splitting revisions "
            "or blue/green deployment with warm-up."
        ),
    },
    "gcp-paas-012": {
        "title": "Cloud Armor for public edges",
        "description": (
            "Internet-facing Cloud Run, API Gateway, and external HTTPS load balancers must document "
            "Cloud Armor security policies."
        ),
    },
    "gcp-paas-013": {
        "description": (
            "Public HTTP(S) must document Cloud Armor or Cloud CDN with WAF policies on load balancers."
        ),
    },
    "gcp-paas-014": {
        "title": "Secrets in Secret Manager — not plaintext environment variables",
        "description": (
            "Cloud Run and Cloud Functions must reference Secret Manager — "
            "not plaintext secrets in environment variables."
        ),
    },
    "gcp-paas-015": {
        "description": (
            "Cloud Run, Cloud Functions, and App Engine must export diagnostics to "
            "Cloud Logging and optional Cloud Trace."
        ),
        "remediationGuidance": (
            "List log sinks and tracing flags in governance.RequiredControls; align with gcpExtractor."
        ),
    },
    "gcp-paas-016": {
        "title": "Health checks and minimum instances for production PaaS",
        "description": (
            "Production Cloud Run services must document startup probes, min instances, "
            "or CPU always allocated for availability."
        ),
        "remediationGuidance": (
            "Tag health-check and min-instances posture in services[].Tags."
        ),
    },
    "gcp-paas-017": {
        "title": "Container image scanning in Artifact Registry",
        "description": (
            "Cloud Run must pull from Artifact Registry with vulnerability scanning or "
            "Binary Authorization policies enabled."
        ),
        "remediationGuidance": "Document Artifact Registry scanning in governance.RequiredControls.",
    },
    "gcp-paas-018": {
        "description": (
            "PaaS workloads must be segregated by GCP project, folder, or resource labels with distinct service accounts."
        ),
    },
    "gcp-paas-019": {
        "title": "API Gateway as security gateway",
        "description": (
            "Public APIs should route through API Gateway with quotas and auth backends — "
            "not direct unauthenticated Cloud Run URLs."
        ),
    },
    "gcp-paas-020": {
        "description": (
            "Pub/Sub, Eventarc, and Cloud Scheduler triggers must document least-privilege IAM "
            "and dead-letter topics."
        ),
    },
    "gcp-paas-021": {
        "title": "Cloud Storage IAM for Cloud Functions integrations",
        "description": (
            "Cloud Functions with GCS event sources must document bucket IAM allowing only "
            "the function service account from approved VPC contexts."
        ),
    },
    "gcp-paas-023": {
        "description": (
            "TLS certificates must document renewal automation via Google-managed certificates "
            "or Certificate Manager."
        ),
    },
    "gcp-paas-024": {
        "description": (
            "High-outbound serverless workloads must document VPC connector egress or "
            "Cloud NAT routing for SNAT at scale."
        ),
    },
    "gcp-paas-025": {
        "title": "Workflows secure connector authentication",
        "description": (
            "Workflows and Eventarc integrations must document service accounts or OAuth "
            "for connectors — not stored passwords."
        ),
    },
    "gcp-paas-026": {
        "title": "Firebase Hosting or Cloud Run auth for static API routes",
        "description": (
            "Static frontends with API routes must document IAP or IAM auth on Cloud Run "
            "backends — not open invoke."
        ),
    },
}

THEME_COPY: dict[str, str] = {
    "GCP PaaS — VNet integration": "GCP PaaS — Serverless VPC Access",
    "GCP PaaS — Private endpoints": "GCP PaaS — Private Service Connect",
    "GCP PaaS — Cloud Run availability": "GCP PaaS — Production availability",
    "GCP PaaS — Functions auth": "GCP PaaS — Cloud Functions auth",
    "GCP PaaS — Logic Apps auth": "GCP PaaS — Workflows auth",
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
        ("VNet", "VPC"),
        ("Cloud Run or GKE and Functions", "Cloud Run and Cloud Functions"),
        ("Cloud Run or GKE", "Cloud Run"),
        ("App Service", "Cloud Run"),
        ("Log Analytics", "Cloud Logging"),
        ("API Management", "API Gateway"),
        ("Logic Apps", "Workflows"),
        ("Static Web Apps", "Firebase Hosting"),
        ("ACR", "Artifact Registry"),
        ("DDoS Protection Standard", "Cloud Armor"),
        ("subscription or resource group", "GCP project or folder"),
        ("Web App for Containers", "Cloud Run"),
        ("managed identity", "service account"),
        ("Key Vault", "Secret Manager"),
        ("private endpoint", "Private Service Connect endpoint"),
    ]
    result = text
    for old, new in pairs:
        result = result.replace(old, new)
    return result


def main() -> None:
    doc = json.loads(RULES_PATH.read_text(encoding="utf-8"))

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
            theme = str(mapping.get("theme", ""))
            if theme in THEME_COPY:
                mapping["theme"] = THEME_COPY[theme]
            else:
                mapping["theme"] = apply_global_text(theme)

    RULES_PATH.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"fixed {RULES_PATH.name} ({len(doc['rules'])} rules)")


if __name__ == "__main__":
    main()
