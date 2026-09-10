using ArchLucid.Application.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

/// <summary>AS-090: View / Decide / Admin intersect workspace authority on restricted architectures.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureShareAccessEvaluatorTests
{
    [Fact]
    public void Grandfather_workspace_visible_execute_authority_allows_decide_without_share()
    {
        ArchitectureShareAccessEvaluation evaluation = ArchitectureShareAccessEvaluator.Evaluate(
            restrictToShares: false,
            shareRole: null,
            hasReadAuthority: true,
            hasExecuteAuthority: true,
            hasWorkspaceAdminAuthority: false);

        evaluation.CanRead.Should().BeTrue();
        evaluation.CanDecide.Should().BeTrue();
    }

    [Fact]
    public void Restricted_decide_share_without_execute_authority_cannot_dispose()
    {
        ArchitectureShareAccessEvaluation evaluation = ArchitectureShareAccessEvaluator.Evaluate(
            restrictToShares: true,
            shareRole: ArchitectureShareRoles.Decide,
            hasReadAuthority: true,
            hasExecuteAuthority: false,
            hasWorkspaceAdminAuthority: false);

        evaluation.CanRead.Should().BeTrue();
        evaluation.CanDecide.Should().BeFalse("Decide share without ExecuteAuthority still cannot dispose (AS-090)");
    }

    [Fact]
    public void Restricted_execute_authority_without_share_cannot_dispose()
    {
        ArchitectureShareAccessEvaluation evaluation = ArchitectureShareAccessEvaluator.Evaluate(
            restrictToShares: true,
            shareRole: null,
            hasReadAuthority: true,
            hasExecuteAuthority: true,
            hasWorkspaceAdminAuthority: false);

        evaluation.CanRead.Should().BeFalse();
        evaluation.CanDecide.Should().BeFalse("ExecuteAuthority without share on a restricted architecture cannot dispose (AS-090)");
    }

    [Fact]
    public void Restricted_decide_share_with_execute_authority_allows_decide()
    {
        ArchitectureShareAccessEvaluation evaluation = ArchitectureShareAccessEvaluator.Evaluate(
            restrictToShares: true,
            shareRole: ArchitectureShareRoles.Decide,
            hasReadAuthority: true,
            hasExecuteAuthority: true,
            hasWorkspaceAdminAuthority: false);

        evaluation.CanDecide.Should().BeTrue();
    }

    [Fact]
    public void Restricted_view_share_allows_read_but_not_decide_even_with_execute_authority()
    {
        ArchitectureShareAccessEvaluation evaluation = ArchitectureShareAccessEvaluator.Evaluate(
            restrictToShares: true,
            shareRole: ArchitectureShareRoles.View,
            hasReadAuthority: true,
            hasExecuteAuthority: true,
            hasWorkspaceAdminAuthority: false);

        evaluation.CanRead.Should().BeTrue();
        evaluation.CanDecide.Should().BeFalse();
        evaluation.CanAdmin.Should().BeFalse();
    }

    [Fact]
    public void Restricted_admin_share_allows_share_management()
    {
        ArchitectureShareAccessEvaluation evaluation = ArchitectureShareAccessEvaluator.Evaluate(
            restrictToShares: true,
            shareRole: ArchitectureShareRoles.Admin,
            hasReadAuthority: true,
            hasExecuteAuthority: true,
            hasWorkspaceAdminAuthority: false);

        evaluation.CanAdmin.Should().BeTrue();
        evaluation.CanDecide.Should().BeTrue();
    }

    [Fact]
    public void Restricted_workspace_admin_bypass_still_requires_execute_for_decide()
    {
        ArchitectureShareAccessEvaluation evaluation = ArchitectureShareAccessEvaluator.Evaluate(
            restrictToShares: true,
            shareRole: null,
            hasReadAuthority: true,
            hasExecuteAuthority: false,
            hasWorkspaceAdminAuthority: true);

        evaluation.CanAdmin.Should().BeTrue();
        evaluation.CanDecide.Should().BeFalse();
    }
}
