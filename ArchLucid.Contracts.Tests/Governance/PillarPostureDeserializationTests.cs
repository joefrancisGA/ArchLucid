using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Posture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PillarPostureDeserializationTests
{
    [Fact]
    public void Deserialize_null_pack_assignments_yields_empty_list_not_null()
    {
        const string json = """
            {
              "packAssignments": null
            }
            """;

        PillarPosture? result =
            JsonSerializer.Deserialize<PillarPosture>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.PackAssignments.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_finding_counts_yields_non_null_aggregate_not_null()
    {
        const string json = """
            {
              "findingCounts": null
            }
            """;

        PillarPosture? result =
            JsonSerializer.Deserialize<PillarPosture>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.FindingCounts.Should().NotBeNull();
    }
}
