using ArchLucid.Core.Authority;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Authority;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class NoTenantAuthorityPipelineConcurrencyGateTests
{
    [Fact]
    public async Task AcquireExecutionSlotAsync_returns_disabled_lease_without_inspecting_tenant_or_run()
    {
        NoTenantAuthorityPipelineConcurrencyGate sut = new();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        IAsyncDisposable lease = await sut.AcquireExecutionSlotAsync(
            tenantId,
            runId,
            failFastWhenUnavailable: true,
            CancellationToken.None);

        lease.Should().BeSameAs(NoTenantAuthorityPipelineConcurrencyGate.DisabledLease);

        await lease.DisposeAsync();
    }
}
