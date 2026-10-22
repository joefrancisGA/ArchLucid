using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Posture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PillarPostureDeserializationTests
{
    [Fact]
    public void Deserialize_null_examination_yields_non_null_examination_not_null()
    {
        const string json = """
            {
              "pillarKey": "security",
              "displayName": "Security",
              "displayOrder": 1,
              "examination": null
            }
            """;

        PillarPosture? result =
            JsonSerializer.Deserialize<PillarPosture>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Examination.Should().NotBeNull();
    }

    [Fact]
    public void Deserialize_null_display_name_yields_empty_string_not_null()
    {
        const string json = """
            {
              "pillarKey": "security",
              "displayName": null,
              "displayOrder": 1,
              "examination": { "state": 0 }
            }
            """;

        PillarPosture? result =
            JsonSerializer.Deserialize<PillarPosture>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.DisplayName.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_pillar_key_yields_empty_string_not_null()
    {
        const string json = """
            {
              "pillarKey": null,
              "displayName": "Security",
              "displayOrder": 1,
              "examination": { "state": 0 }
            }
            """;

        PillarPosture? result =
            JsonSerializer.Deserialize<PillarPosture>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.PillarKey.Should().BeEmpty();
    }

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
