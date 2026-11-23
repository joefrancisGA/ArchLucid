using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryEntraBindingAtomicityTests
{
    [Fact]
    public async Task Binding_a_directory_preserves_all_other_tenant_metadata()
    {
        InMemoryTenantRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        Guid entraId = Guid.NewGuid();
        await repository.InsertTenantAsync(
            tenantId, "Preserved tenant",
            "bind-preserve-" + tenantId.ToString("N")[..12],
            TenantTier.Enterprise, null, "westeurope", CancellationToken.None,
            enterpriseScimSeatsLimit: 3);
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        await repository.UpdateBaselineAsync(tenantId, 2.5m, 3, now, CancellationToken.None);
        await repository.IncrementTrialArchitecturePreseedAttemptAsync(
            tenantId, "preseed retry", CancellationToken.None);
        await repository.TrySetTenantErasureLegalHoldAsync(
            tenantId, now.AddDays(20), now, "preserve legal hold", "reviewer",
            CancellationToken.None);
        (await repository.TryIncrementEnterpriseScimSeatAsync(
            tenantId, CancellationToken.None)).Should().BeTrue();
        TenantRecord before = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;

        (await repository.UpdateEntraTenantIdAsync(
            tenantId, entraId, CancellationToken.None)).Should().BeTrue();

        TenantRecord after = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        after.EntraTenantId.Should().Be(entraId);
        after.DataRegion.Should().Be("westeurope");
        after.TrialArchitecturePreseedAttemptCount.Should().Be(1);
        after.TrialArchitecturePreseedLastError.Should().Be("preseed retry");
        after.BaselineManualPrepHoursPerReview.Should().Be(2.5m);
        after.BaselinePeoplePerReview.Should().Be(3);
        after.BaselineManualPrepCapturedUtc.Should().Be(now);
        after.LegalHoldReason.Should().Be("preserve legal hold");
        after.LegalHoldSetByUserId.Should().Be("reviewer");
        after.LegalHoldUntilUtc.Should().Be(now.AddDays(20));
        after.EnterpriseSeatsUsed.Should().Be(1);
        after.CreatedUtc.Should().Be(before.CreatedUtc);
        (await repository.GetByEntraTenantIdAsync(entraId, CancellationToken.None))!
            .Id.Should().Be(tenantId);
    }

    [Fact]
    public async Task Concurrent_tenants_cannot_claim_the_same_Entra_directory()
    {
        InMemoryTenantRepository repository = new();
        Guid first = Guid.NewGuid();
        Guid second = Guid.NewGuid();
        Guid directory = Guid.NewGuid();
        await repository.InsertTenantAsync(
            first, "A", "bind-a-" + first.ToString("N")[..12],
            TenantTier.Standard, null, "eastus", CancellationToken.None);
        await repository.InsertTenantAsync(
            second, "B", "bind-b-" + second.ToString("N")[..12],
            TenantTier.Standard, null, "westeurope", CancellationToken.None);

        Task<bool> left = Task.Run(() => repository.UpdateEntraTenantIdAsync(
            first, directory, CancellationToken.None));
        Task<bool> right = Task.Run(() => repository.UpdateEntraTenantIdAsync(
            second, directory, CancellationToken.None));
        bool[] result = await Task.WhenAll(left, right);

        result.Count(static bound => bound).Should().Be(1);
        TenantRecord winner = (await repository.GetByEntraTenantIdAsync(
            directory, CancellationToken.None))!;
        winner.Id.Should().Be(result[0] ? first : second);
        TenantRecord loser = (await repository.GetByIdAsync(
            result[0] ? second : first, CancellationToken.None))!;
        loser.EntraTenantId.Should().BeNull();
        (await repository.UpdateEntraTenantIdAsync(
            winner.Id, directory, CancellationToken.None)).Should().BeTrue();
    }

    [Fact]
    public async Task Cancelled_directory_binding_and_insertion_leave_no_registry_changes()
    {
        InMemoryTenantRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        Guid directory = Guid.NewGuid();
        await repository.InsertTenantAsync(
            tenantId, "C", "bind-c-" + tenantId.ToString("N")[..12],
            TenantTier.Standard, null, TenantDataRegions.Default, CancellationToken.None);
        using CancellationTokenSource cancellation = new();
        cancellation.Cancel();

        Func<Task> binding = () => repository.UpdateEntraTenantIdAsync(
            tenantId, directory, cancellation.Token);
        await binding.Should().ThrowAsync<OperationCanceledException>();
        (await repository.GetByIdAsync(tenantId, CancellationToken.None))!
            .EntraTenantId.Should().BeNull();
        (await repository.GetByEntraTenantIdAsync(directory, CancellationToken.None))
            .Should().BeNull();

        Guid canceledId = Guid.NewGuid();
        Func<Task> insertion = () => repository.InsertTenantAsync(
            canceledId, "D", "bind-d-" + canceledId.ToString("N")[..12],
            TenantTier.Standard, directory, "eastus", cancellation.Token);
        await insertion.Should().ThrowAsync<OperationCanceledException>();
        (await repository.GetByIdAsync(canceledId, CancellationToken.None)).Should().BeNull();
        (await repository.GetByEntraTenantIdAsync(directory, CancellationToken.None))
            .Should().BeNull();
    }

    [Fact]
    public async Task Duplicate_initial_Entra_binding_rolls_back_all_index_changes()
    {
        InMemoryTenantRepository repository = new();
        Guid directory = Guid.NewGuid();
        Guid first = Guid.NewGuid();
        Guid duplicate = Guid.NewGuid();
        string duplicateSlug = "bind-retry-" + duplicate.ToString("N")[..12];
        await repository.InsertTenantAsync(
            first, "A", "bind-existing-" + first.ToString("N")[..12],
            TenantTier.Standard, directory, "eastus", CancellationToken.None);

        Func<Task> duplicateInsert = () => repository.InsertTenantAsync(
            duplicate, "B", duplicateSlug,
            TenantTier.Standard, directory, "westeurope", CancellationToken.None);
        await duplicateInsert.Should().ThrowAsync<InvalidOperationException>();

        (await repository.GetByIdAsync(duplicate, CancellationToken.None)).Should().BeNull();
        (await repository.GetBySlugAsync(duplicateSlug, CancellationToken.None)).Should().BeNull();
        (await repository.GetByEntraTenantIdAsync(directory, CancellationToken.None))!
            .Id.Should().Be(first);
    }
}
