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
}
