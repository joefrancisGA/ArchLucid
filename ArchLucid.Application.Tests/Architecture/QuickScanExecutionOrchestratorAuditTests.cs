using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanExecutionOrchestratorAuditTests
{
    [Fact]
    public async Task ExecuteAsync_AfterSuccessfulScan_LogsArchitectureQuickScanExecutedWithDataJson()
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

        Mock<IQuickScanTelemetry> telemetry = new();

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

        Mock<IQuickScanGlobalBudgetReservationService> globalBudget = new();
        globalBudget
            .Setup(g => g.TryReserveAsync(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanGlobalBudgetReservationAttemptResult.Permit(Guid.NewGuid()));

        Mock<IQuickScanDistributedConcurrencyService> concurrency = new();
        concurrency
            .Setup(c => c.WaitForAdmissionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanDistributedConcurrencyAdmissionResult.NoOp());

        Mock<IQuickScanIdentityAbuseService> identityAbuse = new();
        identityAbuse
            .Setup(a => a.TryAdmitAsync(It.IsAny<QuickScanIdentityAbuseAdmitContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanIdentityAbuseDecision.Permit());

        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.Normal,
                AnonymousExecutionAllowed = true,
                SampleResultAvailable = true,
                PublicMessage = string.Empty,
                StoreHealthy = true,
            });

        Mock<IQuickScanUsageRecorder> usageRecorder = new();

        IOptionsMonitor<QuickScanOptions> options = new TestOptionsMonitor(new QuickScanOptions { Enabled = true });
        IOptionsMonitor<QuickScanSafetyOptions> safetyOptions = new TestSafetyOptionsMonitor(new QuickScanSafetyOptions { Enabled = false });

        QuickScanExecutionOrchestrator sut = new(
            quickScan.Object,
            guard.Object,
            telemetry.Object,
            options,
            safetyOptions,
            preExecCostEstimator.Object,
            globalBudget.Object,
            concurrency.Object,
            identityAbuse.Object,
            operational.Object,
            usageRecorder.Object,
            audit.Object,
            costEstimator.Object,
            NullLogger<QuickScanExecutionOrchestrator>.Instance,
            TimeProvider.System);

        ArchitectureQuickScanRequest payload = new()
        {
            SystemName = "PaymentApi",
            PrimaryEnvironment = "Azure",
            Description = "short-desc"
        };

        QuickScanExecutionRequestContext context = new()
        {
            ClientIp = "127.0.0.1",
            SessionId = "session-1",
            TraceIdentifier = "corr-quick-scan",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            AuditActor = "auditor-user",
        };

        QuickScanExecutionResult result = await sut.ExecuteAsync(payload, context, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
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
