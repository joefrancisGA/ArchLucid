using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DeclarationInventoryContradictionThreeWayGateTests
{
    [Fact]
    public void DeclarationClaimsSecureControl_returns_true_when_declaration_disables_public_access()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.public_network_access",
            "Disabled",
            "Enabled",
            "Azure",
            "data-protection");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void DeclarationClaimsSecureControl_returns_false_when_declaration_enables_public_access()
    {
        DeclarationInventoryContradictionMismatch mismatch = new(
            "node-1",
            "storage",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st",
            "tf.public_network_access",
            "Enabled",
            "Disabled",
            "Azure",
            "data-protection");

        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeFalse();
    }
}
