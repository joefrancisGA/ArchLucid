using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

/// <summary>TB-901 adversarial cost/abuse scenarios for Quick Scan guard, budget, concurrency, and orchestrator gates.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "QuickScanAdversarial")]
public sealed class QuickScanAdversarialCostAbuseTests
{
    private static readonly DateTimeOffset BaseUtc = new(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Adversarial_ip_request_flood_hits_global_hourly_limit()
    {
        QuickScanOptions options = new()
        {
            Enabled = true,
            GlobalMaxRequestsPerHour = 3,
            MaxScansPerIpPerHour = 100,
            MaxScansPerIpPerDay = 100,
            MaxScansPerSessionPerDay = 100,
        };

        QuickScanGuard guard = CreateGuard(options);

        for (int index = 0; index < 3; index++)
        {
            QuickScanGuardContext context = QuickScanGuardContextFactory.Create(
                "203.0.113.10",
                $"session-{index}",
                $"description-{index}");

            QuickScanGuardDecision allowed = guard.TryBeginScan(context);
            allowed.Allowed.Should().BeTrue($"attempt {index} should be admitted");
            guard.RecordScanStarted(context);
        }

        QuickScanGuardContext blockedContext = QuickScanGuardContextFactory.Create(
            "203.0.113.10",
            "session-blocked",
            "description-blocked");

        QuickScanGuardDecision blocked = guard.TryBeginScan(blockedContext);

        blocked.Allowed.Should().BeFalse();
        blocked.RejectionReason.Should().Be(QuickScanGuardRejectionReason.GlobalHourlyRequestLimit);
    }

    [Fact]
    public void Adversarial_duplicate_payload_rejected_without_new_admission()
    {
        QuickScanGuard guard = CreateGuard(new QuickScanOptions { Enabled = true });
        QuickScanGuardContext context = QuickScanGuardContextFactory.Create("203.0.113.11", "session-dup", "same payload");

        guard.TryBeginScan(context).Allowed.Should().BeTrue();
        guard.RecordScanStarted(context);

        QuickScanGuardDecision duplicate = guard.TryBeginScan(context);

        duplicate.Allowed.Should().BeFalse();
        duplicate.RejectionReason.Should().Be(QuickScanGuardRejectionReason.DuplicatePayload);
    }

    [Fact]
    public void Adversarial_session_rotation_does_not_bypass_per_ip_hourly_limit()
    {
        QuickScanOptions options = new()
        {
            Enabled = true,
            MaxScansPerIpPerHour = 2,
            MaxScansPerSessionPerDay = 100,
            GlobalMaxRequestsPerHour = 100,
            GlobalMaxRequestsPerDay = 100,
        };

        QuickScanGuard guard = CreateGuard(options);
        const string clientIp = "203.0.113.12";

        for (int index = 0; index < 2; index++)
        {
            QuickScanGuardContext context = QuickScanGuardContextFactory.Create(
                clientIp,
                $"rotated-session-{index}",
                $"unique-description-{index}");

            guard.TryBeginScan(context).Allowed.Should().BeTrue();
            guard.RecordScanStarted(context);
        }

        QuickScanGuardContext blocked = QuickScanGuardContextFactory.Create(
            clientIp,
            "rotated-session-3",
            "unique-description-3");

        QuickScanGuardDecision decision = guard.TryBeginScan(blocked);

        decision.Allowed.Should().BeFalse();
        decision.RejectionReason.Should().Be(QuickScanGuardRejectionReason.PerIpHourlyLimit);
    }

    [Fact]
    public void Adversarial_global_daily_spend_ceiling_blocks_new_unique_payloads()
    {
        QuickScanOptions options = new()
        {
            Enabled = true,
            GlobalMaxSpendUsdPerDay = 0.01m,
            GlobalMaxRequestsPerHour = 100,
            GlobalMaxRequestsPerDay = 100,
            MaxScansPerIpPerHour = 100,
            MaxScansPerIpPerDay = 100,
            MaxScansPerSessionPerDay = 100,
        };

        QuickScanGuard guard = CreateGuard(options);
        QuickScanGuardContext spentContext = QuickScanGuardContextFactory.Create("203.0.113.13", "session-spend", "first spend");

        guard.RecordScanStarted(spentContext);
        guard.RecordScanCompleted(spentContext, succeeded: true, 0.02m, 100, 50, TimeSpan.FromSeconds(1));

        QuickScanGuardContext blockedContext = QuickScanGuardContextFactory.Create(
            "203.0.113.14",
            "session-new",
            "different payload");

        QuickScanGuardDecision decision = guard.TryBeginScan(blockedContext);

        decision.Allowed.Should().BeFalse();
        decision.RejectionReason.Should().Be(QuickScanGuardRejectionReason.GlobalDailySpendCeiling);
    }

    [Fact]
    public async Task Adversarial_concurrent_budget_reservations_never_exceed_hourly_ceiling()
    {
        InMemoryQuickScanGlobalBudgetReservationStore store = new();
        const int workerCount = 30;
        const decimal reserveUsd = 1m;
        int allowedCount = 0;

        await Parallel.ForAsync(
            0,
            workerCount,
            new ParallelOptions { MaxDegreeOfParallelism = 16 },
            async (index, _) =>
            {
                QuickScanGlobalBudgetReservationStoreResult result = await store.TryReserveAsync(
                    new QuickScanGlobalBudgetReservationRequest
                    {
                        ReservationId = Guid.NewGuid(),
                        IdempotencyKey = $"adversarial-{index}",
                        UtcNow = BaseUtc,
                        ReserveUsd = reserveUsd,
                        MaxHourUsd = 5m,
                        MaxDayUsd = 100m,
                        AccountingGracePercent = 0m,
                        ReservationTtl = TimeSpan.FromMinutes(15),
                    });

                if (result.Allowed)
                {
                    Interlocked.Increment(ref allowedCount);
                }
            });

        allowedCount.Should().Be(5);
    }

    [Fact]
    public async Task Adversarial_concurrent_concurrency_admission_never_exceeds_max()
    {
        InMemoryQuickScanDistributedConcurrencyStore store = new();
        const int workerCount = 25;
        const int maxConcurrent = 4;
        int admittedCount = 0;

        await Parallel.ForAsync(
            0,
            workerCount,
            new ParallelOptions { MaxDegreeOfParallelism = 16 },
            async (index, _) =>
            {
                QuickScanConcurrencyAdmitResult result = await store.TryAdmitAsync(
                    new QuickScanConcurrencyAdmitRequest
                    {
                        LeaseId = Guid.NewGuid(),
                        QueueEntryId = Guid.NewGuid(),
                        RequestKey = $"adversarial-{index}",
                        HolderInstanceId = "adversarial-suite",
                        UtcNow = BaseUtc,
                        MaxConcurrentScans = maxConcurrent,
                        MaxQueuedScans = 0,
                        QueueWaitTimeout = TimeSpan.FromSeconds(30),
                        LeaseDuration = TimeSpan.FromSeconds(60),
                    });

                if (result.Outcome == QuickScanConcurrencyAdmitOutcome.DirectLease)
                {
                    Interlocked.Increment(ref admittedCount);
                }
            });

        admittedCount.Should().Be(maxConcurrent);
    }

    [Fact]
    public async Task Adversarial_oversized_description_rejected_before_provider_call()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        fixture.SafetyOptions.PerRequest.MaxInputTokens = 50;

        QuickScanExecutionOrchestrator orchestrator = fixture.CreateOrchestrator();
        ArchitectureQuickScanRequest request = QuickScanAdversarialOrchestratorTestFixture.ValidRequest(
            description: new string('x', 400));

        QuickScanExecutionResult result = await orchestrator.ExecuteAsync(
            request,
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.Validation);
        result.ValidationDetail.Should().Contain("maximum input size");

        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Adversarial_client_model_escalation_rejected_before_provider_call()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        fixture.CostEstimator
            .Setup(c => c.TryReserveCost(It.IsAny<QuickScanRequestValidator.ValidatedQuickScanRequest>(), It.IsAny<string?>(), It.IsAny<DateTimeOffset>()))
            .Returns(QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.ClientModelOverrideRejected));

