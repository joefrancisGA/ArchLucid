using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class ProductLearningDashboardSummaryResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_summary_notes_yields_empty_list_not_null()
    {
        const string json = """
            {
              "summaryNotes": null
            }
            """;

        ProductLearningDashboardSummaryResponse? result =
            JsonSerializer.Deserialize<ProductLearningDashboardSummaryResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SummaryNotes.Should().NotBeNull().And.BeEmpty();
    }
}
