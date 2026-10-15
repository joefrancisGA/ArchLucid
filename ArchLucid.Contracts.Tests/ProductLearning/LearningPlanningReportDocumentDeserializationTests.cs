using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning.Planning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class LearningPlanningReportDocumentDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "summary": {},
              "themes": null,
              "plans": null
            }
            """;

        LearningPlanningReportDocument? result =
            JsonSerializer.Deserialize<LearningPlanningReportDocument>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Themes.Should().NotBeNull().And.BeEmpty();
        result.Plans.Should().NotBeNull().And.BeEmpty();
    }
}
