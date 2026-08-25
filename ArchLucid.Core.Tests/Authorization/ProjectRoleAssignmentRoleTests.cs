using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Authorization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProjectRoleAssignmentRoleTests
{
    [Fact]
    public void ProjectRoleAssignmentRole_Constants_MatchPersistedLiterals()
    {
        ProjectRoleAssignmentRole.Reader.Should().Be("Reader");
        ProjectRoleAssignmentRole.Operator.Should().Be("Operator");
        ProjectRoleAssignmentRole.ProjectAdmin.Should().Be("ProjectAdmin");
    }

    [Theory]
    [InlineData(null, ProjectScopedEffectiveRole.None)]
    [InlineData("", ProjectScopedEffectiveRole.None)]
    [InlineData("   ", ProjectScopedEffectiveRole.None)]
    [InlineData("ProjectAdmin", ProjectScopedEffectiveRole.ProjectAdmin)]
    [InlineData("  projectadmin  ", ProjectScopedEffectiveRole.ProjectAdmin)]
    [InlineData("Operator", ProjectScopedEffectiveRole.Operator)]
    [InlineData("  OPERATOR ", ProjectScopedEffectiveRole.Operator)]
    [InlineData("Reader", ProjectScopedEffectiveRole.Reader)]
    [InlineData(" reader ", ProjectScopedEffectiveRole.Reader)]
    [InlineData("TenantAdmin", ProjectScopedEffectiveRole.None)]
    public void ProjectRoleAssignmentRole_ParseRank_MapsSqlLiteralToRank(
        string? sqlRole,
        ProjectScopedEffectiveRole expected)
    {
        ProjectRoleAssignmentRole.ParseRank(sqlRole!).Should().Be(expected);
    }
}
