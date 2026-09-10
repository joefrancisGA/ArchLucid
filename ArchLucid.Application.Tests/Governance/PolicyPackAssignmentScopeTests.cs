using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackAssignmentScopeTests
{
    private static readonly ScopeContext ProjectCallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public void IsVisibleInScope_returns_true_for_tenant_scoped_assignment_from_project_caller()
    {
        PolicyPackAssignment assignment = new()
        {
            TenantId = ProjectCallerScope.TenantId,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
            ScopeLevel = GovernanceScopeLevel.Tenant,
        };

        PolicyPackAssignmentScope.IsVisibleInScope(assignment, ProjectCallerScope).Should().BeTrue();
    }

    [Fact]
    public void IsVisibleInScope_returns_true_for_workspace_scoped_assignment_from_project_caller()
    {
        PolicyPackAssignment assignment = new()
        {
            TenantId = ProjectCallerScope.TenantId,
            WorkspaceId = ProjectCallerScope.WorkspaceId,
            ProjectId = Guid.Empty,
            ScopeLevel = GovernanceScopeLevel.Workspace,
        };

        PolicyPackAssignmentScope.IsVisibleInScope(assignment, ProjectCallerScope).Should().BeTrue();
    }

    [Fact]
    public void IsVisibleInScope_returns_false_for_foreign_workspace_project_assignment()
    {
        PolicyPackAssignment assignment = new()
        {
            TenantId = ProjectCallerScope.TenantId,
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            ScopeLevel = GovernanceScopeLevel.Project,
        };

        PolicyPackAssignmentScope.IsVisibleInScope(assignment, ProjectCallerScope).Should().BeFalse();
    }
}
