using System.Text;

using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>
///     Stable user-prompt prefix blocks placed before per-run evidence and retrieval (TB-681 Azure prompt-cache ordering).
/// </summary>
public static class AgentUserPromptStaticPrefix
{
    /// <summary>Topology agent action line plus cloud guidance and MVP rules.</summary>
    public static void AppendTopology(StringBuilder sb, CloudProvider cloudProvider)
    {
        sb.AppendLine("Generate a topology AgentResult.");
        sb.AppendLine();

        AppendTopologyImportantGuidance(sb, cloudProvider);
    }

    /// <summary>Compliance agent action line plus policy inference rules.</summary>
    public static void AppendCompliance(StringBuilder sb, CloudProvider cloudProvider)
    {
        sb.AppendLine("Generate a compliance AgentResult.");
        sb.AppendLine();

        AppendComplianceImportantGuidance(sb, cloudProvider);
    }

    /// <summary>Cost agent action line plus spend guidance.</summary>
    public static void AppendCost(StringBuilder sb, CloudProvider cloudProvider)
    {
        sb.AppendLine("Generate a cost AgentResult.");
        sb.AppendLine();

        AppendCostImportantGuidance(sb, cloudProvider);
    }

    /// <summary>Critic agent action line plus finding-quality rules.</summary>
    public static void AppendCritic(StringBuilder sb, CloudProvider cloudProvider)
    {
        sb.AppendLine("Generate a critic AgentResult.");
        sb.AppendLine();

        AppendCriticImportantGuidance(sb, cloudProvider);
    }

    internal static string? TryGetImportantGuidanceText(AgentType agentType, CloudProvider cloudProvider)
    {
        StringBuilder sb = new();

        switch (agentType)
        {
            case AgentType.Topology:
                AppendTopologyImportantGuidance(sb, cloudProvider);
                break;
            case AgentType.Compliance:
                AppendComplianceImportantGuidance(sb, cloudProvider);
                break;
            case AgentType.Cost:
                AppendCostImportantGuidance(sb, cloudProvider);
                break;
            case AgentType.Critic:
                AppendCriticImportantGuidance(sb, cloudProvider);
                break;
            default:
                return null;
        }

        string text = sb.ToString().Trim();

        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

    private static void AppendTopologyImportantGuidance(StringBuilder sb, CloudProvider cloudProvider)
    {
        if (cloudProvider == CloudProvider.Azure)
        {
            AppendTopologyAzureImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.Aws)
        {
            AppendTopologyAwsImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.Gcp)
        {
            AppendTopologyGcpImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.None)
        {
            AppendTopologyCloudNeutralImportantGuidance(sb);
        }
    }

    private static void AppendComplianceImportantGuidance(StringBuilder sb, CloudProvider cloudProvider)
    {
        if (cloudProvider == CloudProvider.Azure)
        {
            AppendComplianceAzureImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.Aws)
        {
            AppendComplianceAwsImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.Gcp)
        {
            AppendComplianceGcpImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.None)
        {
            AppendComplianceCloudNeutralImportantGuidance(sb);
        }
    }

    private static void AppendCostImportantGuidance(StringBuilder sb, CloudProvider cloudProvider)
    {
        if (cloudProvider == CloudProvider.Azure)
        {
            AppendCostAzureImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.Aws)
        {
            AppendCostAwsImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.Gcp)
        {
            AppendCostGcpImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.None)
        {
            AppendCostCloudNeutralImportantGuidance(sb);
        }
    }

    private static void AppendCriticImportantGuidance(StringBuilder sb, CloudProvider cloudProvider)
    {
        if (cloudProvider == CloudProvider.Azure)
        {
            AppendCriticAzureImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.Aws)
        {
            AppendCriticAwsImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.Gcp)
        {
            AppendCriticGcpImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.None)
        {
            AppendCriticCloudNeutralImportantGuidance(sb);
        }
    }

    private static void AppendTopologyAzureImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Produce a simple, coherent MVP-quality Azure topology.");
        sb.AppendLine("- Prefer App Service over AKS unless AKS is truly necessary.");
        sb.AppendLine("- If Azure AI Search is required, include it explicitly.");
        sb.AppendLine("- If SQL metadata is implied, include a SQL datastore explicitly.");
        sb.AppendLine("- Use stable IDs such as svc-api, svc-search, ds-metadata where appropriate.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendTopologyAwsImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance (AWS target):");
        sb.AppendLine("- Produce a simple, coherent MVP-quality AWS topology.");
        sb.AppendLine("- Prefer managed services (Lambda, RDS, S3) over self-managed EC2 unless required.");
        sb.AppendLine("- Use stable IDs such as svc-api, ds-metadata where appropriate.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendTopologyGcpImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance (GCP target):");
        sb.AppendLine("- Produce a simple, coherent MVP-quality GCP topology.");
        sb.AppendLine("- Prefer Cloud Run / GKE Autopilot / Cloud SQL over raw Compute Engine unless required.");
        sb.AppendLine("- Use stable IDs such as svc-api, ds-metadata where appropriate.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendTopologyCloudNeutralImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Produce a simple, coherent MVP-quality cloud-neutral topology.");
        sb.AppendLine("- Avoid naming a specific hyperscaler unless the request or ledger requires it.");
        sb.AppendLine("- Use stable IDs such as svc-api, ds-metadata where appropriate.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendComplianceAzureImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Infer mandatory controls conservatively from constraints and required capabilities.");
        sb.AppendLine("- If managed identity is explicitly required, include Managed Identity.");
        sb.AppendLine(
            "- If private endpoints or private networking are required, include Private Endpoints and/or Private Networking.");
        sb.AppendLine("- If encryption is required, include Encryption At Rest.");
        sb.AppendLine("- If secrets are likely present, include Key Vault.");
        sb.AppendLine(
            "- Prefer reusable machine-friendly findings such as ManagedIdentityRequired or PrivateNetworkingRequired.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendComplianceAwsImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance (AWS target):");
        sb.AppendLine("- Infer mandatory controls conservatively from constraints and required capabilities.");
        sb.AppendLine("- Prefer IAM roles/policies, Security Groups, S3 bucket policies, KMS, and CloudTrail idioms.");
        sb.AppendLine("- Prefer reusable machine-friendly findings such as IamLeastPrivilegeRequired or S3PublicAccessBlocked.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendComplianceGcpImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance (GCP target):");
        sb.AppendLine("- Infer mandatory controls conservatively from constraints and required capabilities.");
        sb.AppendLine("- Prefer IAM bindings, VPC firewall rules, CMEK, and Cloud Audit Logs idioms.");
        sb.AppendLine("- Prefer reusable machine-friendly findings such as FirewallRuleTooPermissive or ServiceAccountKeyExposure.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendComplianceCloudNeutralImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Infer mandatory controls conservatively from constraints and required capabilities.");
        sb.AppendLine("- Avoid Azure-, AWS-, or GCP-specific control names unless ledger-corroborated.");
        sb.AppendLine("- Prefer reusable machine-friendly findings tied to named evidence elements.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendCostAzureImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Prefer managed services with predictable operational cost for MVP workloads.");
        sb.AppendLine("- Highlight token/search spend monitoring when AI services are in scope.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendCostAwsImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance (AWS target):");
        sb.AppendLine("- Prefer managed services with predictable operational cost for MVP workloads.");
        sb.AppendLine("- Discuss AWS on-demand / Savings Plans tradeoffs; cite AWS retail grounding only.");
        sb.AppendLine("- Highlight token/search spend monitoring when AI services are in scope.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendCostGcpImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance (GCP target):");
        sb.AppendLine("- Prefer managed services with predictable operational cost for MVP workloads.");
        sb.AppendLine("- Discuss GCE/GKE/Cloud SQL spend drivers; cite GCP retail grounding only.");
        sb.AppendLine("- Highlight token/search spend monitoring when AI services are in scope.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendCostCloudNeutralImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Prefer managed services with predictable operational cost for MVP workloads.");
        sb.AppendLine("- Avoid hyperscaler-specific retail price catalogs unless ledger-corroborated.");
        sb.AppendLine("- Highlight token/search spend monitoring when AI services are in scope.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendCriticAzureImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Challenge prior agent claims; do not restate generic Azure well-architected checklist items.");
        sb.AppendLine("- Every High/Error/Critical finding must name a specific uploaded element and state a concrete gap or dispute.");
        sb.AppendLine("- Prefer machine-friendly UnderSpecified messages (for example ObservabilityUnderSpecified) only when tied to doc:… or azureExtractor:… evidence refs.");
        sb.AppendLine("- Do NOT emit generic checklist advice (for example Enable MFA, Use HTTPS, encrypt data at rest) unless you tie it to a named element in this architecture.");
        sb.AppendLine("- Omit obvious findings entirely; downgrade any borderline generic item to severity Info with Low confidenceLevel.");
        sb.AppendLine("- Return at most 8 findings; return JSON only.");
        sb.AppendLine();
    }

