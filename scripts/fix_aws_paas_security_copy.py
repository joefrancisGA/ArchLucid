#!/usr/bin/env python3
"""Apply AWS-native copy fixes to peer-generated aws-paas-security curated rules (TB-713)."""

from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
RULES_PATH = REPO / "docs" / "samples" / "policy-packs" / "aws-paas-security-rules-v1.json"

RULE_COPY: dict[str, dict[str, str]] = {
    "aws-paas-001": {
        "description": (
            "Lambda, API Gateway, App Runner, and ECS Fargate must document public access "
            "disabled with VPC interface endpoints or private ingress only."
        ),
        "remediationGuidance": (
            "Tag public-access posture on services[].Tags; verify API Gateway resource policies "
            "and Lambda URL auth settings in awsExtractor."
        ),
    },
    "aws-paas-002": {
        "title": "VPC integration for Lambda and App Runner",
        "description": (
            "Serverless compute must document VPC attachment or VPC connector for outbound "
            "private connectivity to RDS, ElastiCache, and internal APIs."
        ),
        "remediationGuidance": (
            "Describe VPC subnets and security groups in governance.RequiredControls and services[].Tags."
        ),
    },
    "aws-paas-003": {
        "title": "VPC interface endpoints for data-plane access",
        "description": (
            "S3, RDS, DynamoDB, and Secrets Manager should use VPC interface endpoints — "
            "not public data endpoints."
        ),
        "remediationGuidance": (
            "Map VPC endpoints in metadata.ChangeDescription; align with awsExtractor VPC endpoint inventory."
        ),
    },
    "aws-paas-004": {
        "title": "IAM execution roles for PaaS to AWS resources",
        "description": (
            "Lambda, API Gateway, App Runner, and ECS Fargate must use least-privilege IAM "
            "execution roles for AWS API calls."
        ),
        "remediationGuidance": (
            "Tag iam-execution-role on services[].Tags; document role ARNs in governance.RequiredControls."
        ),
    },
    "aws-paas-005": {
        "remediationGuidance": (
            "Capture TLS policy in governance.PolicyConstraints; verify API Gateway stage "
            "security policies and CloudFront minimum TLS from awsExtractor."
        ),
    },
    "aws-paas-006": {
        "title": "Authentication enabled on API Gateway and App Runner",
        "description": (
            "Public HTTP(S) entry points must document Cognito, OIDC, IAM, or Lambda authorizers — "
            "not anonymous invoke."
        ),
    },
    "aws-paas-007": {
        "title": "ECS Fargate and App Runner ingress restricted",
        "description": (
            "Container PaaS must document internal-only ingress or security-group allowlists — "
            "not open internet exposure without WAF."
        ),
    },
    "aws-paas-008": {
        "title": "Lambda function URLs and API keys not used for production auth",
        "description": (
            "Production Lambda invoke paths must use IAM SigV4, Cognito, or API Gateway authorizers — "
            "not function URL NONE auth or long-lived API keys."
        ),
        "remediationGuidance": (
            "Describe Lambda auth in governance.RequiredControls and services[].Purpose."
        ),
    },
    "aws-paas-009": {
        "description": (
            "Production Lambda and App Runner should document alias-based or CodeDeploy "
            "blue/green deployment with warm-up."
        ),
    },
    "aws-paas-012": {
        "title": "AWS Shield for public edges",
        "description": (
            "Internet-facing API Gateway, CloudFront, and ALB edges must document DDoS "
            "protection (Shield Standard or Advanced)."
        ),
    },
    "aws-paas-013": {
        "description": (
            "Public HTTP(S) must document AWS WAF on API Gateway, ALB, or CloudFront distributions."
        ),
    },
    "aws-paas-014": {
        "title": "Secrets in Secrets Manager or SSM — not plaintext environment variables",
        "description": (
            "Lambda and App Runner must reference Secrets Manager or SSM Parameter Store — "
            "not plaintext secrets in environment variables."
        ),
    },
    "aws-paas-015": {
        "description": (
            "Lambda, API Gateway, App Runner, and ECS Fargate must export diagnostics to "
            "CloudWatch Logs and optional X-Ray tracing."
        ),
        "remediationGuidance": (
            "List log groups and tracing flags in governance.RequiredControls; align with awsExtractor."
        ),
    },
    "aws-paas-016": {
        "title": "Health checks and minimum capacity for production PaaS",
        "description": (
            "Production App Runner services and Lambda behind ALB must document health check paths, "
            "provisioned concurrency, or minimum instances for availability."
        ),
        "remediationGuidance": (
            "Tag health-check and min-capacity posture in services[].Tags."
        ),
    },
    "aws-paas-017": {
        "title": "Container image scanning in ECR",
        "description": (
            "ECS Fargate and App Runner must pull from ECR repositories with scan-on-push or "
            "Inspector image scanning enabled."
        ),
        "remediationGuidance": "Document ECR scanning in governance.RequiredControls.",
    },
    "aws-paas-018": {
        "description": (
            "PaaS workloads must be segregated by AWS account, OU, or resource tags with distinct IAM roles."
        ),
    },
    "aws-paas-019": {
        "title": "API Gateway as security gateway",
        "description": (
            "Public APIs should route through API Gateway with throttling, usage plans, and authorizers — "
            "not direct Lambda function URLs."
        ),
    },
    "aws-paas-020": {
        "description": (
            "EventBridge, SQS, SNS, and S3 event triggers must document least-privilege resource policies "
            "and dead-letter handling."
        ),
    },
    "aws-paas-021": {
        "title": "S3 bucket policies for Lambda VPC integrations",
        "description": (
            "Lambda functions with S3 event sources must document bucket policies allowing only "
            "the function execution role from approved VPC contexts."
        ),
    },
    "aws-paas-023": {
        "description": (
            "TLS certificates must document renewal automation via ACM or imported certificates "
            "in AWS Certificate Manager."
        ),
    },
    "aws-paas-024": {
        "description": (
            "High-outbound VPC Lambda workloads must document NAT gateway or VPC endpoint "
            "routing for SNAT at scale."
        ),
    },
    "aws-paas-025": {
        "title": "Step Functions and EventBridge secure connector authentication",
        "description": (
            "Step Functions and EventBridge integrations must document IAM roles or OAuth "
            "for connectors — not stored passwords."
        ),
    },
    "aws-paas-026": {
        "title": "Amplify Hosting auth and API routes",
        "description": (
            "Static frontends with API routes must document Cognito or IAM auth on API Gateway "
            "backends — not open invoke."
        ),
    },
}

THEME_COPY: dict[str, str] = {
    "AWS PaaS — VNet integration": "AWS PaaS — VPC integration",
    "AWS PaaS — Private endpoints": "AWS PaaS — VPC interface endpoints",
    "AWS PaaS — Elastic Beanstalk or Lambda availability": "AWS PaaS — Production availability",
    "AWS PaaS — Functions auth": "AWS PaaS — Lambda auth",
    "AWS PaaS — Logic Apps auth": "AWS PaaS — Step Functions auth",
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
        ("VNet", "VPC"),
        ("Elastic Beanstalk or Lambda", "Lambda or App Runner"),
        ("Log Analytics", "CloudWatch Logs"),
        ("API Management", "API Gateway"),
        ("Logic Apps", "Step Functions"),
        ("Static Web Apps", "Amplify Hosting"),
        ("ACR", "ECR"),
        ("DDoS Protection Standard", "AWS Shield"),
        ("subscription or resource group", "AWS account or OU"),
        ("Web App for Containers", "ECS Fargate or App Runner"),
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
