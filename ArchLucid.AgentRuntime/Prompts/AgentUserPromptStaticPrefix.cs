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

        CloudProviderAgentPromptComposer.AppendUserPromptCloudGuidance(sb, AgentType.Topology, cloudProvider);

        if (cloudProvider == CloudProvider.Azure)
        {
            AppendTopologyAzureImportantGuidance(sb);
        }
        else if (cloudProvider == CloudProvider.None)
        {
            AppendTopologyCloudNeutralImportantGuidance(sb);
        }
    }

    /// <summary>Compliance agent action line plus policy inference rules.</summary>
    public static void AppendCompliance(StringBuilder sb)
    {
        sb.AppendLine("Generate a compliance AgentResult.");
        sb.AppendLine();
        AppendComplianceImportantGuidance(sb);
    }

    /// <summary>Cost agent action line plus spend guidance.</summary>
    public static void AppendCost(StringBuilder sb)
    {
        sb.AppendLine("Generate a cost AgentResult.");
        sb.AppendLine();
        AppendCostImportantGuidance(sb);
    }

    /// <summary>Critic agent action line plus finding-quality rules.</summary>
    public static void AppendCritic(StringBuilder sb)
    {
        sb.AppendLine("Generate a critic AgentResult.");
        sb.AppendLine();
        AppendCriticImportantGuidance(sb);
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
    private static void AppendTopologyCloudNeutralImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Produce a simple, coherent MVP-quality cloud-neutral topology.");
        sb.AppendLine("- Avoid naming a specific hyperscaler unless the request or ledger requires it.");
        sb.AppendLine("- Use stable IDs such as svc-api, ds-metadata where appropriate.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendComplianceImportantGuidance(StringBuilder sb)
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

    private static void AppendCostImportantGuidance(StringBuilder sb)
    {
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Prefer managed services with predictable operational cost for MVP workloads.");
        sb.AppendLine("- Highlight token/search spend monitoring when AI services are in scope.");
        sb.AppendLine("- Return JSON only.");
        sb.AppendLine();
    }

    private static void AppendCriticImportantGuidance(StringBuilder sb)
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
}
