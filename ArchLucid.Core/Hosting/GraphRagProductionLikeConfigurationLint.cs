using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Advisory when Graph-RAG is enabled without Azure AI Search vector posture (V1 §2.20 pilot validation).
/// </summary>
public static class GraphRagProductionLikeConfigurationLint
{
    /// <summary>
    ///     Returns an advisory finding when Graph-RAG neighbor expansion is enabled but Azure Search is not configured.
    /// </summary>
    public static HostingMisconfigurationWarning? TryDescribeAdvisoryFinding(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        AdvancedRetrievalOptions advanced =
            configuration.GetSection(AdvancedRetrievalOptions.SectionPath).Get<AdvancedRetrievalOptions>()
            ?? new AdvancedRetrievalOptions();

        if (!advanced.Enabled || !advanced.EnableGraphRag)
            return null;

        if (HasAzureSearchPosture(configuration))
            return null;

        string communityNote = advanced.EnableCommunitySummarization
            ? " Community summarization is also enabled and inherits the same unproven vector-index posture."
            : string.Empty;

        return new HostingMisconfigurationWarning(
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.GraphRagEnabledWithoutAzureSearchPosture,
            "Retrieval:Advanced:EnableGraphRag is true but Azure AI Search is not configured "
            + "(Retrieval:VectorIndex=AzureSearch and Retrieval:AzureSearch:Endpoint). "
            + "Graph-RAG neighbor expansion quality is unproven without a production vector index."
            + communityNote);
    }

    internal static bool HasAzureSearchPosture(IConfiguration configuration)
    {
        string vectorIndex =
            configuration[AzureAiSearchProductionLikeConfigurationLint.RetrievalVectorIndexKey]?.Trim() ?? "InMemory";

        if (!string.Equals(
                vectorIndex,
                AzureAiSearchProductionLikeConfigurationLint.RequiredVectorIndexMode,
                StringComparison.OrdinalIgnoreCase))
            return false;

        string? endpoint =
            configuration[AzureAiSearchProductionLikeConfigurationLint.RetrievalAzureSearchEndpointKey]?.Trim();

        return !string.IsNullOrWhiteSpace(endpoint);
    }
}
