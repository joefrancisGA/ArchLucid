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
    public async Task ListRecycleBinAsync_omits_projects_without_deleted_utc_to_avoid_false_purge_schedule()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        TenantRecord tenant = new()
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

        TenantWorkspaceListItem workspace = new()
        {
            WorkspaceId = scope.WorkspaceId,
            TenantId = scope.TenantId,
            Name = "w",
            DefaultProjectId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.GetUtcNow(),
        };

        DateTimeOffset createdUtc = new(2020, 1, 15, 0, 0, 0, TimeSpan.Zero);

        ArchitectureProjectRecord orphanDeletedProject = new()
        {
            Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            Name = "orphan-deleted",
            CreatedUtc = createdUtc,
            DeletedUtc = null,
        };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.ListSoftDeletedByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ArchitectureProjectRecord> { orphanDeletedProject }.AsReadOnly());

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>> retentionMock = new();
        retentionMock.Setup(o => o.CurrentValue).Returns(new ArchitectureProjectRetentionPurgeOptions { RetentionDays = 30 });

        TenantWorkspacesController sut = new(
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
        body.Workspaces[0].DeletedProjects.Should().BeEmpty();
    }

    [Fact]
    public async Task RestoreProjectAsync_returns_not_found_when_soft_deleted_row_lacks_deleted_utc()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.ListSoftDeletedByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new List<ArchitectureProjectRecord>
                {
                    new()
                    {
                        Id = scope.ProjectId,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        Name = "orphan-soft-delete",
                        CreatedUtc = TimeProvider.System.GetUtcNow(),
                        DeletedUtc = null,
                    },
                }.AsReadOnly());
        projectsMock
            .Setup(r => r.TryRestoreAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureProjectRestoreResult.Restored);

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
            await sut.RestoreProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.Verify(
            r => r.TryRestoreAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                It.IsAny<CancellationToken>()),
            Times.Never);
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

        Guid projectToRestore = scope.ProjectId;

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
    public async Task RestoreProjectAsync_returns_no_content_without_duplicate_audit_when_already_restored_retry()
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

        Guid projectToRestore = scope.ProjectId;

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .SetupSequence(
                r => r.TryRestoreAsync(scope.TenantId, scope.WorkspaceId, projectToRestore, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureProjectRestoreResult.Restored)
            .ReturnsAsync(ArchitectureProjectRestoreResult.AlreadyActive);

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IAuditService> auditMock = new();
        auditMock
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

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

        IActionResult first =
            await sut.RestoreProjectAsync(scope.WorkspaceId, projectToRestore, CancellationToken.None);
        IActionResult second =
            await sut.RestoreProjectAsync(scope.WorkspaceId, projectToRestore, CancellationToken.None);

        first.Should().BeOfType<NoContentResult>();
        second.Should().BeOfType<NoContentResult>();
        auditMock.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ArchitectureProjectRestored),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteProjectAsync_returns_no_content_without_duplicate_audit_when_already_deleted_retry()
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

        Guid projectToDelete = scope.ProjectId;

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .SetupSequence(
                r => r.TrySoftDeleteAsync(scope.TenantId, scope.WorkspaceId, projectToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureProjectSoftDeleteResult.Deleted)
            .ReturnsAsync(ArchitectureProjectSoftDeleteResult.AlreadyDeleted);

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IAuditService> auditMock = new();
        auditMock
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

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

        IActionResult first =
            await sut.DeleteProjectAsync(scope.WorkspaceId, projectToDelete, CancellationToken.None);
        IActionResult second =
            await sut.DeleteProjectAsync(scope.WorkspaceId, projectToDelete, CancellationToken.None);

        first.Should().BeOfType<NoContentResult>();
        second.Should().BeOfType<NoContentResult>();
        auditMock.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ArchitectureProjectSoftDeleted),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
    public async Task DeleteProjectAsync_returns_bad_request_when_workspace_id_is_empty()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

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

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

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
            await sut.DeleteProjectAsync(Guid.Empty, projectId, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RestoreProjectAsync_returns_bad_request_when_project_id_is_empty()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

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
            await sut.RestoreProjectAsync(scope.WorkspaceId, Guid.Empty, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DeleteProjectAsync_returns_bad_request_when_workspace_id_is_empty_and_tenant_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<ITenantRepository> tenantsMock = new(MockBehavior.Strict);
        tenantsMock
            .Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

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
            await sut.DeleteProjectAsync(Guid.Empty, projectId, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        projectsMock.VerifyNoOtherCalls();
        tenantsMock.Verify(
            t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RestoreProjectAsync_returns_bad_request_when_project_id_is_empty_and_tenant_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<ITenantRepository> tenantsMock = new(MockBehavior.Strict);
        tenantsMock
            .Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

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
            await sut.RestoreProjectAsync(scope.WorkspaceId, Guid.Empty, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        projectsMock.VerifyNoOtherCalls();
        tenantsMock.Verify(
            t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteProjectAsync_returns_not_found_when_project_id_is_sibling_in_same_workspace()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid siblingProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

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

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { callerWorkspace }.AsReadOnly());

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
            await sut.DeleteProjectAsync(scope.WorkspaceId, siblingProjectId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RestoreProjectAsync_returns_not_found_when_project_id_is_sibling_in_same_workspace()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid siblingProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

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

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { callerWorkspace }.AsReadOnly());

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
            await sut.RestoreProjectAsync(scope.WorkspaceId, siblingProjectId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
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

    [Fact]
    public async Task DeleteProjectAsync_returns_bad_request_when_project_id_is_empty()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

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
            await sut.DeleteProjectAsync(scope.WorkspaceId, Guid.Empty, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DeleteProjectAsync_returns_bad_request_when_deleting_workspace_default_project()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new(MockBehavior.Strict);
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
                        Name = "default",
                        CreatedUtc = TimeProvider.System.GetUtcNow(),
                    },
                }.AsReadOnly());

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
            await sut.DeleteProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        projectsMock.Verify(
            r => r.ListActiveByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Once);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DeleteProjectAsync_returns_no_content_when_default_project_is_already_soft_deleted_retry()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(
                r => r.ListActiveByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchitectureProjectRecord>());
        projectsMock
            .Setup(
                r => r.TrySoftDeleteAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureProjectSoftDeleteResult.AlreadyDeleted);

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
            await sut.DeleteProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task ListRecycleBinAsync_clamps_retention_days_from_configuration()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.ListSoftDeletedByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchitectureProjectRecord>());

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>> retentionMock = new();
        retentionMock.Setup(o => o.CurrentValue).Returns(new ArchitectureProjectRetentionPurgeOptions { RetentionDays = 0 });

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

        body.RetentionDays.Should().Be(1);
    }

    [Fact]
    public async Task ListRecycleBinAsync_returns_not_found_when_scope_workspace_id_is_empty()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                TenantId = scope.TenantId,
                Name = "ws",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

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

        IActionResult result = await sut.ListRecycleBinAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListAsync_returns_not_found_when_scope_workspace_id_is_empty()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                TenantId = scope.TenantId,
                Name = "ws",
                DefaultProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

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

        IActionResult result = await sut.ListAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListAsync_returns_not_found_when_scope_workspace_missing_from_tenant_list()
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
            .ReturnsAsync(new List<TenantWorkspaceListItem> { foreignWorkspace }.AsReadOnly());

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

        IActionResult result = await sut.ListAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListRecycleBinAsync_returns_not_found_when_scope_workspace_missing_from_tenant_list()
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
            .ReturnsAsync(new List<TenantWorkspaceListItem> { foreignWorkspace }.AsReadOnly());

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

        IActionResult result = await sut.ListRecycleBinAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListAsync_clamps_retention_days_from_configuration()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.ListActiveByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchitectureProjectRecord>());

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>> retentionMock = new();
        retentionMock.Setup(o => o.CurrentValue).Returns(new ArchitectureProjectRetentionPurgeOptions { RetentionDays = 0 });

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
        body.RetentionDays.Should().Be(1);
    }

    [Fact]
    public async Task RestoreProjectAsync_returns_bad_request_when_workspace_id_is_empty()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

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

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

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
            await sut.RestoreProjectAsync(Guid.Empty, projectId, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListAsync_returns_not_found_when_tenant_row_is_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock
            .Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IArchitectureProjectRepository> projectsMock = new(MockBehavior.Strict);

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                Mock.Of<IScopeContextProvider>(s => s.GetCurrentScope() == scope),
                Mock.Of<IAuditService>(),
                Mock.Of<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>>())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result = await sut.ListAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
        tenantsMock.Verify(
            t => t.ListWorkspacesAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ListRecycleBinAsync_returns_not_found_when_tenant_row_is_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock
            .Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IArchitectureProjectRepository> projectsMock = new(MockBehavior.Strict);

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                Mock.Of<IScopeContextProvider>(s => s.GetCurrentScope() == scope),
                Mock.Of<IAuditService>(),
                Mock.Of<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>>())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result = await sut.ListRecycleBinAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DeleteProjectAsync_returns_not_found_when_tenant_row_is_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock
            .Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IArchitectureProjectRepository> projectsMock = new(MockBehavior.Strict);

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                Mock.Of<IScopeContextProvider>(s => s.GetCurrentScope() == scope),
                Mock.Of<IAuditService>(),
                Mock.Of<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>>())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result =
            await sut.DeleteProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RestoreProjectAsync_returns_not_found_when_tenant_row_is_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock
            .Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IArchitectureProjectRepository> projectsMock = new(MockBehavior.Strict);

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                Mock.Of<IScopeContextProvider>(s => s.GetCurrentScope() == scope),
                Mock.Of<IAuditService>(),
                Mock.Of<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>>())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result =
            await sut.RestoreProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListAsync_omits_stale_default_project_id_when_default_is_not_an_active_project()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid staleDefaultProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

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

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = staleDefaultProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

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
                        Name = "active-project",
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
        body.Workspaces[0].DefaultProjectId.Should().Be(Guid.Empty);
        body.Workspaces[0].Projects.Should().ContainSingle().Which.ProjectId.Should().Be(scope.ProjectId);
    }

    [Fact]
    public async Task ListAsync_clamps_retention_days_to_maximum_when_configuration_exceeds_schedule_max()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

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
                        Name = "p",
                        CreatedUtc = TimeProvider.System.GetUtcNow(),
                    },
                }.AsReadOnly());

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>> retentionMock = new();
        retentionMock.Setup(o => o.CurrentValue).Returns(new ArchitectureProjectRetentionPurgeOptions { RetentionDays = 500 });

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
        body.RetentionDays.Should().Be(365);
    }

    [Fact]
    public async Task ListRecycleBinAsync_clamps_retention_days_and_purge_schedule_when_configuration_exceeds_schedule_max()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        DateTimeOffset deletedUtc = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);
        Guid deletedProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

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

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

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
                        Name = "deleted",
                        CreatedUtc = deletedUtc,
                        DeletedUtc = deletedUtc,
                    },
                }.AsReadOnly());

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>> retentionMock = new();
        retentionMock.Setup(o => o.CurrentValue).Returns(new ArchitectureProjectRetentionPurgeOptions { RetentionDays = 500 });

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
        body.RetentionDays.Should().Be(365);
        body.Workspaces[0].DeletedProjects[0].PurgeAfterUtc
            .Should()
            .Be(ArchitectureProjectRetentionSchedule.ComputePurgeAfterUtc(deletedUtc, 500));
    }

    [Fact]
    public async Task ListRecycleBinAsync_omits_purge_schedule_when_deleted_project_is_workspace_default_metadata()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        DateTimeOffset deletedUtc = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

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

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.ListSoftDeletedByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new List<ArchitectureProjectRecord>
                {
                    new()
                    {
                        Id = scope.ProjectId,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        Name = "default-deleted",
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
        TenantWorkspaceDeletedProjectApiDto row = body.Workspaces[0].DeletedProjects.Should().ContainSingle().Subject;
        row.ProjectId.Should().Be(scope.ProjectId);
        row.PurgeAfterUtc.Should().BeNull();
    }

    [Fact]
    public async Task DeleteProjectAsync_allows_delete_when_workspace_default_metadata_points_at_active_project_in_another_workspace()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid foreignDefaultProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

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

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = foreignDefaultProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.TrySoftDeleteAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureProjectSoftDeleteResult.Deleted);

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IAuditService> auditMock = new();
        auditMock
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                scopeMock.Object,
                auditMock.Object,
                Mock.Of<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>>())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result =
            await sut.DeleteProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        projectsMock.Verify(
            r => r.ListActiveByTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteProjectAsync_returns_bad_request_when_another_workspace_pins_project_as_default_metadata()
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

        TenantWorkspaceListItem currentWorkspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "current",
                DefaultProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        TenantWorkspaceListItem foreignWorkspace =
            new()
            {
                WorkspaceId = foreignWorkspaceId,
                TenantId = scope.TenantId,
                Name = "foreign",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { currentWorkspace, foreignWorkspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new(MockBehavior.Strict);
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
                        Name = "pinned-elsewhere",
                        CreatedUtc = TimeProvider.System.GetUtcNow(),
                    },
                }.AsReadOnly());

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
            await sut.DeleteProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        projectsMock.Verify(
            r => r.ListActiveByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Once);
        projectsMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListRecycleBinAsync_omits_purge_schedule_when_another_workspace_still_pins_default_metadata()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid pinnedDeletedProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTimeOffset deletedUtc = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

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

        TenantWorkspaceListItem currentWorkspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "current",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        TenantWorkspaceListItem foreignWorkspace =
            new()
            {
                WorkspaceId = foreignWorkspaceId,
                TenantId = scope.TenantId,
                Name = "foreign",
                DefaultProjectId = pinnedDeletedProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { currentWorkspace, foreignWorkspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.ListSoftDeletedByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new List<ArchitectureProjectRecord>
                {
                    new()
                    {
                        Id = pinnedDeletedProjectId,
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        Name = "pinned-elsewhere",
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
        TenantWorkspaceDeletedProjectApiDto row = body.Workspaces[0].DeletedProjects.Should().ContainSingle().Subject;
        row.ProjectId.Should().Be(pinnedDeletedProjectId);
        row.PurgeAfterUtc.Should().BeNull();
    }

    [Fact]
    public async Task RestoreProjectAsync_returns_no_content_when_workspace_default_metadata_still_points_at_soft_deleted_project()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
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
                TrialStatus = "None",
            };

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.TryRestoreAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureProjectRestoreResult.Restored);

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IAuditService> auditMock = new();
        auditMock
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                scopeMock.Object,
                auditMock.Object,
                Mock.Of<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>>())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result =
            await sut.RestoreProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        auditMock.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ArchitectureProjectRestored),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ListAsync_omits_default_project_id_when_metadata_points_at_active_project_in_another_workspace()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid foreignDefaultProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

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

        TenantWorkspaceListItem workspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "w",
                DefaultProjectId = foreignDefaultProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { workspace }.AsReadOnly());

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
        TenantWorkspacesListResponse body =
            ok.Value.Should().BeOfType<TenantWorkspacesListResponse>().Subject;
        body.Workspaces.Should().ContainSingle();
        body.Workspaces[0].DefaultProjectId.Should().Be(Guid.Empty);
        body.Workspaces[0].Projects.Should().ContainSingle().Which.ProjectId.Should().Be(scope.ProjectId);
    }

    [Fact]
    public async Task RestoreProjectAsync_returns_no_content_when_sibling_workspace_pins_project_as_default_metadata()
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

        TenantWorkspaceListItem currentWorkspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "current",
                DefaultProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        TenantWorkspaceListItem foreignWorkspace =
            new()
            {
                WorkspaceId = foreignWorkspaceId,
                TenantId = scope.TenantId,
                Name = "foreign",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { currentWorkspace, foreignWorkspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.TryRestoreAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureProjectRestoreResult.Restored);

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IAuditService> auditMock = new();
        auditMock
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantWorkspacesController sut =
            new(
                tenantsMock.Object,
                projectsMock.Object,
                scopeMock.Object,
                auditMock.Object,
                Mock.Of<IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>>())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };

        IActionResult result =
            await sut.RestoreProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteProjectAsync_returns_no_content_when_sibling_pins_soft_deleted_project_on_delete_retry()
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

        TenantWorkspaceListItem currentWorkspace =
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                TenantId = scope.TenantId,
                Name = "current",
                DefaultProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        TenantWorkspaceListItem foreignWorkspace =
            new()
            {
                WorkspaceId = foreignWorkspaceId,
                TenantId = scope.TenantId,
                Name = "foreign",
                DefaultProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
            };

        Mock<ITenantRepository> tenantsMock = new();
        tenantsMock.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenantsMock
            .Setup(t => t.ListWorkspacesAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TenantWorkspaceListItem> { currentWorkspace, foreignWorkspace }.AsReadOnly());

        Mock<IArchitectureProjectRepository> projectsMock = new();
        projectsMock
            .Setup(r => r.ListActiveByTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchitectureProjectRecord>());
        projectsMock
            .Setup(r => r.TrySoftDeleteAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureProjectSoftDeleteResult.AlreadyDeleted);

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
            await sut.DeleteProjectAsync(scope.WorkspaceId, scope.ProjectId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }
}
