using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryEnterpriseSeatCancellationTests
{
    [Fact]
    public async Task Canceled_increment_and_decrement_preserve_enterprise_seat_usage()
    {
        InMemoryTenantRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        await repository.InsertTenantAsync(
            tenantId, "Enterprise test", "enterprise-" + tenantId.ToString("N")[..12],
            TenantTier.Enterprise, null, TenantDataRegions.Default, CancellationToken.None);

        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task> increment = () => repository.TryIncrementEnterpriseScimSeatAsync(
            tenantId, canceled.Token);
        await increment.Should().ThrowAsync<OperationCanceledException>();
        (await repository.GetByIdAsync(tenantId, CancellationToken.None))!
            .EnterpriseSeatsUsed.Should().Be(0);

        (await repository.TryIncrementEnterpriseScimSeatAsync(
            tenantId, CancellationToken.None)).Should().BeTrue();
        (await repository.GetByIdAsync(tenantId, CancellationToken.None))!
            .EnterpriseSeatsUsed.Should().Be(1);

        Func<Task> decrement = () => repository.DecrementEnterpriseScimSeatAsync(
            tenantId, canceled.Token);
        await decrement.Should().ThrowAsync<OperationCanceledException>();
        (await repository.GetByIdAsync(tenantId, CancellationToken.None))!
            .EnterpriseSeatsUsed.Should().Be(1);

        await repository.DecrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None);
        (await repository.GetByIdAsync(tenantId, CancellationToken.None))!
            .EnterpriseSeatsUsed.Should().Be(0);
    }

    [Fact]
    public async Task Canceled_calls_for_missing_tenant_propagate_cancellation()
    {
        InMemoryTenantRepository repository = new();
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task> increment = () => repository.TryIncrementEnterpriseScimSeatAsync(
            Guid.NewGuid(), canceled.Token);
        Func<Task> decrement = () => repository.DecrementEnterpriseScimSeatAsync(
            Guid.NewGuid(), canceled.Token);

        await increment.Should().ThrowAsync<OperationCanceledException>();
        await decrement.Should().ThrowAsync<OperationCanceledException>();
    }
}
