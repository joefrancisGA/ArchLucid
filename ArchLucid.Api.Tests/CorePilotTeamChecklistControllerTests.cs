using System.Text.Json;

using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.Serialization;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePilotTeamChecklistControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static CorePilotTeamChecklistController BuildSut(
        ICorePilotTeamChecklistRepository repository,
        IScopeContextProvider scopeProvider,
        IActorContext actorContext,
        IAuditService auditService,
        ITenantRepository? tenantRepository = null)
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return new CorePilotTeamChecklistController(
            auditService,
            repository,
            scopeProvider,
            actorContext,
            tenantRepository ?? tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }

    [Fact]
    public async Task GetAsync_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<ICorePilotTeamChecklistRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });
        Mock<IActorContext> actor = new();
        Mock<IAuditService> audit = new();

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        CorePilotTeamChecklistController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            actor.Object,
            audit.Object,
            tenants.Object);

        IActionResult result = await sut.GetAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();
        Mock<IAuditService> audit = new();

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        CorePilotTeamChecklistController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            actor.Object,
            audit.Object,
            tenants.Object);

        IActionResult result = await sut.GetAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.Verify(
            r => r.ListAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetAsync_maps_rows_and_orders_by_merge_order_from_repository()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        repo.Setup(r => r.ListAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new CorePilotChecklistStepRow(1, true, DateTimeOffset.Parse("2026-05-02T12:00:00Z"), "actor-a")
            ]);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();
        Mock<IAuditService> audit = new();

        CorePilotTeamChecklistController sut = BuildSut(repo.Object, scopeProvider.Object, actor.Object, audit.Object);
        IActionResult result = await sut.GetAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        CorePilotChecklistStepResponse[] body = ok.Value.Should().BeAssignableTo<CorePilotChecklistStepResponse[]>().Subject;
        body.Should().HaveCount(1);
        body[0].StepIndex.Should().Be(1);
        body[0].IsCompleted.Should().BeTrue();
        body[0].UpdatedByUserId.Should().Be("actor-a");
    }

    [Theory]
    [InlineData("{\"stepIndex\":1}", "missing isCompleted is rejected during JSON deserialization")]
    [InlineData("{\"stepIndex\":1,\"isCompleted\":null}", "null isCompleted is rejected during JSON deserialization")]
    public void PutRequest_deserialization_rejects_missing_or_null_is_completed(string payload, string because)
    {
        Action act = () => JsonSerializer.Deserialize<CorePilotChecklistPutRequest>(payload, ArchLucidApiJsonSerializerOptions.Web);

        act.Should().Throw<JsonException>(because);
    }

    [Fact]
    public void PutRequest_deserialization_accepts_is_completed()
    {
        CorePilotChecklistPutRequest request =
            JsonSerializer.Deserialize<CorePilotChecklistPutRequest>(
                "{\"stepIndex\":2,\"isCompleted\":false}",
                ArchLucidApiJsonSerializerOptions.Web)!;

        request.StepIndex.Should().Be(2);
        request.IsCompleted.Should().BeFalse();
    }

    [Fact]
    public async Task PutAsync_null_body_returns_bad_request()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();
        Mock<IAuditService> audit = new();

        CorePilotTeamChecklistController sut = BuildSut(repo.Object, scopeProvider.Object, actor.Object, audit.Object);
        IActionResult result = await sut.PutAsync(null, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
        repo.Verify(
            r => r.UpsertAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>(),
                It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_invalid_step_returns_bad_request()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("me");
        Mock<IAuditService> audit = new();

        CorePilotTeamChecklistController sut = BuildSut(repo.Object, scopeProvider.Object, actor.Object, audit.Object);
        IActionResult result = await sut.PutAsync(new CorePilotChecklistPutRequest { StepIndex = 7, IsCompleted = true },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
        repo.Verify(
            r => r.UpsertAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>(),
                It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_step_index_invalid_and_tenant_missing()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();
        Mock<IAuditService> audit = new();

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);

        CorePilotTeamChecklistController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            actor.Object,
            audit.Object,
            tenants.Object);

        IActionResult result = await sut.PutAsync(
            new CorePilotChecklistPutRequest { StepIndex = 7, IsCompleted = true },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        repo.Verify(
            r => r.UpsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<ICorePilotTeamChecklistRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });
        Mock<IActorContext> actor = new();
        Mock<IAuditService> audit = new();

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        CorePilotTeamChecklistController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            actor.Object,
            audit.Object,
            tenants.Object);

        IActionResult result = await sut.PutAsync(
            new CorePilotChecklistPutRequest { StepIndex = 1, IsCompleted = true },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.VerifyNoOtherCalls();
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PutAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();
        Mock<IAuditService> audit = new();

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        CorePilotTeamChecklistController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            actor.Object,
            audit.Object,
            tenants.Object);

        IActionResult result = await sut.PutAsync(
            new CorePilotChecklistPutRequest { StepIndex = 1, IsCompleted = true },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.Verify(
            r => r.UpsertAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_valid_persists_and_no_content()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("op-1");
        Mock<IAuditService> audit = new();

        CorePilotTeamChecklistController sut = BuildSut(repo.Object, scopeProvider.Object, actor.Object, audit.Object);
        IActionResult result = await sut.PutAsync(new CorePilotChecklistPutRequest { StepIndex = 2, IsCompleted = false },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        repo.Verify(
            r => r.UpsertAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, 2, false, "op-1",
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.CorePilotTeamChecklistUpdated
                    && e.TenantId == Scope.TenantId
                    && e.DataJson.Contains("\"stepIndex\":2", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"isCompleted\":false", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
