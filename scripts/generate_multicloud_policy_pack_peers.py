#!/usr/bin/env python3
"""Generate AWS/GCP curated policy-pack peers from existing Azure bundled templates (TB-701–716)."""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SAMPLES = REPO / "docs" / "samples" / "policy-packs"

EXTRACTOR_HINTS = {
    "aws": [
        "awsExtractor.manifest.RawJson",
        "awsExtractor.manifest.ScopeId",
        "awsExtractor.manifest.Scope",
        "awsExtractor.manifest.CollectionTimestamp",
        "awsExtractor.manifest.SwitchesUsed",
    ],
    "gcp": [
        "gcpExtractor.manifest.RawJson",
        "gcpExtractor.manifest.ScopeId",
        "gcpExtractor.manifest.Scope",
        "gcpExtractor.manifest.CollectionTimestamp",
        "gcpExtractor.manifest.SwitchesUsed",
    ],
}


def remap_evidence_hints(hints: list[str], cloud: str) -> list[str]:
    extractor = "awsExtractor" if cloud == "aws" else "gcpExtractor"
    remapped: list[str] = []
    for hint in hints:
        if hint.startswith("azureExtractor."):
            suffix = hint[len("azureExtractor.") :]
            if suffix == "ScopeDescriptor":
                suffix = "ScopeId"
            if suffix == "SubscriptionId":
                suffix = "ScopeId"
            if suffix == "AzModuleVersion":
                suffix = "CollectorVersion"
            remapped.append(f"{extractor}.manifest.{suffix}")
        else:
            remapped.append(hint)

    for extra in EXTRACTOR_HINTS[cloud]:
        if extra not in remapped:
            remapped.append(extra)

    return remapped


def replace_cloud_text(text: str, cloud: str) -> str:
    if cloud == "aws":
        pairs = [
            ("Azure", "AWS"),
            ("azure", "aws"),
            ("Microsoft Azure", "Amazon Web Services"),
            ("Microsoft.", "aws_"),
            ("Entra ID", "IAM Identity Center"),
            ("Entra", "IAM"),
            ("ARM ", "CloudFormation/API "),
            ("ARM inventory", "AWS inventory"),
            ("Key Vault", "AWS KMS"),
            ("App Service", "Elastic Beanstalk or Lambda"),
            ("Container Apps", "ECS Fargate or App Runner"),
            ("AKS", "EKS"),
            ("Cosmos", "DynamoDB"),
            ("Microsoft.Sql", "aws_rds"),
            ("Microsoft.Compute", "aws_ec2"),
            ("Microsoft.Network", "aws_vpc"),
            ("Microsoft.Storage", "aws_s3"),
            ("Private Link", "VPC endpoints"),
            ("policy-compliance.json", "AWS Config compliance exports"),
            ("retail-prices.json", "AWS Price List grounding"),
        ]
    else:
        pairs = [
            ("Azure", "GCP"),
            ("azure", "gcp"),
            ("Microsoft Azure", "Google Cloud Platform"),
            ("Microsoft.", "google_"),
            ("Entra ID", "Cloud IAM"),
            ("Entra", "Cloud IAM"),
            ("ARM ", "GCP API "),
            ("ARM inventory", "Cloud Asset Inventory"),
            ("Key Vault", "Cloud KMS"),
            ("App Service", "Cloud Run"),
            ("Container Apps", "Cloud Run or GKE"),
            ("AKS", "GKE"),
            ("Cosmos", "Firestore or Spanner"),
            ("Microsoft.Sql", "google_sql"),
            ("Microsoft.Compute", "google_compute"),
            ("Microsoft.Network", "google_compute_network"),
            ("Microsoft.Storage", "google_storage"),
            ("Private Link", "Private Service Connect"),
            ("policy-compliance.json", "org-policy compliance exports"),
            ("retail-prices.json", "GCP Billing Catalog grounding"),
        ]

    result = text
    for old, new in pairs:
        result = result.replace(old, new)
    return result


def transform_rule(rule: dict, old_prefix: str, new_prefix: str, cloud: str) -> dict:
    out = copy.deepcopy(rule)
    out["id"] = re.sub(rf"^{re.escape(old_prefix)}", new_prefix, out["id"])
    out["title"] = replace_cloud_text(out.get("title", ""), cloud)
    out["description"] = replace_cloud_text(out.get("description", ""), cloud)
    out["remediationGuidance"] = replace_cloud_text(out.get("remediationGuidance", ""), cloud)
    out["evidenceHints"] = remap_evidence_hints(out.get("evidenceHints", []), cloud)
    mappings = out.get("frameworkMappings", [])
    for mapping in mappings:
        if "framework" in mapping:
            mapping["framework"] = replace_cloud_text(str(mapping["framework"]), cloud)
        for key in ("requirement", "control", "theme"):
            if key in mapping:
                mapping[key] = replace_cloud_text(str(mapping[key]), cloud)
    return out


