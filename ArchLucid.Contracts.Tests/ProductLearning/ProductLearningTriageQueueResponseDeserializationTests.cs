using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class ProductLearningTriageQueueResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null
            }
            """;

        ProductLearningTriageQueueResponse? result =
            JsonSerializer.Deserialize<ProductLearningTriageQueueResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull().And.BeEmpty();
    }
}
