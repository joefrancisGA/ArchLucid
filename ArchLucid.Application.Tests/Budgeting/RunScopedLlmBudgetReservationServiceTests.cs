using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Budgeting;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunScopedLlmBudgetReservationServiceTests
{
    [Fact]
    public async Task Admit_rejects_when_estimate_exceeds_MaxCostPerRun()
    {
        RunScopedLlmBudgetReservationService sut = CreateSut(
            reservationEnabled: true,
            monthlyEnabled: true,
            assumedUsdPerCall: 5m,
            maxCostPerRun: 4m,
            hardCutoffUsd: 1000m);

        RunScopedLlmBudgetAdmitResult result = await sut.AdmitBeforeAgentBatchAsync(
            Guid.NewGuid(),
            "run1",
            agentTaskCount: 1);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(RunScopedLlmBudgetAdmitRejectionReason.RunCostBudgetExceeded);
    }

    [Fact]
    public async Task Admit_rejects_when_monthly_pressure_lacks_headroom()
    {
        Mock<ILlmTenantBudgetRepository> budgetRepo = new();
        budgetRepo
            .Setup(r => r.GetOrCreateAsync(
                It.IsAny<Guid>(),
                LlmBudgetPeriod.Monthly,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LlmTenantBudgetStateReadModel
            {
                CommittedUsd = 90m,
                ReservedUsd = 0m,
            });

        RunScopedLlmBudgetReservationService sut = CreateSut(
            reservationEnabled: true,
            monthlyEnabled: true,
            assumedUsdPerCall: 20m,
            maxCostPerRun: null,
            hardCutoffUsd: 100m,
            budgetRepository: budgetRepo.Object);

        RunScopedLlmBudgetAdmitResult result = await sut.AdmitBeforeAgentBatchAsync(
            Guid.NewGuid(),
            "run2",
            agentTaskCount: 1);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(RunScopedLlmBudgetAdmitRejectionReason.MonthlyQuotaExceeded);
    }

    [Fact]
    public async Task Admit_pass_through_when_feature_disabled()
    {
        RunScopedLlmBudgetReservationService sut = CreateSut(
            reservationEnabled: false,
            monthlyEnabled: true,
            assumedUsdPerCall: 5m,
            maxCostPerRun: null,
            hardCutoffUsd: 100m);

        RunScopedLlmBudgetAdmitResult result = await sut.AdmitBeforeAgentBatchAsync(
            Guid.NewGuid(),
            "run3",
            agentTaskCount: 4);

        result.Allowed.Should().BeTrue();
        result.ReservationHeld.Should().BeFalse();
    }

    [Fact]
    public async Task Admit_holds_reservation_when_headroom_exists()
    {
        Mock<ILlmTenantBudgetRepository> budgetRepo = new();
        budgetRepo
            .Setup(r => r.GetOrCreateAsync(
                It.IsAny<Guid>(),
                LlmBudgetPeriod.Monthly,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LlmTenantBudgetStateReadModel
            {
                CommittedUsd = 10m,
                ReservedUsd = 0m,
            });

        InMemoryRunScopedLlmBudgetReservationStore store = new();
        RunScopedLlmBudgetReservationService sut = CreateSut(
            reservationEnabled: true,
            monthlyEnabled: true,
            assumedUsdPerCall: 5m,
            maxCostPerRun: null,
            hardCutoffUsd: 100m,
            budgetRepository: budgetRepo.Object,
            store: store);

        RunScopedLlmBudgetAdmitResult result = await sut.AdmitBeforeAgentBatchAsync(
            Guid.NewGuid(),
            "run4",
            agentTaskCount: 2);

        result.Allowed.Should().BeTrue();
        result.ReservationHeld.Should().BeTrue();
        result.ReservationId.Should().NotBeNull();
        result.ReservedUsd.Should().Be(10m);
    }

    private static RunScopedLlmBudgetReservationService CreateSut(
        bool reservationEnabled,
        bool monthlyEnabled,
        decimal assumedUsdPerCall,
        decimal? maxCostPerRun,
        decimal hardCutoffUsd,
        ILlmTenantBudgetRepository? budgetRepository = null,
        IRunScopedLlmBudgetReservationStore? store = null)
    {
        Mock<IOptionsMonitor<RunScopedLlmBudgetReservationOptions>> reservationOpts = new();
        reservationOpts.Setup(o => o.CurrentValue).Returns(new RunScopedLlmBudgetReservationOptions
        {
            Enabled = reservationEnabled,
            AssumedCallsPerAgentTask = 1,
            ReservationTtlMinutes = 30,
            AccountingGracePercent = 0m,
        });

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monthlyOpts = new();
        monthlyOpts.Setup(o => o.CurrentValue).Returns(new LlmMonthlyTenantDollarBudgetOptions
        {
            Enabled = monthlyEnabled,
            HardCutoffUsdPerUtcMonth = hardCutoffUsd,
            AssumedMaxPromptTokensPerRequest = 1000,
            AssumedMaxCompletionTokensPerRequest = 500,
        });

        Mock<ILlmCostEstimator> costEstimator = new();
        costEstimator
            .Setup(c => c.EstimateUsd(It.IsAny<int>(), It.IsAny<int>()))
            .Returns(assumedUsdPerCall);

        return new RunScopedLlmBudgetReservationService(
            reservationOpts.Object,
            monthlyOpts.Object,
            Options.Create(new AgentOutputQualityGateOptions { MaxCostPerRun = maxCostPerRun }),
            costEstimator.Object,
            budgetRepository ?? Mock.Of<ILlmTenantBudgetRepository>(),
            store ?? new InMemoryRunScopedLlmBudgetReservationStore(),
            TimeProvider.System,
            NullLogger<RunScopedLlmBudgetReservationService>.Instance);
    }
}