    private static void AppendCriticAwsImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance (AWS target):");
        sb.AppendLine("- Challenge prior agent claims using AWS constructs (public S3 buckets, open Security Groups, overly broad IAM).");
        sb.AppendLine("- Every High/Error/Critical finding must name a specific uploaded element and state a concrete gap or dispute.");
        sb.AppendLine("- Prefer machine-friendly UnderSpecified messages only when tied to doc:… or awsExtractor:… evidence refs.");
        sb.AppendLine("- Do NOT emit generic checklist advice unless tied to a named element in this architecture.");
        sb.AppendLine("- Omit obvious findings entirely; downgrade any borderline generic item to severity Info with Low confidenceLevel.");
        sb.AppendLine("- Return at most 8 findings; return JSON only.");
        sb.AppendLine();
    }

    private static void AppendCriticGcpImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance (GCP target):");
        sb.AppendLine("- Challenge prior agent claims using GCP constructs (0.0.0.0/0 firewall rules, default SA keys, public Cloud Storage).");
        sb.AppendLine("- Every High/Error/Critical finding must name a specific uploaded element and state a concrete gap or dispute.");
        sb.AppendLine("- Prefer machine-friendly UnderSpecified messages only when tied to doc:… or gcpExtractor:… evidence refs.");
        sb.AppendLine("- Do NOT emit generic checklist advice unless tied to a named element in this architecture.");
        sb.AppendLine("- Omit obvious findings entirely; downgrade any borderline generic item to severity Info with Low confidenceLevel.");
        sb.AppendLine("- Return at most 8 findings; return JSON only.");
        sb.AppendLine();
    }

    private static void AppendCriticCloudNeutralImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Challenge prior agent claims; do not restate generic well-architected checklist items.");
        sb.AppendLine("- Every High/Error/Critical finding must name a specific uploaded element and state a concrete gap or dispute.");
        sb.AppendLine("- Prefer machine-friendly UnderSpecified messages only when tied to doc:… evidence refs.");
        sb.AppendLine("- Do NOT emit generic checklist advice unless tied to a named element in this architecture.");
        sb.AppendLine("- Omit obvious findings entirely; downgrade any borderline generic item to severity Info with Low confidenceLevel.");
        sb.AppendLine("- Return at most 8 findings; return JSON only.");
        sb.AppendLine();
    }
}
