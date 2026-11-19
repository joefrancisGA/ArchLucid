using ArchLucid.Core.AiUsage;
using ArchLucid.Persistence.AiUsage;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class InMemoryTenantAiBudgetPolicyRepositoryTests
{
    [Fact]
    public async Task Concurrent_provisioning_preserves_the_winning_budget()
    {
        InMemoryTenantAiBudgetPolicyRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset trialExpiration = new(2026, 12, 1, 0, 0, 0, TimeSpan.Zero);
        TaskCompletionSource start = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<(int Budget, bool Inserted)>[] attempts = Enumerable.Range(1, 16).Select(async budget =>
        {
            await start.Task;
            bool inserted = await repository.EnsureDefaultTrialPolicyIfAbsentAsync(tenantId, budget, trialExpiration);
            return (Budget: budget, Inserted: inserted);
        }).ToArray();

        start.SetResult();
        var winner = Assert.Single(await Task.WhenAll(attempts), static attempt => attempt.Inserted);
        TenantAiBudgetPolicyRow? stored = await repository.GetByTenantIdAsync(tenantId);

        Assert.NotNull(stored);
        Assert.Equal((decimal)winner.Budget, stored.BudgetAmountUsd);
    }
}
