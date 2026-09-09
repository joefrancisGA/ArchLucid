using ArchLucid.Decisioning.Analysis;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class IdentityBlastRadiusRoleNamesTests
{
    [Fact]
    public void IsWriteAdminRole_does_not_match_non_contributor_deny_list_role()
    {
        IdentityBlastRadiusRoleNames.IsWriteAdminRole("Non-Contributor Access Reviewer")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsWriteAdminRole_does_not_match_non_owner_deny_list_role()
    {
        IdentityBlastRadiusRoleNames.IsWriteAdminRole("Non-Owner Audit Reader")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsWriteAdminRole_still_matches_contributor_assignment()
    {
        IdentityBlastRadiusRoleNames.IsWriteAdminRole("Contributor")
            .Should()
            .BeTrue();
    }
}
