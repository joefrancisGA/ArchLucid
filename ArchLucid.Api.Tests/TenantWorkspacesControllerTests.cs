using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantWorkspacesControllerTests
{
    [Fact]
    public async Task ListRecycleBinAsync_exposes_retention_days_and_purge_after_utc()
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

        Guid workspaceId = scope.WorkspaceId;
        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset deletedUtc = new(2026, 8, 1, 12, 0, 0, TimeSpan.Zero);

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = workspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow()
            };

        ArchitectureProjectRecord deletedProject =
            new()
            {
                Id = projectId,
                TenantId = scope.TenantId,
                WorkspaceId = workspaceId,
                Name = "deleted",
                CreatedUtc = deletedUtc,
                DeletedUtc = deletedUtc
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();

        projectsMock
            .Setup(r => r.ListSoftDeletedByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ArchitectureProjectRecord> { deletedProject }.AsReadOnly());

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IAuditService> auditMock = new();

        Mock<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>> retentionMock = new();
        retentionMock.Setup(o => o.CurrentValue).Returns(new ArchitectureProjectRetentionPurgeOptions { RetentionDays = 30 });

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                scopeMock.Object,
                auditMock.Object,
                retentionMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };

        IActionResult result = await sut.ListRecycleBinAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantWorkspacesRecycleBinResponse body =
            ok.Value.Should().BeOfType<TenantWorkspacesRecycleBinResponse>().Subject;

        body.RetentionDays.Should().Be(30);
        body.Workspaces.Should().ContainSingle();
        TenantWorkspaceDeletedProjectApiDto row = body.Workspaces[0].DeletedProjects.Should().ContainSingle().Subject;
        row.PurgeAfterUtc.Should().Be(deletedUtc.AddDays(30));
    }

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

        Mock<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>> retentionMock = new();
        retentionMock.Setup(o => o.CurrentValue).Returns(new ArchitectureProjectRetentionPurgeOptions());

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                scopeMock.Object,
                auditMock.Object,
                retentionMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };

        IActionResult result =
            await sut.RestoreProjectAsync(scope.WorkspaceId, projectToRestore, CancellationToken.None);

        ObjectResult conflict = result.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        auditMock.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ListAsync_returns_only_current_workspace()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem callerWorkspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "caller",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        TenantWorkspaceListItem foreignWorkspace =
            new()
            {
                WorkspaceId = foreignWorkspaceId,
                TenantId = scope.TenantId,
                Name = "foreign",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { callerWorkspace, foreignWorkspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.ListActiveByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new List<ArchitectureProjectRecord>
                {
                    new()
                    {
                        Id = scope.ProjectId,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        Name = "caller-project",
                        CreatedUtc = TimeProvider.System.GetUtcNow(),
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TenantId = scope.TenantId,
                        WorkspaceId = foreignWorkspaceId,
                        Name = "foreign-project",
                        CreatedUtc = TimeProvider.System.GetUtcNow(),
                    },
                }.AsReadOnly());

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>> retentionMock = new();
        retentionMock.Setup(o => o.CurrentValue).Returns(new ArchitectureProjectRetentionPurgeOptions());

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                scopeMock.Object,
                Mock.Of<IAuditService>(),
                retentionMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result = await sut.ListAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantWorkspacesListResponse body = ok.Value.Should().BeOfType<TenantWorkspacesListResponse>().Subject;
        body.Workspaces.Should().ContainSingle();
        body.Workspaces[0].WorkspaceId.Should().Be(scope.WorkspaceId);
        body.Workspaces[0].Projects.Should().ContainSingle();
        body.Workspaces[0].Projects[0].ProjectId.Should().Be(scope.ProjectId);
    }

    [Fact]
    public async Task ListRecycleBinAsync_returns_only_current_workspace_deleted_projects()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid deletedProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset deletedUtc = new(2026, 8, 1, 12, 0, 0, TimeSpan.Zero);

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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem callerWorkspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "caller",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        TenantWorkspaceListItem foreignWorkspace =
            new()
            {
                WorkspaceId = foreignWorkspaceId,
                TenantId = scope.TenantId,
                Name = "foreign",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { callerWorkspace, foreignWorkspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.ListSoftDeletedByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new List<ArchitectureProjectRecord>
                {
                    new()
                    {
                        Id = deletedProjectId,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        Name = "deleted-caller",
                        CreatedUtc = deletedUtc,
                        DeletedUtc = deletedUtc,
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TenantId = scope.TenantId,
                        WorkspaceId = foreignWorkspaceId,
                        Name = "deleted-foreign",
                        CreatedUtc = deletedUtc,
                        DeletedUtc = deletedUtc,
                    },
                }.AsReadOnly());

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>> retentionMock = new();
        retentionMock.Setup(o => o.CurrentValue).Returns(new ArchitectureProjectRetentionPurgeOptions { RetentionDays = 30 });

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                scopeMock.Object,
                Mock.Of<IAuditService>(),
                retentionMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result = await sut.ListRecycleBinAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantWorkspacesRecycleBinResponse body =
            ok.Value.Should().BeOfType<TenantWorkspacesRecycleBinResponse>().Subject;

        body.Workspaces.Should().ContainSingle();
        body.Workspaces[0].WorkspaceId.Should().Be(scope.WorkspaceId);
        body.Workspaces[0].DeletedProjects.Should().ContainSingle();
        body.Workspaces[0].DeletedProjects[0].ProjectId.Should().Be(deletedProjectId);
    }

    [Fact]
    public async Task DeleteProjectAsync_returns_not_found_when_workspace_id_is_out_of_scope()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem callerWorkspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "caller",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        TenantWorkspaceListItem foreignWorkspace =
            new()
            {
                WorkspaceId = foreignWorkspaceId,
                TenantId = scope.TenantId,
                Name = "foreign",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { callerWorkspace, foreignWorkspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                scopeMock.Object,
                Mock.Of<IAuditService>(),
                Mock.Of<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>>())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result =
            await sut.DeleteProjectAsync(foreignWorkspaceId, projectId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RestoreProjectAsync_returns_not_found_when_workspace_id_is_out_of_scope()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem callerWorkspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "caller",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        TenantWorkspaceListItem foreignWorkspace =
            new()
            {
                WorkspaceId = foreignWorkspaceId,
                TenantId = scope.TenantId,
                Name = "foreign",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { callerWorkspace, foreignWorkspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                scopeMock.Object,
                Mock.Of<IAuditService>(),
                Mock.Of<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>>())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result =
            await sut.RestoreProjectAsync(foreignWorkspaceId, projectId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }
}
