using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAccessConnectorTargetParserTests
{
    private const string ParentArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Synapse/workspaces/syn";

    private const string ExternalTargetArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stexternal";

    [Fact]
    public void ParseParentArmId_reads_hydrated_parent_reference()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [InventoryDiagramParentAttachmentPropertyKeys.AccessConnectorParentArmId] = ParentArmId,
        };

        AzureInventoryAccessConnectorTargetParser.ParseParentArmId(properties)
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(ParentArmId));
    }

    [Fact]
    public void ParseExternalTargetArmId_reads_arm_id_from_json_reference_property_values()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["targetResourceId"] =
                """
                {"id":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stexternal"}
                """,
        };

        AzureInventoryAccessConnectorTargetParser.ParseExternalTargetArmId(properties)
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(ExternalTargetArmId));
    }

    [Fact]
    public void ParseExternalTargetArmId_reads_explicit_target_reference()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [InventoryDiagramParentAttachmentPropertyKeys.ExternalTargetArmId] = ExternalTargetArmId,
        };

        AzureInventoryAccessConnectorTargetParser.ParseExternalTargetArmId(properties)
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(ExternalTargetArmId));
    }
}
