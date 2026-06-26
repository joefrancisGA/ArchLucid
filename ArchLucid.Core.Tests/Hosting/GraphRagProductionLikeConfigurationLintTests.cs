using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
public sealed class GraphRagProductionLikeConfigurationLintTests
{
    [Fact]
    public void TryDescribeAdvisoryFinding_WhenGraphRagEnabledWithoutSearch_ReturnsAdvisory()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            [$"{AdvancedRetrievalOptions.SectionPath}:Enabled"] = "true",
            [$"{AdvancedRetrievalOptions.SectionPath}:EnableGraphRag"] = "true",
            [AzureAiSearchProductionLikeConfigurationLint.RetrievalVectorIndexKey] = "InMemory",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();

        HostingMisconfigurationWarning? finding =
            GraphRagProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(configuration);

        finding.Should().NotBeNull();
        finding!.Value.RuleName.Should().Be(
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.GraphRagEnabledWithoutAzureSearchPosture);
    }

    [Fact]
    public void TryDescribeAdvisoryFinding_WhenAzureSearchConfigured_ReturnsNull()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            [$"{AdvancedRetrievalOptions.SectionPath}:Enabled"] = "true",
            [$"{AdvancedRetrievalOptions.SectionPath}:EnableGraphRag"] = "true",
            [AzureAiSearchProductionLikeConfigurationLint.RetrievalVectorIndexKey] = "AzureSearch",
            [AzureAiSearchProductionLikeConfigurationLint.RetrievalAzureSearchEndpointKey] =
                "https://example.search.windows.net",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();

        GraphRagProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(configuration).Should().BeNull();
    }

    [Fact]
    public void TryDescribeAdvisoryFinding_WhenGraphRagDisabled_ReturnsNull()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            [$"{AdvancedRetrievalOptions.SectionPath}:Enabled"] = "true",
            [$"{AdvancedRetrievalOptions.SectionPath}:EnableGraphRag"] = "false",
            [AzureAiSearchProductionLikeConfigurationLint.RetrievalVectorIndexKey] = "InMemory",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();

        GraphRagProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(configuration).Should().BeNull();
    }
}
