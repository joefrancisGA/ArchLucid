using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceRationaleResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_bullets_yields_empty_list_not_null()
    {
        const string json = """
            {
              "schemaVersion": 1,
              "approvalRequestId": "req-1",
              "summary": "summary",
              "bullets": null
            }
            """;

        GovernanceRationaleResult result =
            JsonSerializer.Deserialize<GovernanceRationaleResult>(json, ContractJson.Default)!;

        result.Bullets.Should().NotBeNull().And.BeEmpty();
    }
}
