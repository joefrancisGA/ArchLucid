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
    public void DecodePercentEscapes_decodes_repeatedly_encoded_arm_ids()
    {
        const string encodedTwice =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns%252Feventhubs%252Forders";

        ArmResourceIdNormalizer.DecodePercentEscapes(encodedTwice)
            .Should()
            .Be("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns/eventhubs/orders");
    }

    [Fact]
    public void DecodePercentEscapes_leaves_plain_ids_unchanged()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        ArmResourceIdNormalizer.DecodePercentEscapes(armId).Should().Be(armId);
    }

    [Fact]
    public void DecodePercentEscapes_keeps_last_known_good_value_when_encoding_is_malformed()
    {
        ArmResourceIdNormalizer.DecodePercentEscapes("%ZZ%2Fsubscriptions%2Fsub")
            .Should()
            .Be("%ZZ/subscriptions/sub");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void NormalizeOrEmpty_blank_input_returns_empty_string(string? input)
    {
        ArmResourceIdNormalizer.NormalizeOrEmpty(input).Should().BeEmpty();
    }

    [Fact]
    public void NormalizeOrEmpty_trims_decodes_and_normalizes_arm_ids()
    {
        const string encodedTwice =
            " /subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns%252Feventhubs%252Forders ";

        ArmResourceIdNormalizer.NormalizeOrEmpty(encodedTwice)
            .Should()
            .Be("/subscriptions/sub/resourcegroups/rg/providers/microsoft.eventhub/namespaces/ehns/eventhubs/orders");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void NormalizeOrNull_blank_input_returns_null(string? input)
    {
        ArmResourceIdNormalizer.NormalizeOrNull(input).Should().BeNull();
    }

    [Fact]
    public void NormalizeOrNull_decodes_and_normalizes_arm_ids()
    {
        const string encoded =
            "%2Fsubscriptions%2Fsub%2FresourceGroups%2Frg%2Fproviders%2FMicrosoft.Storage%2FstorageAccounts%2Fsa1";

        ArmResourceIdNormalizer.NormalizeOrNull(encoded)
            .Should()
            .Be("/subscriptions/sub/resourcegroups/rg/providers/microsoft.storage/storageaccounts/sa1");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void NormalizeIfArmId_blank_input_returns_null(string? input)
    {
        ArmResourceIdNormalizer.NormalizeIfArmId(input).Should().BeNull();
    }

    [Fact]
    public void NormalizeIfArmId_normalizes_values_with_a_subscriptions_segment()
    {
        const string encoded =
            "%2Fsubscriptions%2Fsub%2FresourceGroups%2Frg%2Fproviders%2FMicrosoft.Storage%2FstorageAccounts%2Fsa1";

        ArmResourceIdNormalizer.NormalizeIfArmId(encoded)
            .Should()
            .Be("/subscriptions/sub/resourcegroups/rg/providers/microsoft.storage/storageaccounts/sa1");
    }

    [Fact]
    public void NormalizeIfArmId_returns_trimmed_decoded_value_when_not_an_arm_id()
    {
        ArmResourceIdNormalizer.NormalizeIfArmId("  My%20App%20Registration  ")
            .Should()
            .Be("My App Registration");
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
