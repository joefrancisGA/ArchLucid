using System.Security.Claims;

using ArchLucid.Api.Controllers.Alerts;
using ArchLucid.Application.Alerts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Alerts;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AlertsControllerArchiveTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Archive_logs_audit_and_returns_updated_alert()
    {
        Guid alertId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        AlertRecord existing = new()
        {
            AlertId = alertId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            RunId = runId,
            IsArchived = false,
        };

        AlertRecord archived = new()
        {
            AlertId = alertId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            RunId = runId,
            IsArchived = true,
        };

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAlertRecordRepository> records = new();
        records.SetupSequence(r => r.GetByIdAsync(alertId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing)
            .ReturnsAsync(archived);

        records.Setup(r => r.ArchiveAsync(alertId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAlertService> alertService = new();
        Mock<IAlertActionLoopReader> reader = new();

        Mock<IAuditService> audit = new();

        DefaultHttpContext http = new();
        http.User = new ClaimsPrincipal(
            new ClaimsIdentity(
                [new Claim(ClaimTypes.NameIdentifier, "user-1"), new Claim(ClaimTypes.Name, "Tester")],
                "Test"));

        AlertsController sut = new(
            scope.Object,
            records.Object,
            alertService.Object,
            reader.Object,
            audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = http },
        };

        IActionResult result = await sut.Archive(alertId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        AlertRecord body = ok.Value.Should().BeAssignableTo<AlertRecord>().Subject;
        body.IsArchived.Should().BeTrue();

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.AlertArchived &&
                    e.RunId == runId &&
                    e.ActorUserId == "user-1" &&
                    e.ActorUserName == "Tester" &&
                    e.DataJson!.Contains(alertId.ToString(), StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Archive_when_already_archived_does_not_log_audit()
    {
        Guid alertId = Guid.NewGuid();

        AlertRecord existing = new()
        {
            AlertId = alertId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            IsArchived = true,
        };

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAlertRecordRepository> records = new();
        records.Setup(r => r.GetByIdAsync(alertId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        Mock<IAlertService> alertService = new();
        Mock<IAlertActionLoopReader> reader = new();
        Mock<IAuditService> audit = new();

        AlertsController sut = new(
            scope.Object,
            records.Object,
            alertService.Object,
            reader.Object,
            audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        await sut.Archive(alertId, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
