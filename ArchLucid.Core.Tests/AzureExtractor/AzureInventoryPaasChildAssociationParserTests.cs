using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryPaasChildAssociationParserTests
{
    [Fact]
    public void TryParse_reads_parent_and_child_when_resource_ids_are_percent_encoded_plain_arm_scalars()
    {
        const string serverId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";
        const string databaseId = $"{serverId}/databases/appdb";
        string encodedParentId = Uri.EscapeDataString(serverId);
        string encodedChildId = Uri.EscapeDataString(databaseId);

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "parentResourceId": "{{encodedParentId}}",
                                                              "childResourceId": "{{encodedChildId}}",
                                                              "childName": "appdb",
                                                              "childType": "{{AzureInventoryPaasChildAssociationTypes.SqlDatabase}}",
                                                              "collectionStatus": "{{AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded}}"
                                                            }
                                                            """);

        bool parsed = AzureInventoryPaasChildAssociationParser.TryParse(
            document.RootElement,
            out AzureInventoryPaasChildAssociationRow? row,
            out string? errorMessage);

        parsed.Should().BeTrue(errorMessage);
        row.Should().NotBeNull();
        row!.ParentResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(serverId));
        row.ChildResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(databaseId));
    }
}
