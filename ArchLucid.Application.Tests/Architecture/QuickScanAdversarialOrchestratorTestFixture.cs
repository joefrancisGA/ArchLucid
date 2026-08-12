using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

/// <summary>Builds a <see cref="QuickScanExecutionOrchestrator" /> with overridable dependencies for adversarial tests (TB-901).</summary>
internal sealed class QuickScanAdversarialOrchestratorTestFixture
{
    public Mock<IQuickScanService> QuickScanService { get; } = new();

    public Mock<IQuickScanGuard> Guard { get; } = new();

    public Mock<IQuickScanTelemetry> Telemetry { get; } = new();

    public Mock<IQuickScanCostEstimator> CostEstimator { get; } = new();

    public Mock<IQuickScanGlobalBudgetReservationService> GlobalBudget { get; } = new();

    public Mock<IQuickScanDistributedConcurrencyService> Concurrency { get; } = new();

    public Mock<IQuickScanIdentityAbuseService> IdentityAbuse { get; } = new();

    public Mock<IQuickScanSafetyOperationalStateProvider> Operational { get; } = new();

    public Mock<IQuickScanUsageRecorder> UsageRecorder { get; } = new();

    public Mock<IAuditService> Audit { get; } = new();

    public Mock<ILlmCostEstimator> LlmCostEstimator { get; } = new();

    public QuickScanOptions QuickScanOptions { get; set; } = new() { Enabled = true };

    public QuickScanSafetyOptions SafetyOptions { get; set; } = CreateDefaultSafetyOptions();

    public QuickScanAdversarialOrchestratorTestFixture()
    {
        Guard.Setup(g => g.TryBeginScan(It.IsAny<QuickScanGuardContext>())).Returns(QuickScanGuardDecision.Permit());

        CostEstimator
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

        GlobalBudget
            .Setup(g => g.TryReserveAsync(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanGlobalBudgetReservationAttemptResult.Permit(Guid.NewGuid()));

        Concurrency
            .Setup(c => c.WaitForAdmissionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanDistributedConcurrencyAdmissionResult.NoOp());

        IdentityAbuse
            .Setup(a => a.TryAdmitAsync(It.IsAny<QuickScanIdentityAbuseAdmitContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanIdentityAbuseDecision.Permit());
        IdentityAbuse
            .Setup(a => a.EvaluateAsync(It.IsAny<QuickScanIdentityAbuseAdmitContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanIdentityAbuseDecision.Permit());

        Operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.Normal,
                AnonymousExecutionAllowed = true,
                SampleResultAvailable = true,
                PublicMessage = string.Empty,
                StoreHealthy = true,
            });

        LlmCostEstimator
            .Setup(c => c.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .Returns(0.001m);

        QuickScanService
            .Setup(q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QuickScanResult
            {
                ScanId = "adversarial-scan",
                Summary = "summary",
                Findings =
                [
                    new ArchitectureFinding
                    {
                        SourceAgent = AgentType.Topology,
                        Category = "cat",
                        Message = "msg",
                    },
                ],
            });
    }

    public QuickScanExecutionOrchestrator CreateOrchestrator() =>
        new(
            QuickScanService.Object,
            Guard.Object,
            Telemetry.Object,
            new TestOptionsMonitor(QuickScanOptions),
            new TestSafetyOptionsMonitor(SafetyOptions),
            CostEstimator.Object,
            GlobalBudget.Object,
            Concurrency.Object,
            IdentityAbuse.Object,
            Operational.Object,
            UsageRecorder.Object,
            Audit.Object,
            LlmCostEstimator.Object,
            NullLogger<QuickScanExecutionOrchestrator>.Instance,
            TimeProvider.System);

    public static QuickScanExecutionRequestContext AnonymousContext(string sessionId = "session-adversarial") =>
        new()
        {
            ClientIp = "203.0.113.10",
            SessionId = sessionId,
            TraceIdentifier = Guid.NewGuid().ToString("N"),
            TenantId = Guid.Empty,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
            AuditActor = "anonymous",
            RequiresAnonymousDistributedConcurrency = true,
        };

    public static QuickScanExecutionRequestContext AuthenticatedContext(string sessionId = "session-authenticated") =>
        new()
        {
            ClientIp = "10.0.0.5",
            SessionId = sessionId,
            TraceIdentifier = Guid.NewGuid().ToString("N"),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            AuditActor = "authenticated-user",
            RequiresAnonymousDistributedConcurrency = false,
        };

    public static ArchitectureQuickScanRequest ValidRequest(string? description = null) =>
        new()
        {
            SystemName = "Payment API",
            PrimaryEnvironment = "Azure",
            Description = description ?? "Processes card payments with PCI scope.",
        };

    private static QuickScanSafetyOptions CreateDefaultSafetyOptions() =>
        new()
        {
            Enabled = true,
            SampleFallbackEnabled = true,
            PerRequest = new QuickScanSafetyPerRequestLimits
            {
                MaxInputTokens = 4_000,
                MaxOutputTokens = 1_200,
                MaxEstimatedCostPerRequest = 0.05m,
            },
            Models = new QuickScanSafetyModelLimits
            {
                AllowedModelIds = ["gpt-4o-mini"],
                DefaultModelId = "gpt-4o-mini",
                ApprovedFallbackModelIds = ["gpt-4o-mini"],
                RejectClientModelSelection = true,
            },
            GlobalBudget = new QuickScanSafetyGlobalBudgetLimits
            {
                MaxAnonymousSpendPerHour = 5m,
                MaxAnonymousSpendPerDay = 25m,
            },
        };

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