def write_peer_pack(
    source_slug: str,
    target_slug: str,
    old_prefix: str,
    new_prefix: str,
    cloud: str,
    display_name: str,
    description: str,
    category: str,
) -> None:
    source_path = SAMPLES / f"{source_slug}-rules-v1.json"
    if not source_path.exists():
        raise FileNotFoundError(source_path)

    source = json.loads(source_path.read_text(encoding="utf-8"))
    rules = [
        transform_rule(rule, old_prefix, new_prefix, cloud)
        for rule in source["rules"]
    ]

    curated = {
        "schemaVersion": 1,
        "kind": "archlucid.policyPack.curatedRules.v1",
        "pack": {
            "name": display_name,
            "description": description,
            "version": "1.0.0",
            "category": category,
            "isDefault": True,
            "suggestedPackType": "PlatformDefault",
            "policyPackContentDocumentPath": f"docs/samples/policy-packs/{target_slug}.json",
        },
        "rules": rules,
    }

    out_path = SAMPLES / f"{target_slug}-rules-v1.json"
    out_path.write_text(json.dumps(curated, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out_path.name} ({len(rules)} rules)")


def add_cloud_neutral_extractor_hints(pack_slug: str) -> None:
    path = SAMPLES / f"{pack_slug}-rules-v1.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    for rule in doc["rules"]:
        hints = list(rule.get("evidenceHints", []))
        for cloud in ("aws", "gcp"):
            for extra in EXTRACTOR_HINTS[cloud]:
                if extra not in hints:
                    hints.append(extra)
        rule["evidenceHints"] = hints
    path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"updated cloud-neutral hints: {path.name}")


