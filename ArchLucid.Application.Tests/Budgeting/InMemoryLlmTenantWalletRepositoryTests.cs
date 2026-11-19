using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Budgeting;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InMemoryLlmTenantWalletRepositoryTests
{
    [SkippableFact]
    public async Task TryCreditRefillAsync_allows_only_one_concurrent_credit_per_payment_intent()
    {
        const int attemptCount = 16;
        const decimal amountUsd = 25m;
        const string paymentIntentId = "pi_concurrent_refill";

        InMemoryLlmTenantWalletRepository repository = new();
        Guid[] tenantIds = Enumerable.Range(0, attemptCount).Select(_ => Guid.NewGuid()).ToArray();
        using Barrier start = new(attemptCount);

        Task<LlmTenantWalletCreditResult>[] attempts = tenantIds
            .Select(
                tenantId => Task.Run(
                    () =>
                    {
                        start.SignalAndWait();

                        return repository.TryCreditRefillAsync(
                                tenantId,
                                amountUsd,
                                Guid.NewGuid(),
                                paymentIntentId,
                                202611,
                                [],
                                cancellationToken: CancellationToken.None)
                            .GetAwaiter()
                            .GetResult();
                    }))
            .ToArray();

        LlmTenantWalletCreditResult[] results = await Task.WhenAll(attempts);

        results.Count(result => result.Succeeded).Should().Be(1);
        results.Count(result => result.DuplicatePaymentIntent).Should().Be(attemptCount - 1);

        decimal totalBalance = 0m;

        foreach (Guid tenantId in tenantIds)
        {
            LlmTenantWalletStateReadModel state = await repository.GetOrCreateAsync(tenantId, CancellationToken.None);
            totalBalance += state.BalanceUsd;
        }

        totalBalance.Should().Be(amountUsd, "one Stripe payment intent may credit only one wallet");
    }
}
