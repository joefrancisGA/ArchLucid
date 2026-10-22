using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureShareAccessEvaluatorTests
{
    [Fact]
    public void CanView_unrestricted_architecture_returns_true_without_share()
    {
        ArchitectureIdentityRecord architecture = new() { RestrictToShares = false };

        ArchitectureShareAccessEvaluator.CanView(architecture, shareForActor: null).Should().BeTrue();
    }

    [Fact]
    public void CanView_restricted_architecture_requires_share_row()
    {
        ArchitectureIdentityRecord architecture = new() { RestrictToShares = true };

        ArchitectureShareAccessEvaluator.CanView(architecture, shareForActor: null).Should().BeFalse();

        ArchitectureShareRecord share = new() { Role = ArchitectureShareRoles.View };

        ArchitectureShareAccessEvaluator.CanView(architecture, share).Should().BeTrue();
    }

    [Fact]
    public void CanAdmin_unrestricted_architecture_returns_true_without_share()
    {
        ArchitectureIdentityRecord architecture = new() { RestrictToShares = false };

        ArchitectureShareAccessEvaluator.CanAdmin(architecture, shareForActor: null).Should().BeTrue();
    }

    [Fact]
    public void CanAdmin_restricted_architecture_requires_admin_share()
    {
        ArchitectureIdentityRecord architecture = new() { RestrictToShares = true };

        ArchitectureShareAccessEvaluator.CanAdmin(
            architecture,
            new ArchitectureShareRecord { Role = ArchitectureShareRoles.View }).Should().BeFalse();

        ArchitectureShareAccessEvaluator.CanAdmin(
            architecture,
            new ArchitectureShareRecord { Role = ArchitectureShareRoles.Admin }).Should().BeTrue();
    }

    [Fact]
    public void CanDecide_requires_execute_authority_and_decide_or_admin_share_when_restricted()
    {
        ArchitectureIdentityRecord architecture = new() { RestrictToShares = true };
        ArchitectureShareRecord viewShare = new() { Role = ArchitectureShareRoles.View };
        ArchitectureShareRecord decideShare = new() { Role = ArchitectureShareRoles.Decide };

        ArchitectureShareAccessEvaluator.CanDecide(architecture, viewShare, hasExecuteAuthority: true).Should().BeFalse();
        ArchitectureShareAccessEvaluator.CanDecide(architecture, decideShare, hasExecuteAuthority: false).Should().BeFalse();
        ArchitectureShareAccessEvaluator.CanDecide(architecture, decideShare, hasExecuteAuthority: true).Should().BeTrue();
    }
}
