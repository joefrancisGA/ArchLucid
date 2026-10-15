using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class ProductLearningArtifactOutcomeTrendsResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_trends_yields_empty_list_not_null()
    {
        const string json = """
            {
              "trends": null
            }
            """;

        ProductLearningArtifactOutcomeTrendsResponse? result =
            JsonSerializer.Deserialize<ProductLearningArtifactOutcomeTrendsResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Trends.Should().NotBeNull().And.BeEmpty();
    }
}
