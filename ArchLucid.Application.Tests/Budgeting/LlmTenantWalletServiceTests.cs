using ArchLucid.Core.Billing;
using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Budgeting;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class LlmTenantWalletServiceTests
{
    [SkippableFact]
    public async Task TryAuthorizeOverageSpendAsync_returns_false_when_balance_insufficient()
    {
        InMemoryLlmTenantWalletRepository repository = new();
        LlmTenantWalletService service = CreateService(repository);
        Guid tenantId = Guid.NewGuid();

        bool authorized = await service.TryAuthorizeOverageSpendAsync(tenantId, 25m, CancellationToken.None);

        authorized.Should().BeFalse();
    }

    [SkippableFact]
    public async Task TryAuthorizeOverageSpendAsync_returns_true_when_balance_covers_estimate()
    {
        InMemoryLlmTenantWalletRepository repository = new();
        Guid tenantId = Guid.NewGuid();

        await repository.TryCreditRefillAsync(tenantId, 50m, Guid.NewGuid(), null, int.Parse(TimeProvider.System.GetUtcNow().UtcDateTime.ToString("yyyyMM")), [], CancellationToken.None);

        LlmTenantWalletService service = CreateService(repository);

        bool authorized = await service.TryAuthorizeOverageSpendAsync(tenantId, 25m, CancellationToken.None);

        authorized.Should().BeTrue();
    }

    [SkippableFact]
    public async Task UpdateWalletAsync_rejects_invalid_monthly_cap_step()
    {
        LlmTenantWalletService service = CreateService(new InMemoryLlmTenantWalletRepository());
        Guid tenantId = Guid.NewGuid();

        LlmTenantWalletView? updated = await service.UpdateWalletAsync(
            tenantId,
            new LlmTenantWalletUpdateCommand { MonthlyCapUsd = 75m },
            CancellationToken.None);

        updated.Should().BeNull();
    }

    [SkippableFact]
    public async Task TryAutoRefillAsync_returns_false_when_monthly_cap_would_be_exceeded()
    {
        InMemoryLlmTenantWalletRepository repository = new();
        Guid tenantId = Guid.NewGuid();

        await repository.GetOrCreateAsync(tenantId, CancellationToken.None);
        await repository.UpdateSettingsAsync(
            new LlmTenantWalletUpdateSettingsRequest
            {
                TenantId = tenantId,
                AutoReplenishEnabled = true,
                MonthlyCapUsd = 50m,
                StripeCustomerId = "cus_test",
                StripePaymentMethodId = "pm_test",
            },
            CancellationToken.None);

        await repository.TryCreditRefillAsync(tenantId, 50m, Guid.NewGuid(), null, int.Parse(TimeProvider.System.GetUtcNow().UtcDateTime.ToString("yyyyMM")), [], CancellationToken.None);

        Mock<IStripeWalletGateway> stripe = new();
        stripe
            .Setup(s => s.ChargeRefillAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(StripeWalletChargeResult.Ok("pi_test"));

        LlmTenantWalletService service = CreateService(repository, stripe.Object);

        bool refilled = await service.TryAutoRefillAsync(tenantId, Guid.NewGuid(), CancellationToken.None);

        refilled.Should().BeFalse();
        stripe.Verify(
            s => s.ChargeRefillAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryAutoRefillAsync_credits_wallet_when_stripe_succeeds()
    {
        InMemoryLlmTenantWalletRepository repository = new();
        Guid tenantId = Guid.NewGuid();

        await repository.GetOrCreateAsync(tenantId, CancellationToken.None);
        await repository.UpdateSettingsAsync(
            new LlmTenantWalletUpdateSettingsRequest
            {
                TenantId = tenantId,
                AutoReplenishEnabled = true,
                MonthlyCapUsd = 100m,
                StripeCustomerId = "cus_test",
                StripePaymentMethodId = "pm_test",
            },
            CancellationToken.None);

        await repository.TryCreditRefillAsync(tenantId, 0m, Guid.NewGuid(), null, int.Parse(TimeProvider.System.GetUtcNow().UtcDateTime.ToString("yyyyMM")), [], CancellationToken.None);

        Mock<IStripeWalletGateway> stripe = new();
        stripe
            .Setup(s => s.ChargeRefillAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(StripeWalletChargeResult.Ok("pi_test_1"));

        LlmTenantWalletService service = CreateService(repository, stripe.Object);

        bool refilled = await service.TryAutoRefillAsync(tenantId, Guid.NewGuid(), CancellationToken.None);

        refilled.Should().BeTrue();
        LlmTenantWalletView view = await service.GetWalletAsync(tenantId, CancellationToken.None);
        view.BalanceUsd.Should().Be(50m);
        view.AutoRefillsThisUtcMonthCount.Should().Be(1);
    }

    [SkippableFact]
    public async Task ApplyWebhookPaymentIntentSucceededAsync_is_idempotent_for_same_payment_intent()
    {
        InMemoryLlmTenantWalletRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        Guid correlationId = Guid.NewGuid();
        LlmTenantWalletService service = CreateService(repository);

        bool first = await service.ApplyWebhookPaymentIntentSucceededAsync(
            tenantId,
            "pi_dup",
            50m,
            correlationId,
            CancellationToken.None);

        bool second = await service.ApplyWebhookPaymentIntentSucceededAsync(
            tenantId,
            "pi_dup",
            50m,
            Guid.NewGuid(),
            CancellationToken.None);

        first.Should().BeTrue();
        second.Should().BeTrue();

        LlmTenantWalletView view = await service.GetWalletAsync(tenantId, CancellationToken.None);
        view.BalanceUsd.Should().Be(50m);
    }

    [SkippableFact]
    public async Task TryAutoRefillAsync_allows_refill_after_utc_month_rollover_when_prior_month_at_cap()
    {
        InMemoryLlmTenantWalletRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset augustUtc = new(2026, 8, 15, 0, 0, 0, TimeSpan.Zero);
        FakeTimeProvider timeProvider = new(augustUtc);
        int julyYearMonth = 202607;

        await repository.GetOrCreateAsync(tenantId, CancellationToken.None);
        await repository.UpdateSettingsAsync(
            new LlmTenantWalletUpdateSettingsRequest
            {
                TenantId = tenantId,
                AutoReplenishEnabled = true,
                MonthlyCapUsd = 100m,
                StripeCustomerId = "cus_test",
                StripePaymentMethodId = "pm_test",
            },
            CancellationToken.None);

        await repository.TryCreditRefillAsync(tenantId, 50m, Guid.NewGuid(), "pi_july_1", julyYearMonth, [], CancellationToken.None);
        await repository.TryCreditRefillAsync(tenantId, 50m, Guid.NewGuid(), "pi_july_2", julyYearMonth, [], CancellationToken.None);
        await repository.TryConsumeAsync(tenantId, 95m, Guid.NewGuid(), [], CancellationToken.None);

        Mock<IStripeWalletGateway> stripe = new();
        stripe
            .Setup(s => s.ChargeRefillAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(StripeWalletChargeResult.Ok("pi_august_1"));

        LlmTenantWalletService service = CreateService(repository, stripe.Object, timeProvider: timeProvider);

        bool refilled = await service.TryAutoRefillAsync(tenantId, Guid.NewGuid(), CancellationToken.None);

        refilled.Should().BeTrue();
        LlmTenantWalletView view = await service.GetWalletAsync(tenantId, CancellationToken.None);
        view.BalanceUsd.Should().Be(55m);
        view.AutoRefillsThisUtcMonthCount.Should().Be(1);
    }

    [SkippableFact]
    public async Task TryAuthorizeOverageSpendAsync_parallel_estimates_only_one_succeeds_when_balance_covers_single_estimate()
    {
        InMemoryLlmTenantWalletRepository repository = new();
        Guid tenantId = Guid.NewGuid();

        await repository.TryCreditRefillAsync(
            tenantId,
            50m,
            Guid.NewGuid(),
            null,
            int.Parse(TimeProvider.System.GetUtcNow().UtcDateTime.ToString("yyyyMM")),
            [],
            CancellationToken.None);

        LlmTenantWalletService service = CreateService(repository);

        Task<bool>[] authorizeTasks = new Task<bool>[2];
        authorizeTasks[0] = service.TryAuthorizeOverageSpendAsync(tenantId, 40m, CancellationToken.None);
        authorizeTasks[1] = service.TryAuthorizeOverageSpendAsync(tenantId, 40m, CancellationToken.None);

        bool[] results = await Task.WhenAll(authorizeTasks);

        results.Count(static authorized => authorized).Should().Be(1);
        LlmTenantWalletView view = await service.GetWalletAsync(tenantId, CancellationToken.None);
        view.BalanceUsd.Should().Be(10m);
    }

    [SkippableFact]
    public async Task ConsumeInternalAsync_requeues_settlement_when_optimistic_retries_exhausted()
    {
        Guid tenantId = Guid.NewGuid();
        byte[] rowVersion = BitConverter.GetBytes(1L);
        LlmTenantWalletStateReadModel state = new()
        {
            TenantId = tenantId,
            BalanceUsd = 50m,
            RefillTriggerThresholdUsd = 10m,
            RowVersion = rowVersion,
        };

        Mock<ILlmTenantWalletRepository> repository = new();
        repository
            .Setup(r => r.GetOrCreateAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(state);
        repository
            .Setup(r => r.TryConsumeAsync(tenantId, 5m, It.IsAny<Guid>(), rowVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(LlmTenantWalletConsumeResult.Conflict());

        LlmWalletSettlementQueue queue = new();
        LlmTenantWalletService service = new(
            repository.Object,
            new Mock<IStripeWalletGateway>().Object,
            queue,
            new Mock<IAuditService>().Object,
            TimeProvider.System,
            NullLogger<LlmTenantWalletService>.Instance);

        Guid correlationId = Guid.NewGuid();
        await service.ConsumeInternalAsync(tenantId, 5m, correlationId, CancellationToken.None);

        queue.Reader.TryRead(out LlmWalletSettlementWorkItem item).Should().BeTrue();
        item.TenantId.Should().Be(tenantId);
        item.AmountUsd.Should().Be(5m);
        item.CorrelationId.Should().Be(correlationId);
    }

    [SkippableFact]
    public async Task ReconcileOverageInternalAsync_credits_wallet_when_actual_less_than_authorized()
    {
        InMemoryLlmTenantWalletRepository repository = new();
        Guid tenantId = Guid.NewGuid();

        await repository.TryCreditRefillAsync(
            tenantId,
            50m,
            Guid.NewGuid(),
            null,
            int.Parse(TimeProvider.System.GetUtcNow().UtcDateTime.ToString("yyyyMM")),
            [],
            CancellationToken.None);

        LlmTenantWalletService service = CreateService(repository);

        bool authorized = await service.TryAuthorizeOverageSpendAsync(tenantId, 40m, CancellationToken.None);
        authorized.Should().BeTrue();

        await service.ReconcileOverageInternalAsync(tenantId, 25m, 40m, Guid.NewGuid(), CancellationToken.None);

        LlmTenantWalletView view = await service.GetWalletAsync(tenantId, CancellationToken.None);
        view.BalanceUsd.Should().Be(25m);
    }

    private static LlmTenantWalletService CreateService(InMemoryLlmTenantWalletRepository repository)
    {
        Mock<IStripeWalletGateway> stripe = new();

        return CreateService(repository, stripe.Object);
    }

    private static LlmTenantWalletService CreateService(
        InMemoryLlmTenantWalletRepository repository,
        IStripeWalletGateway stripeGateway,
        TimeProvider? timeProvider = null)
    {
        LlmWalletSettlementQueue queue = new();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        return new LlmTenantWalletService(
            repository,
            stripeGateway,
            queue,
            audit.Object,
            timeProvider ?? TimeProvider.System,
            NullLogger<LlmTenantWalletService>.Instance);
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
