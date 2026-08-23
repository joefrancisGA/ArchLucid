using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantErasureCommandServiceRestoreTests
{
    [Fact]
    public async Task TryRestoreQuarantineAsync_clears_stale_erasure_approval()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 8, 23, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);

        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Restore Tenant",
            "restore-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        (await tenants.TryStartTenantErasureOffboardAsync(
                tenantId,
                now,
                now.AddDays(30),
                CancellationToken.None))
            .Should()
            .BeTrue();
        (await tenants.TryApproveTenantErasureAsync(tenantId, now, "admin@example.com", CancellationToken.None))
            .Should()
            .BeTrue();

        TenantErasureCommandService sut = CreateSut(tenants, clock);

        (await sut.TryRestoreQuarantineAsync(tenantId, "admin", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        TenantRecord? tenant = await tenants.GetByIdAsync(tenantId, CancellationToken.None);
        tenant.Should().NotBeNull();
        tenant!.OffboardedUtc.Should().BeNull();
        tenant.TenantErasureApprovedUtc.Should().BeNull();
        tenant.TenantErasureApprovedByUserId.Should().BeNull();
    }

    private static TenantErasureCommandService CreateSut(InMemoryTenantRepository tenants, TimeProvider clock)
    {
        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        return new TenantErasureCommandService(tenants, audit.Object, clock, options.Object);
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
