using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
public sealed class PolicyPackAssignmentOrganizationRequiredTests
{
    [Fact]
    public void IsOrganizationRequired_returns_false_when_assignment_is_null()
    {
        PolicyPackAssignmentOrganizationRequired.IsOrganizationRequired(null).Should().BeFalse();
    }

    [Fact]
    public void IsOrganizationRequired_returns_true_when_IsOrganizationRequired_is_set()
    {
        PolicyPackAssignment assignment = new() { IsOrganizationRequired = true, IsPinned = false };

        PolicyPackAssignmentOrganizationRequired.IsOrganizationRequired(assignment).Should().BeTrue();
    }

    [Fact]
    public void IsOrganizationRequired_returns_true_when_legacy_IsPinned_is_set()
    {
        PolicyPackAssignment assignment = new() { IsOrganizationRequired = false, IsPinned = true };

        PolicyPackAssignmentOrganizationRequired.IsOrganizationRequired(assignment).Should().BeTrue();
    }
}
