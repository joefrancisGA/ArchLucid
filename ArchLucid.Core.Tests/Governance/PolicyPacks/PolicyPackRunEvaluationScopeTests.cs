using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
public sealed class PolicyPackRunEvaluationScopeTests
{
    [Fact]
    public void IsPackIncludedInRunEvaluation_returns_false_when_assignment_is_null_and_not_focused()
    {
        bool included = PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
            "FinOps & Cloud Cost Optimization",
            assignment: null,
            focusedPilotModeEnabled: false,
            CloudProvider.Azure);

        included.Should().BeFalse();
    }

    [Fact]
    public void IsPackIncludedInRunEvaluation_returns_assignment_enabled_state_when_not_focused()
    {
        PolicyPackAssignment assignment = new() { IsEnabled = true };

        PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
                "Custom Pack",
                assignment,
                focusedPilotModeEnabled: false,
                CloudProvider.Azure)
            .Should()
            .BeTrue();

        assignment.IsEnabled = false;

        PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
                "Custom Pack",
                assignment,
                focusedPilotModeEnabled: false,
                CloudProvider.Azure)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsPackIncludedInRunEvaluation_excludes_non_baseline_pack_in_focused_mode_without_org_required()
    {
        PolicyPackAssignment assignment = new() { IsEnabled = true, IsPinned = true };

        bool included = PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
            "SOC 2 TSC Architecture",
            assignment,
            focusedPilotModeEnabled: true,
            CloudProvider.Azure);

        included.Should().BeFalse();
    }

    [Fact]
    public void IsPackIncludedInRunEvaluation_includes_org_required_pack_in_focused_mode()
    {
        PolicyPackAssignment assignment = new() { IsEnabled = true, IsOrganizationRequired = true };

        bool included = PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
            "SOC 2 TSC Architecture",
            assignment,
            focusedPilotModeEnabled: true,
            CloudProvider.Azure);

        included.Should().BeTrue();
    }
}
