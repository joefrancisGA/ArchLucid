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

    [Fact]
    public void TryDecodePercentEncoded_decodes_percent_encoded_arm_id()
    {
        const string encoded =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm%2D1";

        bool succeeded = ArmResourceIdNormalizer.TryDecodePercentEncoded(encoded, out string decoded);

        succeeded.Should().BeTrue();
        decoded.Should().Be(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1");
    }

    [Fact]
    public void TryDecodePercentEncoded_returns_input_when_no_percent_sign()
    {
        const string plain =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        bool succeeded = ArmResourceIdNormalizer.TryDecodePercentEncoded(plain, out string decoded);

        succeeded.Should().BeTrue();
        decoded.Should().Be(plain);
    }

    [Fact]
    public void TryDecodePercentEncoded_fails_when_malformed_percent_sequences_remain()
    {
        // Uri.UnescapeDataString is lenient: invalid escapes like %ZZ and bare % pass through unchanged.
        // A residual '%' after decoding means the value is malformed, so the helper reports failure.
        const string malformed = "50%ZZ";

        bool succeeded = ArmResourceIdNormalizer.TryDecodePercentEncoded(malformed, out string decoded);

        succeeded.Should().BeFalse();
        decoded.Should().Be(malformed);
    }

    [Fact]
    public void TryDecodePercentEncoded_handles_null_and_whitespace()
    {
        ArmResourceIdNormalizer.TryDecodePercentEncoded(null, out string nullDecoded)
            .Should().BeTrue();
        nullDecoded.Should().BeEmpty();

        ArmResourceIdNormalizer.TryDecodePercentEncoded("   ", out string whitespaceDecoded)
            .Should().BeTrue();
        whitespaceDecoded.Should().BeEmpty();
    }

    [Fact]
    public void NormalizePercentDecoded_decodes_then_normalizes_percent_encoded_arm_id()
    {
        const string encoded =
            "/subscriptions/Sub/resourceGroups/RG/providers/Microsoft.Sql/servers/sql1%2Fdatabases%2Fappdb";

        ArmResourceIdNormalizer.NormalizePercentDecoded(encoded).Should().Be(
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql1/databases/appdb");
    }

    [Fact]
    public void NormalizePercentDecoded_normalizes_plain_arm_id_without_decoding()
    {
        const string plain =
            "/subscriptions/Sub/resourceGroups/RG/providers/Microsoft.Sql/servers/sql1/";

        ArmResourceIdNormalizer.NormalizePercentDecoded(plain).Should().Be(
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql1");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("50%")]
    [InlineData("%2Fsubscriptions%2Fsub%ZZ")]
    public void NormalizePercentDecoded_returns_empty_for_blank_or_malformed_input(string? input)
    {
        ArmResourceIdNormalizer.NormalizePercentDecoded(input).Should().BeEmpty();
    }
}
