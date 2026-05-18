using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantWorkspacesControllerTests
{
    [Fact]
    public async Task RestoreProjectAsync_returns_conflict_when_workspace_name_is_taken_by_active_project()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
        };

        TenantRecord tenant =
            new()
            {
                Id = scope.TenantId,
                Name = "t",
                Slug = "t",
                Tier = TenantTier.Free,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
                TrialRunsUsed = 0,
                TrialSeatsUsed = 0,
                TrialStatus = "None"
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow()
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Guid projectToRestore = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IArchitectureProjectRepository> projectsMock = new();

        projectsMock
            .Setup(
                r => r.TryRestoreAsync(scope.TenantId, scope.WorkspaceId, projectToRestore, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureProjectRestoreResult.ActiveProjectNameCollision);

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IAuditService> auditMock = new();

        TenantWorkspacesController sut =
            new(tenantsMock.Object, projectsMock.Object, scopeMock.Object, auditMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };

        IActionResult result =
            await sut.RestoreProjectAsync(scope.WorkspaceId, projectToRestore, CancellationToken.None);

        ObjectResult conflict = result.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        auditMock.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
