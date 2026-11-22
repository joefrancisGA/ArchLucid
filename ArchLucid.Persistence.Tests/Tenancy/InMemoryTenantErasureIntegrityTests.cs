using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryTenantErasureIntegrityTests
{
    [Fact]
    public async Task Approval_and_reversal_preserve_trial_preseed_retry_metadata()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTenantAsync();
        for (int attempt = 1; attempt <= 5; attempt++)
        {
            int actual = await repository.IncrementTrialArchitecturePreseedAttemptAsync(
                tenantId, $"attempt {attempt} failure", CancellationToken.None);
            actual.Should().Be(attempt);
        }

        TenantRecord before = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        before.TrialArchitecturePreseedAttemptCount.Should().Be(5);
        before.TrialArchitecturePreseedFailedUtc.Should().NotBeNull();
        before.TrialArchitecturePreseedLastError.Should().Be("attempt 5 failure");

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        (await repository.TryStartTenantErasureOffboardAsync(
            tenantId, now, now.AddDays(30), CancellationToken.None)).Should().BeTrue();
        (await repository.TryApproveTenantErasureAsync(
            tenantId, now.AddMinutes(1), "operator", CancellationToken.None)).Should().BeTrue();

        TenantRecord approved = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        AssertPreserved(approved, before);
        approved.TenantErasureApprovedByUserId.Should().Be("operator");
        approved.TenantErasureApprovedUtc.Should().NotBeNull();

        (await repository.TryRevertTenantErasureApprovalAsync(
            tenantId, CancellationToken.None)).Should().BeTrue();

        TenantRecord reverted = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        AssertPreserved(reverted, before);
        reverted.TenantErasureApprovedByUserId.Should().BeNull();
        reverted.TenantErasureApprovedUtc.Should().BeNull();
        reverted.OffboardedUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task Canceled_erasure_mutations_and_purge_queries_have_no_effect()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTenantAsync();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        await repository.TryStartTenantErasureOffboardAsync(
            tenantId, now, now.AddDays(-1), CancellationToken.None);
        await repository.TryApproveTenantErasureAsync(
            tenantId, now, "operator", CancellationToken.None);
        await repository.TrySetTenantErasureLegalHoldAsync(
            tenantId, now.AddDays(4), now, "audit hold", "counsel", CancellationToken.None);

        TenantRecord before = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task>[] operations =
        [
            () => repository.TryApproveTenantErasureAsync(tenantId, now.AddHours(1), "other", canceled.Token),
            () => repository.TryRevertTenantErasureApprovalAsync(tenantId, canceled.Token),
            () => repository.TryStartTenantErasureOffboardAsync(tenantId, now, now.AddDays(2), canceled.Token),
            () => repository.TryRestoreTenantErasureQuarantineAsync(tenantId, canceled.Token),
            () => repository.TrySetTenantErasureLegalHoldAsync(
                tenantId, now.AddDays(20), now, "different", "other", canceled.Token),
            () => repository.TryClearTenantErasureLegalHoldAsync(tenantId, canceled.Token),
            () => repository.ListTenantIdsEligibleForScheduledHardPurgeAsync(
                now.AddDays(30), 10, canceled.Token),
            () => repository.ListTenantIdsForOrphanedCatalogCleanupAsync(
                now.AddDays(30), now.AddDays(30), 10, canceled.Token),
        ];

        foreach (Func<Task> operation in operations)
            await operation.Should().ThrowAsync<OperationCanceledException>();

        TenantRecord after = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        after.TenantErasureApprovedUtc.Should().Be(before.TenantErasureApprovedUtc);
        after.TenantErasureApprovedByUserId.Should().Be(before.TenantErasureApprovedByUserId);
        after.OffboardedUtc.Should().Be(before.OffboardedUtc);
        after.ErasureEligibleUtc.Should().Be(before.ErasureEligibleUtc);
        after.LegalHoldUntilUtc.Should().Be(before.LegalHoldUntilUtc);
        after.LegalHoldReason.Should().Be(before.LegalHoldReason);
        after.LegalHoldSetByUserId.Should().Be(before.LegalHoldSetByUserId);
    }

    [Fact]
    public async Task Canceled_mutations_on_unknown_tenant_do_not_succeed_silently()
    {
        InMemoryTenantRepository repository = new();
        Guid missing = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task>[] operations =
        [
            () => repository.TryApproveTenantErasureAsync(missing, now, "operator", canceled.Token),
            () => repository.TryRevertTenantErasureApprovalAsync(missing, canceled.Token),
            () => repository.TryStartTenantErasureOffboardAsync(missing, now, now, canceled.Token),
            () => repository.TryRestoreTenantErasureQuarantineAsync(missing, canceled.Token),
        ];

        foreach (Func<Task> operation in operations)
            await operation.Should().ThrowAsync<OperationCanceledException>();
    }

    private static void AssertPreserved(TenantRecord actual, TenantRecord original)
    {
        actual.TrialArchitecturePreseedAttemptCount.Should()
            .Be(original.TrialArchitecturePreseedAttemptCount);
        actual.TrialArchitecturePreseedFailedUtc.Should()
            .Be(original.TrialArchitecturePreseedFailedUtc);
        actual.TrialArchitecturePreseedLastError.Should()
            .Be(original.TrialArchitecturePreseedLastError);
    }

    private static async Task<(InMemoryTenantRepository Repository, Guid TenantId)> CreateTenantAsync()
    {
        InMemoryTenantRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        await repository.InsertTenantAsync(
            tenantId,
            "Aspects erasure preservation",
            "aspects-erasure-" + tenantId.ToString("N")[..10],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        return (repository, tenantId);
    }
}
