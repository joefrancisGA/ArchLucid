using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class FinalizeReadinessResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "runId": "run-1",
              "readyToFinalize": false,
              "blockedReasonSummary": null,
              "blocks": null,
              "checklist": { "items": [] },
              "scorecard": {},
              "scorecardBlockingReasons": null,
              "finalizeQualityGateEnabled": true
            }
            """;

        FinalizeReadinessResult result =
            JsonSerializer.Deserialize<FinalizeReadinessResult>(json, ContractJson.Default)!;

        result.Blocks.Should().NotBeNull().And.BeEmpty();
        result.ScorecardBlockingReasons.Should().NotBeNull().And.BeEmpty();
    }
}
