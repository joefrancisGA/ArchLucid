using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning.Planning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class LearningPlanningReportPlanEvidenceBlockDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "signals": null,
              "artifacts": null,
              "architectureRunIds": null
            }
            """;

        LearningPlanningReportPlanEvidenceBlock? result =
            JsonSerializer.Deserialize<LearningPlanningReportPlanEvidenceBlock>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Signals.Should().NotBeNull().And.BeEmpty();
        result.Artifacts.Should().NotBeNull().And.BeEmpty();
        result.ArchitectureRunIds.Should().NotBeNull().And.BeEmpty();
    }
}
