using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Production-like retrieval policy: Azure AI Search is required on all production-like profiles (owner 2026-05-29).
///     Enforced as blocking findings in <c>archlucid config lint</c> and operator configuration lint.
/// </summary>
public static class AzureAiSearchProductionLikeConfigurationLint
{
    public const string RetrievalVectorIndexKey = "Retrieval:VectorIndex";

    public const string RetrievalAzureSearchEndpointKey = "Retrieval:AzureSearch:Endpoint";

    /// <summary>Expected vector index mode for hosted production-like workloads.</summary>
    public const string RequiredVectorIndexMode = "AzureSearch";

    /// <summary>
    ///     Returns blocking findings when production-like hosting is detected but Azure AI Search is not configured per policy.
    /// </summary>
    public static IReadOnlyList<HostingMisconfigurationWarning> DescribeBlockingFindings(
        IConfiguration configuration,
        string aspNetCoreEnvironmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(aspNetCoreEnvironmentName))
            throw new ArgumentException("ASP.NET Core environment name is required.", nameof(aspNetCoreEnvironmentName));

        if (!ProductionLikeHostingMisconfigurationAdvisor.IsProductionLikeHosting(
                aspNetCoreEnvironmentName.Trim(),
                configuration))
            return [];

        List<HostingMisconfigurationWarning> findings = [];

        string vectorIndex = configuration[RetrievalVectorIndexKey]?.Trim() ?? "InMemory";

        if (!string.Equals(vectorIndex, RequiredVectorIndexMode, StringComparison.OrdinalIgnoreCase))
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    ProductionLikeHostingMisconfigurationAdvisorRuleNames.AzureAiSearchVectorIndexRequiredProductionLike,
                    "Retrieval:VectorIndex must be AzureSearch on production-like hosting "
                    + "(InMemory is for Development and automated tests only)."));
        }

        string? endpoint = configuration[RetrievalAzureSearchEndpointKey]?.Trim();

        if (string.IsNullOrWhiteSpace(endpoint))
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    ProductionLikeHostingMisconfigurationAdvisorRuleNames.AzureAiSearchEndpointRequiredProductionLike,
                    "Retrieval:AzureSearch:Endpoint must be set on production-like hosting so AzureSearchSdkClient "
                    + "registers with tenant-scoped search (TB-071)."));
        }

        return findings;
    }
}
