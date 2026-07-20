using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

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

        Mock<IQuickScanGuard> guard = new();
        guard.Setup(g => g.TryBeginScan(It.IsAny<QuickScanGuardContext>())).Returns(QuickScanGuardDecision.Permit());
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
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId
                });

        Mock<IAuditService> audit = new();
        Mock<ILlmCostEstimator> costEstimator = new();
        costEstimator
            .Setup(c => c.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .Returns(0.001m);

        Mock<IQuickScanCostEstimator> preExecCostEstimator = new();
        preExecCostEstimator
            .Setup(c => c.TryReserveCost(It.IsAny<QuickScanRequestValidator.ValidatedQuickScanRequest>(), It.IsAny<string?>(), It.IsAny<DateTimeOffset>()))
            .Returns(QuickScanCostEstimateResult.Permit(
                new QuickScanReservedCostBreakdown
                {
                    ModelId = "gpt-4o-mini",
                    ReservedInputTokens = 100,
                    ReservedOutputTokens = 200,
                    BaseUsd = 0.001m,
                    RetryExposureUsd = 0m,
                    FallbackExposureUsd = 0m,
                    TotalReservedUsd = 0.001m,
                }));

        IOptionsMonitor<QuickScanOptions> options = new TestOptionsMonitor(new QuickScanOptions { Enabled = true });
        IOptionsMonitor<QuickScanSafetyOptions> safetyOptions = new TestSafetyOptionsMonitor(new QuickScanSafetyOptions { Enabled = false });

        ArchitectureQuickScanController sut = new(
            quickScan.Object,
            guard.Object,
            telemetry.Object,
            options,
            safetyOptions,
            preExecCostEstimator.Object,
            actor.Object,
            audit.Object,
            scopeProvider.Object,
            costEstimator.Object,
            TimeProvider.System);

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
                    && e.DataJson.Contains("\"primaryEnvironment\":\"Azure\"", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"descriptionLength\":10", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"scanId\":\"scan-audit-1\"", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"findingCount\":1", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"summaryLength\":12", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private sealed class TestOptionsMonitor(QuickScanOptions value) : IOptionsMonitor<QuickScanOptions>
    {
        public QuickScanOptions CurrentValue => value;

        public QuickScanOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<QuickScanOptions, string?> listener) => null;
    }

    private sealed class TestSafetyOptionsMonitor(QuickScanSafetyOptions value) : IOptionsMonitor<QuickScanSafetyOptions>
    {
        public QuickScanSafetyOptions CurrentValue => value;

        public QuickScanSafetyOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<QuickScanSafetyOptions, string?> listener) => null;
    }
}
