using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryNsgAssociationParserTests
{
    [Fact]
    public void Parse_does_not_borrow_target_from_a_longer_association_index()
    {
        const string subnet = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/default";
        string prefix = InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix;
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{prefix}10.targetArmId"] = subnet,
            [$"{prefix}10.kind"] = AzureInventoryNsgAssociationParser.SubnetKind,
            [$"{prefix}1.targetArmId"] = " ",
        };

        IReadOnlyList<AzureInventoryNsgAssociation> associations = AzureInventoryNsgAssociationParser.Parse(properties);

        associations.Should().ContainSingle(association => association.TargetArmId == ArmResourceIdNormalizer.Normalize(subnet));
        associations.Should().ContainSingle(association => association.TargetArmId == string.Empty);
    }

    [Fact]
    public void Parse_infers_kind_from_own_target_when_longer_index_has_kind()
    {
        const string nic = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic";
        const string subnet = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/default";
        string prefix = InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix;
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{prefix}20.targetArmId"] = subnet,
            [$"{prefix}20.kind"] = AzureInventoryNsgAssociationParser.SubnetKind,
            [$"{prefix}2.targetArmId"] = nic,
        };

        AzureInventoryNsgAssociationParser.Parse(properties).Should().ContainSingle(association =>
            association.TargetArmId == ArmResourceIdNormalizer.Normalize(nic)
            && association.TargetKind == AzureInventoryNsgAssociationParser.NicKind);
    }

    [Fact]
    public void Parse_reads_explicit_flattened_association_properties_when_suffix_casing_differs()
    {
        string associationPrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{associationPrefix}.TargetArmId"] =
                "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/default",
            [$"{associationPrefix}.Kind"] = AzureInventoryNsgAssociationParser.SubnetKind,
        };

        IReadOnlyList<AzureInventoryNsgAssociation> associations =
            AzureInventoryNsgAssociationParser.Parse(properties);

        associations.Should().ContainSingle();
        associations[0].TargetKind.Should().Be(AzureInventoryNsgAssociationParser.SubnetKind);
        associations[0].TargetArmId.Should().Contain("/subnets/default");
    }

    [Fact]
    public void Parse_normalizes_percent_encoded_subnet_target_arm_id()
    {
        const string encodedSubnetId =
            "%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2FresourceGroups%2Frg%2Fproviders%2FMicrosoft.Network%2FvirtualNetworks%2Fvnet%2Fsubnets%2Fdefault";

        string associationPrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{associationPrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix}"] =
                encodedSubnetId,
        };

        IReadOnlyList<AzureInventoryNsgAssociation> associations =
            AzureInventoryNsgAssociationParser.Parse(properties);

        associations.Should().ContainSingle();
        associations[0].TargetKind.Should().Be(AzureInventoryNsgAssociationParser.SubnetKind);
        associations[0].TargetArmId.Should().Be(
            "/subscriptions/00000000-0000-0000-0000-000000000000/resourcegroups/rg/providers/microsoft.network/virtualnetworks/vnet/subnets/default");
    }
}
