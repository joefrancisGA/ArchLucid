using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Risk;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Risk;

[Trait("Category", "Unit")]
public sealed class RiskSnapshotDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "reviewRunId": "run-1",
              "tenantId": "tenant-1",
              "createdAt": "2026-10-14T00:00:00Z",
              "tradeoffs": null,
              "requirementSmells": null,
              "concerns": null,
              "executionContext": null
            }
            """;

        RiskSnapshot snapshot = JsonSerializer.Deserialize<RiskSnapshot>(json, ContractJson.Default)!;

        snapshot.Tradeoffs.Should().NotBeNull().And.BeEmpty();
        snapshot.RequirementSmells.Should().NotBeNull().And.BeEmpty();
        snapshot.Concerns.Should().NotBeNull().And.BeEmpty();
        snapshot.ExecutionContext.Should().NotBeNull().And.BeEmpty();
    }
}
