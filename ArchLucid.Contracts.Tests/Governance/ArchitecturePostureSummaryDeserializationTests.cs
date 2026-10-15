using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Posture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitecturePostureSummaryDeserializationTests
{
    [Fact]
    public void Deserialize_null_pillars_yields_empty_list_not_null()
    {
        const string json = """
            {
              "pillars": null
            }
            """;

        ArchitecturePostureSummary? result =
            JsonSerializer.Deserialize<ArchitecturePostureSummary>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Pillars.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_review_integrity_yields_non_null_aggregate_not_null()
    {
        const string json = """
            {
              "reviewIntegrity": null
            }
            """;

        ArchitecturePostureSummary? result =
            JsonSerializer.Deserialize<ArchitecturePostureSummary>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ReviewIntegrity.Should().NotBeNull();
    }
}