PEERS: list[dict] = [
    {
        "source": "azure-waf",
        "old_prefix": "waf-az",
        "targets": [
            {
                "slug": "aws-waf",
                "prefix": "waf-aws",
                "cloud": "aws",
                "displayName": "AWS Well-Architected Framework",
                "description": (
                    "Reviewer prompts mapped to AWS Well-Architected Framework pillar themes. "
                    "Grounded in read-only AWS inventory ZIP output and Terraform aws_* evidence. "
                    "Not an official AWS Well-Architected Review or certification."
                ),
                "category": "Architecture",
            },
            {
                "slug": "gcp-architecture-framework",
                "prefix": "waf-gcp",
                "cloud": "gcp",
                "displayName": "Google Cloud Architecture Framework",
                "description": (
                    "Reviewer prompts mapped to Google Cloud Architecture Framework themes. "
                    "Grounded in read-only GCP inventory ZIP output and Terraform google_* evidence. "
                    "Not Google Cloud Ready or official GCP architecture certification."
                ),
                "category": "Architecture",
            },
        ],
    },
    {
        "source": "cis-azure-foundations",
        "old_prefix": "cis-az",
        "targets": [
            {
                "slug": "cis-aws-foundations",
                "prefix": "cis-aws",
                "cloud": "aws",
                "displayName": "CIS AWS Foundations Benchmark",
                "description": (
                    "CIS-aligned AWS hardening themes for architecture review. "
                    "Grounded in AWS inventory ZIP and Terraform aws_* evidence. Not CIS benchmark pass/fail."
                ),
                "category": "Security",
            },
            {
                "slug": "cis-gcp-foundations",
                "prefix": "cis-gcp",
                "cloud": "gcp",
                "displayName": "CIS Google Cloud Platform Foundation Benchmark",
                "description": (
                    "CIS-aligned GCP hardening themes for architecture review. "
                    "Grounded in GCP inventory ZIP and Terraform google_* evidence. Not CIS benchmark pass/fail."
                ),
                "category": "Security",
            },
        ],
    },
    {
        "source": "entra-iam-baseline",
        "old_prefix": "entra-iam",
        "targets": [
            {
                "slug": "aws-iam-baseline",
                "prefix": "iam-aws",
                "cloud": "aws",
                "displayName": "AWS IAM / Identity Center Architecture Baseline",
                "description": (
                    "IAM, Organizations SCP, Identity Center, and workload identity themes for AWS architectures. "
                    "Thematic mapping only; not certification."
                ),
                "category": "Identity",
            },
            {
                "slug": "gcp-iam-baseline",
                "prefix": "iam-gcp",
                "cloud": "gcp",
                "displayName": "GCP Cloud IAM Architecture Baseline",
                "description": (
                    "Cloud IAM, org policies, service accounts, and workload identity themes for GCP architectures. "
                    "Thematic mapping only; not certification."
                ),
                "category": "Identity",
            },
        ],
    },
    {
        "source": "azure-caf-landing-zone",
        "old_prefix": "lz-caf",
        "targets": [
            {
                "slug": "aws-landing-zone",
                "prefix": "lz-aws",
                "cloud": "aws",
                "displayName": "AWS Landing Zone / Control Tower",
                "description": (
                    "Organizations, Control Tower, SCP guardrails, and hub-spoke networking themes. "
                    "Thematic mapping only; not Control Tower conformance certification."
                ),
                "category": "Platform",
            },
            {
                "slug": "gcp-landing-zone",
                "prefix": "lz-gcp",
                "cloud": "gcp",
                "displayName": "GCP Landing Zone / Resource Hierarchy",
                "description": (
                    "Org/folder/project hierarchy, Shared VPC, and VPC Service Controls themes. "
                    "Thematic mapping only; not certification."
                ),
                "category": "Platform",
            },
        ],
    },
    {
        "source": "azure-resiliency-dr",
        "old_prefix": "az-dr",
        "targets": [
            {
                "slug": "aws-resiliency-dr",
                "prefix": "aws-dr",
                "cloud": "aws",
                "displayName": "AWS Resiliency & Disaster Recovery",
                "description": (
                    "Multi-AZ, Route 53, AWS Backup, and cross-region replication themes for AWS workloads."
                ),
                "category": "Reliability",
            },
            {
                "slug": "gcp-resiliency-dr",
                "prefix": "gcp-dr",
                "cloud": "gcp",
                "displayName": "GCP Resiliency & Disaster Recovery",
                "description": (
                    "Multi-region GCE/Cloud SQL, Cloud DNS failover, and backup/DR themes for GCP workloads."
                ),
                "category": "Reliability",
            },
        ],
    },
    {
        "source": "aks-production-baseline",
        "old_prefix": "aks",
        "targets": [
            {
                "slug": "eks-production-baseline",
                "prefix": "eks",
                "cloud": "aws",
                "displayName": "EKS Production Baseline",
                "description": (
                    "Kubernetes on AWS EKS production hardening themes (IRSA, network policy, control plane logging)."
                ),
                "category": "Platform",
            },
            {
                "slug": "gke-production-baseline",
                "prefix": "gke",
                "cloud": "gcp",
                "displayName": "GKE Production Baseline",
                "description": (
                    "Kubernetes on GKE production hardening themes (workload identity, Binary Authorization, private clusters)."
                ),
                "category": "Platform",
            },
        ],
    },
    {
        "source": "azure-paas-security",
        "old_prefix": "az-paas",
        "targets": [
            {
                "slug": "aws-paas-security",
                "prefix": "aws-paas",
                "cloud": "aws",
                "displayName": "AWS Serverless & PaaS Security",
                "description": (
                    "Lambda, API Gateway, App Runner, and ECS Fargate identity and network exposure themes."
                ),
                "category": "Application Platform",
            },
            {
                "slug": "gcp-paas-security",
                "prefix": "gcp-paas",
                "cloud": "gcp",
                "displayName": "GCP Serverless & PaaS Security",
                "description": (
                    "Cloud Run, Cloud Functions, and App Engine ingress, secrets, and VPC connector themes."
                ),
                "category": "Application Platform",
            },
        ],
    },
    {
        "source": "azure-data-layer-security",
        "old_prefix": "az-data",
        "targets": [
            {
                "slug": "aws-data-layer-security",
                "prefix": "aws-data",
                "cloud": "aws",
                "displayName": "AWS Data-Layer Security",
                "description": (
                    "RDS, DynamoDB, S3, and KMS encryption and private access themes for AWS data platforms."
                ),
                "category": "Data Platform",
            },
            {
                "slug": "gcp-data-layer-security",
                "prefix": "gcp-data",
                "cloud": "gcp",
                "displayName": "GCP Data-Layer Security",
                "description": (
                    "Cloud SQL, Spanner, Firestore, BigQuery, and Cloud Storage data-control themes."
                ),
                "category": "Data Platform",
            },
        ],
    },
]


def main() -> None:
    for peer in PEERS:
        for target in peer["targets"]:
            write_peer_pack(
                peer["source"],
                target["slug"],
                peer["old_prefix"],
                target["prefix"],
                target["cloud"],
                target["displayName"],
                target["description"],
                target["category"],
            )

    add_cloud_neutral_extractor_hints("security-architecture-baseline")
    add_cloud_neutral_extractor_hints("cost-optimization")


if __name__ == "__main__":
    main()
