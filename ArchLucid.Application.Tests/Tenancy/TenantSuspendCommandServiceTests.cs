using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class TenantSuspendCommandServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public async Task TrySuspendAsync_applies_when_active()
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 8, 3, 12, 0, 0, TimeSpan.Zero));

        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ActiveTenant());
        tenants
            .Setup(t => t.SuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantSuspended),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TrySuspendAsync(TenantId, "u1", "admin", "corr", CancellationToken.None);

        Assert.Equal(TenantSuspendOutcome.Applied, outcome);
        tenants.Verify(t => t.SuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TrySuspendAsync_is_idempotent_when_already_suspended()
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 8, 3, 12, 0, 0, TimeSpan.Zero));

        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = TenantId,
                    Name = "Acme",
                    Slug = "acme",
                    Tier = TenantTier.Standard,
                    DataRegion = TenantDataRegions.Default,
                    CreatedUtc = clock.GetUtcNow().AddDays(-1),
                    SuspendedUtc = clock.GetUtcNow(),
                });

        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TrySuspendAsync(TenantId, "u1", "admin", null, CancellationToken.None);

        Assert.Equal(TenantSuspendOutcome.AlreadyInDesiredState, outcome);
        tenants.Verify(t => t.SuspendTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        audit.Verify(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TryUnsuspendAsync_clears_when_suspended()
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 8, 3, 12, 0, 0, TimeSpan.Zero));

        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = TenantId,
                    Name = "Acme",
                    Slug = "acme",
                    Tier = TenantTier.Standard,
                    DataRegion = TenantDataRegions.Default,
                    CreatedUtc = clock.GetUtcNow().AddDays(-1),
                    SuspendedUtc = clock.GetUtcNow().AddHours(-1),
                });
        tenants
            .Setup(t => t.TryUnsuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantUnsuspended),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TryUnsuspendAsync(TenantId, "u1", "admin", "corr", CancellationToken.None);

        Assert.Equal(TenantSuspendOutcome.Applied, outcome);
    }

    [Fact]
    public async Task TrySuspendAsync_refuses_erasure_quarantine()
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        FakeTimeProvider clock = new();

        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = TenantId,
                    Name = "Acme",
                    Slug = "acme",
                    Tier = TenantTier.Standard,
                    DataRegion = TenantDataRegions.Default,
                    CreatedUtc = clock.GetUtcNow().AddDays(-1),
                    OffboardedUtc = clock.GetUtcNow(),
                });

        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TrySuspendAsync(TenantId, "u1", "admin", null, CancellationToken.None);

        Assert.Equal(TenantSuspendOutcome.InErasureQuarantine, outcome);
    }

    private static TenantRecord ActiveTenant() =>
        new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
        };
}
