using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureModelDiffDeserializationTests
{
    [Fact]
    public void Deserialize_null_entries_yields_empty_list_not_null()
    {
        const string json = """
            {
              "recommendationId": "rec-1",
              "entries": null
            }
            """;

        ArchitectureModelDiff? diff =
            JsonSerializer.Deserialize<ArchitectureModelDiff>(json, ContractJson.CamelCaseCompact);

        diff.Should().NotBeNull();
        diff!.Entries.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_before_and_after_models_yields_non_null_models_not_null()
    {
        const string json = """
            {
              "recommendationId": "rec-1",
              "beforeModel": null,
              "afterModel": null
            }
            """;

        ArchitectureModelDiff? diff =
            JsonSerializer.Deserialize<ArchitectureModelDiff>(json, ContractJson.CamelCaseCompact);

        diff.Should().NotBeNull();
        diff!.BeforeModel.Should().NotBeNull();
        diff.AfterModel.Should().NotBeNull();
    }
}
