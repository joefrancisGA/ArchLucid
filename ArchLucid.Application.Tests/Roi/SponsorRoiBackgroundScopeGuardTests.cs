using ArchLucid.Application.Roi;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorRoiBackgroundScopeGuardTests
{
    [Fact]
    public void TryValidate_accepts_explicit_tenant_workspace_project()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        SponsorRoiBackgroundScopeGuard.TryValidate(scope, out string reason).Should().BeTrue();
        reason.Should().BeEmpty();
    }

    [Fact]
    public void TryValidate_rejects_dev_default_scope_triple()
    {
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
        };

        SponsorRoiBackgroundScopeGuard.TryValidate(scope, out string reason).Should().BeFalse();
        reason.Should().Be("dev_default_scope_triple");
    }

    [Theory]
    [InlineData("tenant_id_empty", "00000000-0000-0000-0000-000000000000", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "cccccccc-cccc-cccc-cccc-cccccccccccc")]
    [InlineData("workspace_id_empty", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "00000000-0000-0000-0000-000000000000", "cccccccc-cccc-cccc-cccc-cccccccccccc")]
    [InlineData("project_id_empty", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "00000000-0000-0000-0000-000000000000")]
    public void TryValidate_rejects_empty_scope_dimensions(string expectedReason, string tenantId, string workspaceId, string projectId)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse(tenantId),
            WorkspaceId = Guid.Parse(workspaceId),
            ProjectId = Guid.Parse(projectId),
        };

        SponsorRoiBackgroundScopeGuard.TryValidate(scope, out string reason).Should().BeFalse();
        reason.Should().Be(expectedReason);
    }
}
