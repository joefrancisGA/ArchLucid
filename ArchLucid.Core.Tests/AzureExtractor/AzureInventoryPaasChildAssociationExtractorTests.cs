using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

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
        row!.ParentResourceId.Should().Be(serverId);
        row.ChildResourceId.Should().Be(databaseId);
        row.ChildType.Should().Be(AzureInventoryPaasChildAssociationTypes.SqlDatabase);
    }
}
