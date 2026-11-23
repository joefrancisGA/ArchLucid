using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryTenantTrialLifecycleAtomicityTests
{
    [Fact]
    public async Task Concurrent_conversion_and_baseline_update_preserve_both_changes()
    {
        for (int attempt = 0; attempt < 32; attempt++)
        {
            (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
            DateTimeOffset stamp = TimeProvider.System.GetUtcNow();

            Task<bool> converted = Task.Run(() => repository.MarkTrialConvertedAsync(
                tenantId, TenantTier.Enterprise, CancellationToken.None));
            Task baseline = Task.Run(() => repository.PersistTrialSignupBaselineReviewCycleAsync(
                tenantId, 48m, "parallel", stamp, CancellationToken.None));

            await Task.WhenAll(converted, baseline);
            (await converted).Should().BeTrue();

            TenantRecord current = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
            current.Tier.Should().Be(TenantTier.Enterprise);
            current.TrialStatus.Should().Be(TrialLifecycleStatus.Converted);
            current.BaselineReviewCycleHours.Should().Be(48m);
            current.BaselineReviewCycleSource.Should().Be("parallel");
            current.BaselineReviewCycleCapturedUtc.Should().Be(stamp);
        }
    }

    [Fact]
    public async Task Concurrent_trial_quota_debit_and_baseline_update_preserve_both_changes()
    {
        for (int attempt = 0; attempt < 32; attempt++)
        {
            (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();

            Task debit = Task.Run(() => repository.TryIncrementActiveTrialRunAsync(
                tenantId, CancellationToken.None));
            Task baseline = Task.Run(() => repository.PersistTrialSignupBaselineReviewCycleAsync(
                tenantId, 24m, "measured", TimeProvider.System.GetUtcNow(), CancellationToken.None));
            await Task.WhenAll(debit, baseline);

            TenantRecord current = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
            current.TrialRunsUsed.Should().Be(1);
            current.BaselineReviewCycleHours.Should().Be(24m);
            current.BaselineReviewCycleSource.Should().Be("measured");
        }
    }

    [Fact]
    public async Task Canceled_conversion_does_not_mutate_tenant()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task> conversion = () => repository.MarkTrialConvertedAsync(
            tenantId, TenantTier.Enterprise, canceled.Token);
        await conversion.Should().ThrowAsync<OperationCanceledException>();

        TenantRecord current = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        current.TrialStatus.Should().Be(TrialLifecycleStatus.Active);
        current.Tier.Should().Be(TenantTier.Standard);
    }

    [Fact]
    public async Task Canceled_trial_commit_and_baseline_update_do_not_mutate_tenant()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
        using CancellationTokenSource canceled = new();
        canceled.Cancel();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        Func<Task> recommit = () => repository.CommitSelfServiceTrialAsync(
            tenantId, now, now.AddDays(2), 99, 99, Guid.NewGuid(),
            99m, "cancelled", now, null, null, null, null, canceled.Token);
        await recommit.Should().ThrowAsync<OperationCanceledException>();

        Func<Task> baseline = () => repository.PersistTrialSignupBaselineReviewCycleAsync(
            tenantId, 99m, "cancelled", now, canceled.Token);
        await baseline.Should().ThrowAsync<OperationCanceledException>();

        TenantRecord current = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        current.TrialRunsLimit.Should().Be(5);
        current.TrialSeatsLimit.Should().Be(5);
        current.BaselineReviewCycleHours.Should().Be(12m);
    }

    [Fact]
    public async Task Canceled_lifecycle_transition_and_first_manifest_commit_are_side_effect_free()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task> transition = () => repository.TryRecordTrialLifecycleTransitionAsync(
            tenantId, TrialLifecycleStatus.Active, "Suspended", "test", canceled.Token);
        await transition.Should().ThrowAsync<OperationCanceledException>();

        Func<Task> commit = () => repository.TryMarkFirstManifestCommittedAsync(
            tenantId, TimeProvider.System.GetUtcNow(), canceled.Token);
        await commit.Should().ThrowAsync<OperationCanceledException>();

        TenantRecord current = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        current.TrialStatus.Should().Be(TrialLifecycleStatus.Active);
        current.TrialFirstManifestCommittedUtc.Should().BeNull();

        (await repository.TryMarkFirstManifestCommittedAsync(
            tenantId, TimeProvider.System.GetUtcNow(), CancellationToken.None)).Should().NotBeNull();
    }

    [Fact]
    public async Task Canceled_read_and_e2e_mutations_propagate_cancellation()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task> list = () => repository.ListTrialLifecycleAutomationTenantIdsAsync(canceled.Token);
        await list.Should().ThrowAsync<OperationCanceledException>();

        Func<Task> expire = () => repository.E2eHarnessSetTrialExpiresUtcAsync(
            tenantId, TimeProvider.System.GetUtcNow().AddDays(-30), canceled.Token);
        await expire.Should().ThrowAsync<OperationCanceledException>();

        Func<Task> grant = () => repository.E2eHarnessGrantEnterpriseCommercialAsync(
            tenantId, canceled.Token);
        await grant.Should().ThrowAsync<OperationCanceledException>();

        TenantRecord current = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        current.TrialExpiresUtc.Should().BeAfter(TimeProvider.System.GetUtcNow());
        current.Tier.Should().Be(TenantTier.Standard);
    }

    private static async Task<(InMemoryTenantRepository Repository, Guid TenantId)> CreateTrialAsync()
    {
        InMemoryTenantRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        await repository.InsertTenantAsync(
            tenantId, "Trial lifecycle test", "trial-" + tenantId.ToString("N")[..12],
            TenantTier.Standard, null, TenantDataRegions.Default, CancellationToken.None);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        await repository.CommitSelfServiceTrialAsync(
            tenantId, now.AddHours(-1), now.AddDays(7), 5, 5, Guid.NewGuid(),
            12m, "original", now, null, null, null, null, CancellationToken.None);
        return (repository, tenantId);
    }
}
