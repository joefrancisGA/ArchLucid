using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryTenantTrialCancellationTests
{
    [Fact]
    public async Task Canceled_trial_run_increment_does_not_consume_quota()
    {
        (InMemoryTenantRepository repo, Guid tenantId) = await CreateTrialAsync();
        using CancellationTokenSource source = new();
        source.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            repo.TryIncrementActiveTrialRunAsync(tenantId, source.Token));

        TenantRecord after = (await repo.GetByIdAsync(tenantId, CancellationToken.None))!;
        after.TrialRunsUsed.Should().Be(0);

        await repo.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None);
        (await repo.GetByIdAsync(tenantId, CancellationToken.None))!.TrialRunsUsed.Should().Be(1);
    }

    [Fact]
    public async Task Canceled_trial_seat_claim_does_not_consume_quota()
    {
        (InMemoryTenantRepository repo, Guid tenantId) = await CreateTrialAsync();
        using CancellationTokenSource source = new();
        source.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            repo.TryClaimTrialSeatAsync(tenantId, "actor-1", source.Token));

        TenantRecord after = (await repo.GetByIdAsync(tenantId, CancellationToken.None))!;
        after.TrialSeatsUsed.Should().Be(0);

        await repo.TryClaimTrialSeatAsync(tenantId, "actor-1", CancellationToken.None);
        (await repo.GetByIdAsync(tenantId, CancellationToken.None))!.TrialSeatsUsed.Should().Be(1);
    }

    [Fact]
    public async Task Cancellation_is_not_silently_ignored_when_tenant_is_missing()
    {
        InMemoryTenantRepository repo = new();
        using CancellationTokenSource source = new();
        source.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            repo.TryIncrementActiveTrialRunAsync(Guid.NewGuid(), source.Token));
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            repo.TryClaimTrialSeatAsync(Guid.NewGuid(), "actor-2", source.Token));
    }

    private static async Task<(InMemoryTenantRepository Repo, Guid TenantId)> CreateTrialAsync()
    {
        InMemoryTenantRepository repo = new();
        Guid tenantId = Guid.NewGuid();
        await repo.InsertTenantAsync(
            tenantId,
            "Cancellation test tenant",
            "trial-" + tenantId.ToString("N")[..12],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        DateTimeOffset start = TimeProvider.System.GetUtcNow().AddHours(-1);
        await repo.CommitSelfServiceTrialAsync(
            tenantId,
            start,
            start.AddDays(3),
            runsLimit: 2,
            seatsLimit: 2,
            sampleRunId: Guid.NewGuid(),
            baselineReviewCycleHours: null,
            baselineReviewCycleSource: null,
            baselineReviewCycleCapturedUtc: null,
            companySize: null,
            architectureTeamSize: null,
            industryVertical: null,
            industryVerticalOther: null,
            CancellationToken.None);

        return (repo, tenantId);
    }
}
