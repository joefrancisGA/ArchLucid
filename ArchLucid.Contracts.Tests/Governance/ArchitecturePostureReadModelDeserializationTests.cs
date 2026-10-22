using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Posture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitecturePostureReadModelDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "pillarAggregates": null,
              "packAssignments": null
            }
            """;

        ArchitecturePostureReadModel? model =
            JsonSerializer.Deserialize<ArchitecturePostureReadModel>(json, ContractJson.CamelCaseCompact);

        model.Should().NotBeNull();
        model!.PillarAggregates.Should().NotBeNull().And.BeEmpty();
        model.PackAssignments.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_review_integrity_yields_non_null_aggregate_not_null()
    {
        const string json = """
            {
              "reviewIntegrity": null
            }
            """;

        ArchitecturePostureReadModel? model =
            JsonSerializer.Deserialize<ArchitecturePostureReadModel>(json, ContractJson.CamelCaseCompact);

        model.Should().NotBeNull();
        model!.ReviewIntegrity.Should().NotBeNull();
    }
}
