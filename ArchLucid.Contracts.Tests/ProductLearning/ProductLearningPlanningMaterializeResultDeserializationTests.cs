using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class ProductLearningPlanningMaterializeResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "citations": null,
              "retrievalCitations": null
            }
            """;

        ProductLearningPlanningMaterializeResult? result =
            JsonSerializer.Deserialize<ProductLearningPlanningMaterializeResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Citations.Should().NotBeNull().And.BeEmpty();
        result.RetrievalCitations.Should().NotBeNull().And.BeEmpty();
    }
}
