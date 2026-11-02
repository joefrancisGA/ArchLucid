using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryPaasChildAssociationExtractorTests
{
    [Fact]
    public void TryExtractChild_maps_sql_database_child()
    {
        const string serverId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";
        const string databaseId = $"{serverId}/databases/appdb";

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "id": "{{databaseId}}",
                                                              "name": "appdb"
                                                            }
                                                            """);

        bool extracted = AzureInventoryPaasChildAssociationExtractor.TryExtractChild(
            serverId,
            document.RootElement,
            AzureInventoryPaasChildAssociationTypes.SqlDatabase,
            out AzureInventoryPaasChildAssociationRow? row);

        extracted.Should().BeTrue();
        row.Should().NotBeNull();
        row!.ParentResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(serverId));
        row.ChildResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(databaseId));
        row.ChildType.Should().Be(AzureInventoryPaasChildAssociationTypes.SqlDatabase);
    }

    [Fact]
    public void TryExtractChild_reads_child_when_id_is_percent_encoded_plain_arm_scalar()
    {
        const string serverId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";
        const string databaseId = $"{serverId}/databases/appdb";
        string encodedChildId = Uri.EscapeDataString(databaseId);

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "id": "{{encodedChildId}}",
                                                              "name": "appdb"
                                                            }
                                                            """);

        bool extracted = AzureInventoryPaasChildAssociationExtractor.TryExtractChild(
            serverId,
            document.RootElement,
            AzureInventoryPaasChildAssociationTypes.SqlDatabase,
            out AzureInventoryPaasChildAssociationRow? row);

        extracted.Should().BeTrue();
        row.Should().NotBeNull();
        row!.ParentResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(serverId));
        row.ChildResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(databaseId));
    }

    [Fact]
    public void TryExtractChild_reads_parent_when_parent_resource_id_is_percent_encoded_plain_arm_scalar()
    {
        const string serverId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";
        const string databaseId = $"{serverId}/databases/appdb";

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "id": "{{databaseId}}",
                                                              "name": "appdb"
                                                            }
                                                            """);

        bool extracted = AzureInventoryPaasChildAssociationExtractor.TryExtractChild(
            Uri.EscapeDataString(serverId),
            document.RootElement,
            AzureInventoryPaasChildAssociationTypes.SqlDatabase,
            out AzureInventoryPaasChildAssociationRow? row);

        extracted.Should().BeTrue();
        row.Should().NotBeNull();
        row!.ParentResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(serverId));
        row.ChildResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(databaseId));
    }
}
