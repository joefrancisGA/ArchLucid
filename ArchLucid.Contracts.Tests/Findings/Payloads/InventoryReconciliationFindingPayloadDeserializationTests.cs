using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class InventoryReconciliationFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_resource_id_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "graphTopologyResourceCount": 0,
              "inventoryResourceCount": 0,
              "graphOnlyResourceIds": null,
              "inventoryOnlyResourceIds": null
            }
            """;

        InventoryReconciliationFindingPayload? payload =
            JsonSerializer.Deserialize<InventoryReconciliationFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.GraphOnlyResourceIds.Should().NotBeNull().And.BeEmpty();
        payload.InventoryOnlyResourceIds.Should().NotBeNull().And.BeEmpty();
    }
}
