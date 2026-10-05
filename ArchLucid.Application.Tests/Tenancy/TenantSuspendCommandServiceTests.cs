using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

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
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantSuspended),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome outcome = await sut.TrySuspendAsync(TenantId, "u1", "admin", "corr", CancellationToken.None);

        Assert.Equal(TenantSuspendOutcome.Applied, outcome);
        tenants.Verify(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()), Times.Once);
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
        tenants.Verify(t => t.TrySuspendTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        audit.Verify(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TrySuspendAsync_concurrent_requests_audit_only_the_atomic_transition_winner()
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 8, 3, 12, 0, 0, TimeSpan.Zero));
        TaskCompletionSource<bool> bothReadsCompleted =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        int reads = 0;

        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                if (Interlocked.Increment(ref reads) == 2)
                    bothReadsCompleted.TrySetResult(true);

                await bothReadsCompleted.Task;
                return ActiveTenant();
            });
        tenants
            .SetupSequence(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantSuspended),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome[] outcomes = await Task.WhenAll(
            sut.TrySuspendAsync(TenantId, "u1", "admin", "corr-1", CancellationToken.None),
            sut.TrySuspendAsync(TenantId, "u2", "admin", "corr-2", CancellationToken.None));

        outcomes.Count(outcome => outcome == TenantSuspendOutcome.Applied).Should().Be(1);
        outcomes.Count(outcome => outcome == TenantSuspendOutcome.AlreadyInDesiredState).Should().Be(1);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantSuspended),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
    public async Task TryUnsuspendAsync_concurrent_requests_audit_only_the_atomic_transition_winner()
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 8, 3, 12, 0, 0, TimeSpan.Zero));
        TaskCompletionSource<bool> bothReadsCompleted =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        int reads = 0;

        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                if (Interlocked.Increment(ref reads) == 2)
                    bothReadsCompleted.TrySetResult(true);

                await bothReadsCompleted.Task;

                return new TenantRecord
                {
                    Id = TenantId,
                    Name = "Acme",
                    Slug = "acme",
                    Tier = TenantTier.Standard,
                    DataRegion = TenantDataRegions.Default,
                    CreatedUtc = clock.GetUtcNow().AddDays(-1),
                    SuspendedUtc = clock.GetUtcNow().AddHours(-1),
                };
            });
        tenants
            .SetupSequence(t => t.TryUnsuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantUnsuspended),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantSuspendCommandService sut = new(tenants.Object, audit.Object, clock);

        TenantSuspendOutcome[] outcomes = await Task.WhenAll(
            sut.TryUnsuspendAsync(TenantId, "u1", "admin", "corr-1", CancellationToken.None),
            sut.TryUnsuspendAsync(TenantId, "u2", "admin", "corr-2", CancellationToken.None));

        outcomes.Count(outcome => outcome == TenantSuspendOutcome.Applied).Should().Be(1);
        outcomes.Count(outcome => outcome == TenantSuspendOutcome.AlreadyInDesiredState).Should().Be(1);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantUnsuspended),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
