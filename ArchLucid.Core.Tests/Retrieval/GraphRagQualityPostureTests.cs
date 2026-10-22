using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Retrieval;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Retrieval;

[Trait("Category", "Unit")]
public sealed class GraphRagQualityPostureTests
{
    [Fact]
    public void ResolveForGroundedRun_WhenNoGraphRagActivity_ReturnsNull()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        GraphRagQualityPosture.ResolveForGroundedRun(configuration, 0, 0).Should().BeNull();
    }

    [Fact]
    public void ResolveForGroundedRun_WhenNeighborsWithoutAzureSearch_ReturnsUnproven()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureAiSearchProductionLikeConfigurationLint.RetrievalVectorIndexKey] = "InMemory",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();

        GraphRagQualityPosture.ResolveForGroundedRun(configuration, 2, 0)
            .Should().Be(GraphRagQualityPosture.UnprovenValue);
    }

    [Fact]
    public void ResolveForGroundedRun_WhenSeedHitsWithAzureSearch_ReturnsProven()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureAiSearchProductionLikeConfigurationLint.RetrievalVectorIndexKey] = "AzureSearch",
            [AzureAiSearchProductionLikeConfigurationLint.RetrievalAzureSearchEndpointKey] =
                "https://example.search.windows.net",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();

        GraphRagQualityPosture.ResolveForGroundedRun(configuration, 0, 1)
            .Should().Be(GraphRagQualityPosture.ProvenValue);
    }
}
