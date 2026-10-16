using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunDecisionExplainabilityDtoDeserializationTests
{
    [Fact]
    public void Deserialize_null_explainability_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "snapshotIds": {},
              "manifestDecisions": null,
              "coordinatorDecisionNodes": null,
              "findingEngineFailures": null,
              "manifestHonestyWarnings": null
            }
            """;

        RunDecisionExplainabilityDto? dto =
            JsonSerializer.Deserialize<RunDecisionExplainabilityDto>(json, ContractJson.CamelCaseCompact);

        dto.Should().NotBeNull();
        dto!.ManifestDecisions.Should().NotBeNull().And.BeEmpty();
        dto.CoordinatorDecisionNodes.Should().NotBeNull().And.BeEmpty();
        dto.FindingEngineFailures.Should().NotBeNull().And.BeEmpty();
        dto.ManifestHonestyWarnings.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_snapshot_ids_yields_non_null_snapshot_ids_not_null()
    {
        const string json = """
            {
              "snapshotIds": null
            }
            """;

        RunDecisionExplainabilityDto? dto =
            JsonSerializer.Deserialize<RunDecisionExplainabilityDto>(json, ContractJson.CamelCaseCompact);

        dto.Should().NotBeNull();
        dto!.SnapshotIds.Should().NotBeNull();
    }

    [Fact]
    public void Deserialize_null_authority_rule_audit_remains_null()
    {
        const string json = """
            {
              "snapshotIds": {},
              "authorityRuleAudit": null
            }
            """;

        RunDecisionExplainabilityDto? dto =
            JsonSerializer.Deserialize<RunDecisionExplainabilityDto>(json, ContractJson.CamelCaseCompact);

        dto.Should().NotBeNull();
        dto!.AuthorityRuleAudit.Should().BeNull();
    }
}
