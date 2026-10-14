using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PreCommitGateResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "blocked": true,
              "reason": "policy",
              "blockingFindingIds": null,
              "policyPackId": "pack-1",
              "minimumBlockingSeverity": 2,
              "warnOnly": false,
              "warnings": null,
              "blockExplanation": null
            }
            """;

        PreCommitGateResult result =
            JsonSerializer.Deserialize<PreCommitGateResult>(json, ContractJson.Default)!;

        result.BlockingFindingIds.Should().NotBeNull().And.BeEmpty();
        result.Warnings.Should().NotBeNull().And.BeEmpty();
    }
}
