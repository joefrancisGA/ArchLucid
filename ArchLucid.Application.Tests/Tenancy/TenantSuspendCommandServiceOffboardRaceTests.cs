using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Application")]
public sealed class TenantSuspendCommandServiceOffboardRaceTests
{
    private static readonly Guid TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task TrySuspendAsync_returns_quarantine_when_offboard_completes_before_atomic_suspend()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 0, 0, 0, TimeSpan.Zero));
        TenantRecord active = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
        };
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TrySuspendAsync(TenantId, "u1", "admin", null, CancellationToken.None);

        outcome.Should().Be(TenantSuspendOutcome.InErasureQuarantine);
    }

    [Fact]
    public async Task TrySuspendAsync_returns_quarantine_when_offboard_completes_after_atomic_suspend_before_audit()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 1, 0, 0, TimeSpan.Zero));
        TenantRecord active = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
        };
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            SuspendedUtc = clock.GetUtcNow(),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TrySuspendAsync(TenantId, "u1", "admin", null, CancellationToken.None);

        outcome.Should().Be(TenantSuspendOutcome.InErasureQuarantine);
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySuspendAsync_returns_quarantine_without_audit_when_offboard_completes_after_post_suspend_read_before_audit()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 2, 0, 0, TimeSpan.Zero));
        DateTimeOffset now = clock.GetUtcNow();
        TenantRecord active = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
        };
        TenantRecord suspendedOnly = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            SuspendedUtc = now,
        };
        TenantRecord offboardedAfterRead = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            SuspendedUtc = now,
            OffboardedUtc = now,
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(suspendedOnly)
            .ReturnsAsync(offboardedAfterRead);
        tenants
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TrySuspendAsync(TenantId, "u1", "admin", null, CancellationToken.None);

        outcome.Should().Be(TenantSuspendOutcome.InErasureQuarantine);
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySuspendAsync_returns_quarantine_without_audit_when_offboard_completes_after_tenant_before_suspend_audit_read_before_audit()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 22, 4, 0, 0, TimeSpan.Zero));
        DateTimeOffset now = clock.GetUtcNow();
        TenantRecord active = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
        };
        TenantRecord suspendedOnly = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            SuspendedUtc = now,
        };
        TenantRecord offboardedAfterPreAppendRead = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            SuspendedUtc = now,
            OffboardedUtc = now,
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(suspendedOnly)
            .ReturnsAsync(suspendedOnly)
            .ReturnsAsync(offboardedAfterPreAppendRead);
        tenants
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TrySuspendAsync(TenantId, "u1", "admin", null, CancellationToken.None);

        outcome.Should().Be(TenantSuspendOutcome.InErasureQuarantine);
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryUnsuspendAsync_returns_quarantine_without_audit_when_offboard_completes_after_post_unsuspend_read_before_audit()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 3, 0, 0, TimeSpan.Zero));
        DateTimeOffset now = clock.GetUtcNow();
        TenantRecord suspended = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            SuspendedUtc = now.AddHours(-1),
        };
        TenantRecord unsuspendedOnly = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
        };
        TenantRecord offboardedAfterRead = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            OffboardedUtc = now,
            SuspendedUtc = now,
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(suspended)
            .ReturnsAsync(unsuspendedOnly)
            .ReturnsAsync(offboardedAfterRead);
        tenants
            .Setup(t => t.TryUnsuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TryUnsuspendAsync(TenantId, "u1", "admin", null, CancellationToken.None);

        outcome.Should().Be(TenantSuspendOutcome.InErasureQuarantine);
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryUnsuspendAsync_returns_quarantine_without_audit_when_offboard_completes_after_tenant_before_unsuspend_audit_read_before_audit()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 22, 5, 0, 0, TimeSpan.Zero));
        DateTimeOffset now = clock.GetUtcNow();
        TenantRecord suspended = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            SuspendedUtc = now.AddHours(-1),
        };
        TenantRecord unsuspendedOnly = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
        };
        TenantRecord offboardedAfterPreAppendRead = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            OffboardedUtc = now,
            SuspendedUtc = now,
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(suspended)
            .ReturnsAsync(unsuspendedOnly)
            .ReturnsAsync(unsuspendedOnly)
            .ReturnsAsync(offboardedAfterPreAppendRead);
        tenants
            .Setup(t => t.TryUnsuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TryUnsuspendAsync(TenantId, "u1", "admin", null, CancellationToken.None);

        outcome.Should().Be(TenantSuspendOutcome.InErasureQuarantine);
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
