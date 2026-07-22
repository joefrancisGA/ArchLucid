using System.Text;

using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>Cloud-specific system-prompt addenda and user-prompt guidance for multi-cloud analyze (Phase 4).</summary>
public static class CloudProviderAgentPromptComposer
{
    public static string ApplySystemPromptAddendum(string basePrompt, AgentType agentType, CloudProvider cloudProvider)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(basePrompt);

        string? addendum = TryGetSystemPromptAddendum(agentType, cloudProvider);

        if (string.IsNullOrWhiteSpace(addendum))
            return basePrompt;

        return basePrompt.TrimEnd() + Environment.NewLine + Environment.NewLine + addendum.Trim();
    }

    public static void AppendUserPromptCloudGuidance(StringBuilder sb, AgentType agentType, CloudProvider cloudProvider)
    {
        ArgumentNullException.ThrowIfNull(sb);

        string? guidance = TryGetUserPromptGuidance(agentType, cloudProvider);

        if (string.IsNullOrWhiteSpace(guidance))
            return;

        sb.AppendLine();
        sb.AppendLine(guidance.Trim());
    }

    internal static string? TryGetSystemPromptAddendum(AgentType agentType, CloudProvider cloudProvider)
    {
        if (cloudProvider == CloudProvider.Azure)
            return null;

        if (cloudProvider == CloudProvider.None)
            return GetCloudNeutralSystemPromptAddendum(agentType);

        return agentType switch
        {
            AgentType.Topology when cloudProvider == CloudProvider.Aws =>
                """
                Target cloud override: AWS.
                Use AWS service names (EC2, Lambda, EKS, RDS, S3, IAM, VPC) — never azurerm_* or Azure-only defaults.
                Prefer regional isolation, least-privilege IAM, and S3 public-access block posture in findings.
                """,
            AgentType.Topology when cloudProvider == CloudProvider.Gcp =>
                """
                Target cloud override: GCP.
                Use GCP service names (Compute Engine, GKE, Cloud SQL, Cloud Storage, VPC firewall rules) — never azurerm_* defaults.
                Prefer VPC-native networking, workload identity, and private Google access patterns in findings.
                """,
            AgentType.Compliance when cloudProvider == CloudProvider.Aws =>
                """
                Target cloud override: AWS.
                Map controls to AWS idioms (IAM roles/policies, Security Groups, S3 bucket policies, KMS, CloudTrail).
                """,
            AgentType.Compliance when cloudProvider == CloudProvider.Gcp =>
                """
                Target cloud override: GCP.
                Map controls to GCP idioms (IAM bindings, VPC firewall rules, CMEK, Cloud Audit Logs).
                """,
            AgentType.Cost when cloudProvider == CloudProvider.Aws =>
                """
                Target cloud override: AWS.
                Discuss AWS on-demand / Savings Plans tradeoffs; do not cite Azure Retail Prices for AWS workloads.
                """,
            AgentType.Cost when cloudProvider == CloudProvider.Gcp =>
                """
                Target cloud override: GCP.
                Discuss GCE/GKE/Cloud SQL spend drivers; do not cite Azure Retail Prices for GCP workloads.
                """,
            AgentType.Critic when cloudProvider == CloudProvider.Aws =>
                """
                Target cloud override: AWS.
                Critique using AWS constructs (public S3 buckets, open Security Groups, overly broad IAM) — not Azure-only patterns.
                """,
            AgentType.Critic when cloudProvider == CloudProvider.Gcp =>
                """
                Target cloud override: GCP.
                Critique using GCP constructs (0.0.0.0/0 firewall rules, default SA keys, public Cloud Storage) — not Azure-only patterns.
                """,
            _ => null,
        };
    }

    internal static string? TryGetUserPromptGuidance(AgentType agentType, CloudProvider cloudProvider)
    {
        if (cloudProvider == CloudProvider.Azure || cloudProvider == CloudProvider.None)
            return null;

        return agentType switch
        {
            AgentType.Topology when cloudProvider == CloudProvider.Aws =>
                """
                Important guidance (AWS target):
                - Produce a simple, coherent MVP-quality AWS topology.
                - Prefer managed services (Lambda, RDS, S3) over self-managed EC2 unless required.
                - Use stable IDs such as svc-api, ds-metadata where appropriate.
                - Return JSON only.
                """,
            AgentType.Topology when cloudProvider == CloudProvider.Gcp =>
                """
                Important guidance (GCP target):
                - Produce a simple, coherent MVP-quality GCP topology.
                - Prefer Cloud Run / GKE Autopilot / Cloud SQL over raw Compute Engine unless required.
                - Use stable IDs such as svc-api, ds-metadata where appropriate.
                - Return JSON only.
                """,
            AgentType.Compliance when cloudProvider == CloudProvider.Aws =>
                """
                Important guidance (AWS target):
                - Infer mandatory controls conservatively from constraints and required capabilities.
                - Prefer IAM roles/policies, Security Groups, S3 bucket policies, KMS, and CloudTrail idioms.
                - Prefer reusable machine-friendly findings such as IamLeastPrivilegeRequired or S3PublicAccessBlocked.
                - Return JSON only.
                """,
            AgentType.Compliance when cloudProvider == CloudProvider.Gcp =>
                """
                Important guidance (GCP target):
                - Infer mandatory controls conservatively from constraints and required capabilities.
                - Prefer IAM bindings, VPC firewall rules, CMEK, and Cloud Audit Logs idioms.
                - Prefer reusable machine-friendly findings such as FirewallRuleTooPermissive or ServiceAccountKeyExposure.
                - Return JSON only.
                """,
            AgentType.Cost when cloudProvider == CloudProvider.Aws =>
                """
                Important guidance (AWS target):
                - Prefer managed services with predictable operational cost for MVP workloads.
                - Discuss AWS on-demand / Savings Plans tradeoffs; cite AWS retail grounding only.
                - Highlight token/search spend monitoring when AI services are in scope.
                - Return JSON only.
                """,
            AgentType.Cost when cloudProvider == CloudProvider.Gcp =>
                """
                Important guidance (GCP target):
                - Prefer managed services with predictable operational cost for MVP workloads.
                - Discuss GCE/GKE/Cloud SQL spend drivers; cite GCP retail grounding only.
                - Highlight token/search spend monitoring when AI services are in scope.
                - Return JSON only.
                """,
            AgentType.Critic when cloudProvider == CloudProvider.Aws =>
                """
                Important guidance (AWS target):
                - Challenge prior agent claims using AWS constructs (public S3 buckets, open Security Groups, overly broad IAM).
                - Every High/Error/Critical finding must name a specific uploaded element and state a concrete gap or dispute.
                - Prefer machine-friendly UnderSpecified messages only when tied to doc:… or awsExtractor:… evidence refs.
                - Do NOT emit generic checklist advice unless tied to a named element in this architecture.
                - Omit obvious findings entirely; downgrade any borderline generic item to severity Info with Low confidenceLevel.
                - Return at most 8 findings; return JSON only.
                """,
            AgentType.Critic when cloudProvider == CloudProvider.Gcp =>
                """
                Important guidance (GCP target):
                - Challenge prior agent claims using GCP constructs (0.0.0.0/0 firewall rules, default SA keys, public Cloud Storage).
                - Every High/Error/Critical finding must name a specific uploaded element and state a concrete gap or dispute.
                - Prefer machine-friendly UnderSpecified messages only when tied to doc:… or gcpExtractor:… evidence refs.
                - Do NOT emit generic checklist advice unless tied to a named element in this architecture.
                - Omit obvious findings entirely; downgrade any borderline generic item to severity Info with Low confidenceLevel.
                - Return at most 8 findings; return JSON only.
                """,
            _ => null,
        };
    }

    private static string GetCloudNeutralSystemPromptAddendum(AgentType agentType)
    {
        _ = agentType;

        return """
               Target cloud override: cloud-neutral.
               Do not inject Azure-, AWS-, or GCP-specific product names unless they appear in the Technology Ledger context supplied in the user prompt or are explicitly proposed as alternatives under consideration.
               Prefer provider-agnostic architectural language; cite hyperscaler products only when ledger-corroborated.
               """;
    }
}
