using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryNsgAssociationParserTests
{
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
}
