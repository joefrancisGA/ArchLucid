using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class ArmResourceIdNormalizerTests
{
    [Theory]
    [InlineData("/subscriptions/abc/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa", "/subscriptions/abc/resourcegroups/rg/providers/microsoft.storage/storageaccounts/sa")]
    [InlineData("/subscriptions/abc/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa/", "/subscriptions/abc/resourcegroups/rg/providers/microsoft.storage/storageaccounts/sa")]
    [InlineData("  /subscriptions/ABC/  ", "/subscriptions/abc")]
    public void Normalize_lowercases_and_strips_trailing_slash(string input, string expected)
    {
        ArmResourceIdNormalizer.Normalize(input).Should().Be(expected);
    }

    [Fact]
    public void Normalize_empty_input_returns_empty_string()
    {
        ArmResourceIdNormalizer.Normalize(null).Should().BeEmpty();
        ArmResourceIdNormalizer.Normalize("   ").Should().BeEmpty();
    }

    [Fact]
    public void IsDescendantOf_detects_nested_arm_child_resources()
    {
        const string parent =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        const string child =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1/extensions/ext";

        ArmResourceIdNormalizer.IsDescendantOf(child, parent).Should().BeTrue();
        ArmResourceIdNormalizer.IsDescendantOf(parent, child).Should().BeFalse();
    }

    [Fact]
    public void IsDescendantOf_does_not_treat_similar_sibling_names_as_nested()
    {
        const string siblingA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string siblingB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa10";

        ArmResourceIdNormalizer.IsDescendantOf(siblingB, siblingA).Should().BeFalse();
    }

    [Fact]
    public void TryGetParentResourceId_returns_vnet_for_subnet()
    {
        const string subnet =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/app";
        const string vnet =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";

        bool found = ArmResourceIdNormalizer.TryGetParentResourceId(subnet, out string parent);

        found.Should().BeTrue();
        parent.Should().Be(vnet);
    }

    [Fact]
    public void TryGetParentResourceId_returns_sql_server_for_database()
    {
        const string database =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql/databases/app";
        const string server =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql";

        bool found = ArmResourceIdNormalizer.TryGetParentResourceId(database, out string parent);

        found.Should().BeTrue();
        parent.Should().Be(server);
    }

    [Fact]
    public void TryGetParentResourceId_returns_false_for_top_level_virtual_machine()
    {
        const string virtualMachine =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        bool found = ArmResourceIdNormalizer.TryGetParentResourceId(virtualMachine, out string parent);

        found.Should().BeFalse();
        parent.Should().BeEmpty();
    }

    [Fact]
    public void TryGetParentResourceId_returns_false_for_blank_id()
    {
        ArmResourceIdNormalizer.TryGetParentResourceId(null, out string parent).Should().BeFalse();
        parent.Should().BeEmpty();
    }

    [Fact]
    public void EnumerateAncestorResourceIds_walks_subnet_to_vnet()
    {
        const string subnet =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/app";
        const string vnet =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";

        ArmResourceIdNormalizer.EnumerateAncestorResourceIds(subnet)
            .Should()
            .Equal(ArmResourceIdNormalizer.Normalize(vnet));
    }

    [Fact]
    public void TryResolveVisibleAncestorArmId_maps_subnet_onto_visible_vnet()
    {
        const string subnet =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/app";
        string vnet = ArmResourceIdNormalizer.Normalize(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1");
        HashSet<string> visible = new(StringComparer.OrdinalIgnoreCase) { vnet };

        bool found = ArmResourceIdNormalizer.TryResolveVisibleAncestorArmId(subnet, visible, out string ancestor);

        found.Should().BeTrue();
        ancestor.Should().Be(vnet);
    }

    [Fact]
    public void TryResolveVisibleAncestorArmId_returns_false_when_no_parent_is_visible()
    {
        const string subnet =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/app";
        HashSet<string> visible = new(StringComparer.OrdinalIgnoreCase)
        {
            ArmResourceIdNormalizer.Normalize(
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1"),
        };

        ArmResourceIdNormalizer.TryResolveVisibleAncestorArmId(subnet, visible, out string ancestor)
            .Should()
            .BeFalse();
        ancestor.Should().BeEmpty();
    }
}