        QuickScanExecutionOrchestrator orchestrator = fixture.CreateOrchestrator();
        QuickScanExecutionRequestContext context = QuickScanAdversarialOrchestratorTestFixture.AnonymousContext();
        context = new QuickScanExecutionRequestContext
        {
            ClientIp = context.ClientIp,
            SessionId = context.SessionId,
            TraceIdentifier = context.TraceIdentifier,
            ClientRequestedModelId = "gpt-4o",
            TenantId = context.TenantId,
            WorkspaceId = context.WorkspaceId,
            ProjectId = context.ProjectId,
            AuditActor = context.AuditActor,
            RequiresAnonymousDistributedConcurrency = true,
        };

        QuickScanExecutionResult result = await orchestrator.ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            context,
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.Validation);
        result.ValidationDetail.Should().Contain("model selection");

        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Adversarial_global_budget_store_outage_fails_closed_without_provider_call()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        fixture.GlobalBudget
            .Setup(g => g.TryReserveAsync(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanGlobalBudgetReservationAttemptResult.Reject(
                QuickScanGlobalBudgetReservationRejectionReason.StoreUnavailable));

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.CapacityReached);

        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Adversarial_global_budget_cap_rejects_without_provider_call()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        fixture.GlobalBudget
            .Setup(g => g.TryReserveAsync(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanGlobalBudgetReservationAttemptResult.Reject(
                QuickScanGlobalBudgetReservationRejectionReason.HourlyCeilingExceeded));

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.CapacityReached);

        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Adversarial_emergency_disabled_at_entry_blocks_without_provider_call()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        fixture.Operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
                AnonymousExecutionAllowed = false,
                SampleResultAvailable = true,
                PublicMessage = "Emergency stop.",
                StoreHealthy = true,
            });

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.EmergencyDisabled);

        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Adversarial_emergency_flip_before_provider_blocks_without_provider_call()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        bool firstSnapshot = true;

        fixture.Operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                if (firstSnapshot)
                {
                    firstSnapshot = false;

                    return new QuickScanSafetyOperationalSnapshot
                    {
                        Mode = QuickScanSafetyOperationalMode.Normal,
                        AnonymousExecutionAllowed = true,
                        SampleResultAvailable = true,
                        PublicMessage = string.Empty,
                        StoreHealthy = true,
                    };
                }

                return new QuickScanSafetyOperationalSnapshot
                {
                    Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
                    AnonymousExecutionAllowed = false,
                    SampleResultAvailable = true,
                    PublicMessage = "Kill switch flipped.",
                    StoreHealthy = true,
                };
            });

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.EmergencyDisabled);

        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Adversarial_concurrency_queue_full_rejects_without_provider_call()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        fixture.Concurrency
            .Setup(c => c.WaitForAdmissionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanDistributedConcurrencyAdmissionResult.Reject(
                QuickScanConcurrencyRejectionReason.QueueFull));

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.ConcurrencyRejected);
        result.ConcurrencyRejectionReason.Should().Be(QuickScanConcurrencyRejectionReason.QueueFull);

        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public void Adversarial_pre_exec_cost_gate_rejects_unknown_model_before_execution()
    {
        QuickScanSafetyOptions safety = CreateSafetyForCostGate();
        safety.Models.DefaultModelId = "missing-model";
        safety.Models.AllowedModelIds = ["missing-model"];

        QuickScanCostEstimator estimator = CreateCostEstimatorForAdversarial(safety);

        QuickScanCostEstimateResult result = estimator.TryReserveCost(
            CreateValidatedRequest(),
            clientRequestedModelId: null,
            BaseUtc);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanCostEstimateRejectionReason.UnknownModel);
    }

    [Fact]
    public void Adversarial_pre_exec_cost_gate_includes_retry_exposure_in_reservation()
    {
        QuickScanSafetyOptions safety = CreateSafetyForCostGate();
        safety.SampleFallbackEnabled = false;
        safety.PerRequest.MaxTotalRetriesPerRequest = 2;

        QuickScanCostEstimator estimator = CreateCostEstimatorForAdversarial(safety);

        QuickScanCostEstimateResult result = estimator.TryReserveCost(
            CreateValidatedRequest(),
            clientRequestedModelId: null,
            BaseUtc);

        result.Allowed.Should().BeTrue();
        result.Reservation!.RetryExposureUsd.Should().Be(result.Reservation.BaseUsd * 2m);
        result.Reservation.TotalReservedUsd.Should().Be(result.Reservation.BaseUsd + result.Reservation.RetryExposureUsd);
    }

    private static QuickScanGuard CreateGuard(QuickScanOptions options) =>
        new(new TestOptionsMonitor(options), TimeProvider.System);

    private static QuickScanRequestValidator.ValidatedQuickScanRequest CreateValidatedRequest() =>
        new(
            SystemName: "Payment API",
            PrimaryEnvironment: "Azure",
            PrimaryEnvironmentOther: null,
            Description: "Processes card payments with PCI scope.",
            ArchitectureConcerns: ["Security"]);

    private static QuickScanSafetyOptions CreateSafetyForCostGate() =>
        new()
        {
            Enabled = true,
            PerRequest = new QuickScanSafetyPerRequestLimits
            {
                MaxInputTokens = 4_000,
                MaxOutputTokens = 1_200,
                MaxEstimatedCostPerRequest = 0.05m,
                MaxTotalRetriesPerRequest = 0,
            },
            Models = new QuickScanSafetyModelLimits
            {
                AllowedModelIds = ["gpt-4o-mini"],
                DefaultModelId = "gpt-4o-mini",
                ApprovedFallbackModelIds = ["gpt-4o-mini"],
                RejectClientModelSelection = true,
            },
        };

    private static QuickScanCostEstimator CreateCostEstimatorForAdversarial(QuickScanSafetyOptions? safety = null)
    {
        QuickScanSafetyOptions effectiveSafety = safety ?? CreateSafetyForCostGate();
        QuickScanModelPricingCatalogOptions catalog = new()
        {
            MaxPricingAgeDays = 90,
            Entries =
            [
                new QuickScanModelPricingCatalogEntry
                {
                    ModelId = "gpt-4o-mini",
                    Provider = "OpenAI",
                    ProviderModelId = "gpt-4o-mini",
                    InputUsdPerMillionTokens = 0.15m,
                    OutputUsdPerMillionTokens = 0.60m,
                    Currency = "USD",
                    IsActive = true,
                    ApprovedForAnonymousQuickScan = true,
                    MaxContextTokens = 128_000,
                    MaxOutputTokens = 4_096,
                    LastVerifiedUtc = new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero),
                },
            ],
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyMonitor = new();
        safetyMonitor.Setup(m => m.CurrentValue).Returns(effectiveSafety);

        Mock<IOptionsMonitor<QuickScanModelPricingCatalogOptions>> catalogMonitor = new();
        catalogMonitor.Setup(m => m.CurrentValue).Returns(catalog);

        Mock<ILlmCostEstimator> llmCostEstimator = new();
        llmCostEstimator
            .Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .Returns(0.001m);

        return new QuickScanCostEstimator(safetyMonitor.Object, catalogMonitor.Object, llmCostEstimator.Object);
    }

    private sealed class TestOptionsMonitor(QuickScanOptions value) : IOptionsMonitor<QuickScanOptions>
    {
        public QuickScanOptions CurrentValue => value;

        public QuickScanOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<QuickScanOptions, string?> listener) => null;
    }
}
