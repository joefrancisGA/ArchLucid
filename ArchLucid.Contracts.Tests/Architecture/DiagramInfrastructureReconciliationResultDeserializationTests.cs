using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class DiagramInfrastructureReconciliationResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid snapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string json = $$"""
            {
              "runId": "{{runId}}",
              "snapshotId": "{{snapshotId}}",
              "rows": null,
              "diagramNodeCount": 0,
              "inventoryResourceCount": 0,
              "edgeGaps": null
            }
            """;

        DiagramInfrastructureReconciliationResult result =
            JsonSerializer.Deserialize<DiagramInfrastructureReconciliationResult>(json, ContractJson.Default)!;

        result.Rows.Should().NotBeNull().And.BeEmpty();
        result.EdgeGaps.Should().NotBeNull().And.BeEmpty();
    }
}
