using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
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
    public async Task PostQuickScanAsync_AfterSuccessfulScan_LogsArchitectureQuickScanExecutedWithDataJson()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        QuickScanResult scanResult = new()
        {
            ScanId = "scan-audit-1",
            Summary = "summary-text",
            Findings =
            [
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
                    Category = "cat",
                    Message = "msg"
                }
            ]
        };

        Mock<IQuickScanService> quickScan = new();
        quickScan
            .Setup(q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(scanResult);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("auditor-user");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(
                new ScopeContext
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId
                });

        Mock<IAuditService> audit = new();

        ArchitectureQuickScanController sut = new(
            quickScan.Object,
            actor.Object,
            audit.Object,
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
            CloudProvider = "azure",
            Description = "short-desc"
        };

        IActionResult response = await sut.PostQuickScanAsync(payload, CancellationToken.None);

        response.Should().BeOfType<OkObjectResult>();
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ArchitectureQuickScanExecuted
                    && e.TenantId == tenantId
                    && e.WorkspaceId == workspaceId
                    && e.ProjectId == projectId
                    && e.CorrelationId == "corr-quick-scan"
                    && !string.IsNullOrWhiteSpace(e.DataJson)
                    && e.DataJson.Contains("\"systemName\":\"PaymentApi\"", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"cloudProvider\":\"azure\"", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"descriptionLength\":10", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"scanId\":\"scan-audit-1\"", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"findingCount\":1", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"summaryLength\":12", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
