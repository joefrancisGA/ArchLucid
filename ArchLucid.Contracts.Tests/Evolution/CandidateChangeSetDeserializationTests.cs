using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Evolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Evolution;

[Trait("Category", "Unit")]
public sealed class CandidateChangeSetDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "changeSetId": "00000000-0000-0000-0000-000000000001",
              "sourcePlanId": "00000000-0000-0000-0000-000000000002",
              "description": "test",
              "proposedActions": null,
              "affectedComponents": null,
              "approvalStatus": 0,
              "createdUtc": "2026-10-15T00:00:00Z"
            }
            """;

        CandidateChangeSet changeSet =
            JsonSerializer.Deserialize<CandidateChangeSet>(json, ContractJson.CamelCaseCompact)!;

        changeSet.ProposedActions.Should().NotBeNull().And.BeEmpty();
        changeSet.AffectedComponents.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_expected_impact_yields_non_null_expected_impact_not_null()
    {
        const string json = """
            {
              "changeSetId": "00000000-0000-0000-0000-000000000001",
              "sourcePlanId": "00000000-0000-0000-0000-000000000002",
              "description": "test",
              "expectedImpact": null,
              "approvalStatus": 0,
              "createdUtc": "2026-10-15T00:00:00Z"
            }
            """;

        CandidateChangeSet changeSet =
            JsonSerializer.Deserialize<CandidateChangeSet>(json, ContractJson.CamelCaseCompact)!;

        changeSet.ExpectedImpact.Should().NotBeNull();
    }
}
