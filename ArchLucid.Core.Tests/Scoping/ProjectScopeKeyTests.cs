using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Scoping;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProjectScopeKeyTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public void Create_preserves_all_authority_dimensions()
    {
        ProjectScopeKey key = ProjectScopeKey.Create(TenantId, WorkspaceId, ProjectId);

        key.TenantId.Should().Be(TenantId);
        key.WorkspaceId.Should().Be(WorkspaceId);
        key.ProjectId.Should().Be(ProjectId);
        key.Matches(TenantId, WorkspaceId, ProjectId).Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public void Create_rejects_empty_authority_dimension(int emptyDimension)
    {
        Guid tenantId = emptyDimension == 0 ? Guid.Empty : TenantId;
        Guid workspaceId = emptyDimension == 1 ? Guid.Empty : WorkspaceId;
        Guid projectId = emptyDimension == 2 ? Guid.Empty : ProjectId;

        Action act = () => ProjectScopeKey.Create(tenantId, workspaceId, projectId);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void From_scope_context_validates_and_projects_scope()
    {
        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        ProjectScopeKey key = scope.ToProjectScopeKey();

        key.Should().Be(ProjectScopeKey.Create(TenantId, WorkspaceId, ProjectId));
    }

    [Fact]
    public void Matches_requires_all_three_dimensions()
    {
        ProjectScopeKey key = ProjectScopeKey.Create(TenantId, WorkspaceId, ProjectId);

        key.Matches(TenantId, Guid.NewGuid(), ProjectId).Should().BeFalse();
        key.Matches(TenantId, WorkspaceId, Guid.NewGuid()).Should().BeFalse();
        key.Matches(Guid.NewGuid(), WorkspaceId, ProjectId).Should().BeFalse();
    }
}
