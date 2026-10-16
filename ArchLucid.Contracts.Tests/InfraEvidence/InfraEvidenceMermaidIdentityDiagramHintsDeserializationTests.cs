using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceMermaidIdentityDiagramHintsDeserializationTests
{
    [Fact]
    public void Deserialize_null_inventory_filtered_identity_arm_types_yields_empty_list_not_null()
    {
        const string json = """
            {
              "inventoryFilteredIdentityArmTypes": null
            }
            """;

        InfraEvidenceMermaidIdentityDiagramHints? hints =
            JsonSerializer.Deserialize<InfraEvidenceMermaidIdentityDiagramHints>(json, ContractJson.CamelCaseCompact);

        hints.Should().NotBeNull();
        hints!.InventoryFilteredIdentityArmTypes.Should().NotBeNull().And.BeEmpty();
    }
}
