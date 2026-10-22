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
        if (cloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
            return null;

        return AgentUserPromptStaticPrefix.TryGetImportantGuidanceText(agentType, cloudProvider);
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
