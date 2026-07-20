using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ArchitectureQuickScanControllerAuditTests
{
    [Fact]
    public async Task PostQuickScanAsync_DelegatesToExecutionOrchestrator()
    {
        ArchitectureQuickScanResponse body = new()
        {
            ScanId = "scan-controller-1",
            SystemName = "PaymentApi",
            PrimaryEnvironment = "Azure",
            Summary = "ok",
            CompletedUtc = DateTime.UtcNow,
        };

        Mock<IQuickScanExecutionOrchestrator> orchestrator = new();
        orchestrator
            .Setup(o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.IsAny<QuickScanExecutionRequestContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanExecutionResult.Success(body));

        Mock<IQuickScanGuard> guard = new();
        guard.Setup(g => g.GetStatus(It.IsAny<QuickScanGuardContext>())).Returns(new QuickScanStatusResponse { Enabled = true, CapacityAvailable = true });

        Mock<IQuickScanTelemetry> telemetry = new();
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("auditor-user");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(
                new ScopeContext
                {
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid()
                });

        ArchitectureQuickScanController sut = new(
            guard.Object,
            telemetry.Object,
            orchestrator.Object,
            actor.Object,
            scopeProvider.Object);

        DefaultHttpContext http = new()
        {
            TraceIdentifier = "corr-quick-scan",
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "u")]))
        };
        sut.ControllerContext = new ControllerContext { HttpContext = http };

        ArchitectureQuickScanRequest payload = new()
        {
            SystemName = "PaymentApi",
            PrimaryEnvironment = "Azure",
            Description = "short-desc"
        };

        IActionResult response = await sut.PostQuickScanAsync(payload, CancellationToken.None);

        response.Should().BeOfType<OkObjectResult>();
        orchestrator.Verify(
            o => o.ExecuteAsync(
                payload,
                It.Is<QuickScanExecutionRequestContext>(c => c.TraceIdentifier == "corr-quick-scan"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
