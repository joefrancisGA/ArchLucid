using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PreFinalizeChecklistResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "runId": "run-1",
              "readyToFinalize": true,
              "items": null,
              "advisoryCount": 0,
              "blockingCount": 0,
              "preCommitGateEnabled": false
            }
            """;

        PreFinalizeChecklistResult result =
            JsonSerializer.Deserialize<PreFinalizeChecklistResult>(json, ContractJson.Default)!;

        result.Items.Should().NotBeNull().And.BeEmpty();
    }
}
