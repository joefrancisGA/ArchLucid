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
}
