using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

using System.Text.Json;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantErasureCommandServiceIdempotentRetryTests
{
    [Fact]
    public async Task TryRestoreQuarantineAsync_concurrent_requests_return_success_without_duplicate_audit_when_race_loses_atomic_transition()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 5, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);
        TaskCompletionSource<bool> bothReadsCompleted =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        int reads = 0;

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                if (Interlocked.Increment(ref reads) == 2)
                    bothReadsCompleted.TrySetResult(true);

                if (reads <= 2)
                {
                    await bothReadsCompleted.Task;
                    return offboarded;
                }

                return restored;
            });
        tenants
            .SetupSequence(t => t.TryRestoreTenantErasureQuarantineAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureQuarantineRestored),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        bool[] outcomes = await Task.WhenAll(
            sut.TryRestoreQuarantineAsync(tenantId, "u1", "Admin", "corr-1", CancellationToken.None),
            sut.TryRestoreQuarantineAsync(tenantId, "u2", "Admin", "corr-2", CancellationToken.None));

        outcomes.Should().OnlyContain(result => result);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureQuarantineRestored),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryRestoreQuarantineAsync_returns_success_without_audit_when_offboard_completes_after_atomic_restore()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 15, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord offboardedAgain = OffboardedTenant(tenantId, now.AddMinutes(1));

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboardedAgain);
        tenants
            .Setup(t => t.TryRestoreTenantErasureQuarantineAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryRestoreQuarantineAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryRestoreQuarantineAsync_returns_success_without_audit_when_offboard_completes_after_post_restore_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 21, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);
        TenantRecord offboardedAgain = OffboardedTenant(tenantId, now.AddMinutes(2));

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored)
            .ReturnsAsync(offboardedAgain);
        tenants
            .Setup(t => t.TryRestoreTenantErasureQuarantineAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryRestoreQuarantineAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryRestoreQuarantineAsync_returns_success_without_audit_when_offboard_completes_after_pre_restore_audit_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 14, 20, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);
        TenantRecord offboardedAgain = OffboardedTenant(tenantId, now.AddMinutes(2));

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored)
            .ReturnsAsync(restored)
            .ReturnsAsync(offboardedAgain);
        tenants
            .Setup(t => t.TryRestoreTenantErasureQuarantineAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryRestoreQuarantineAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureQuarantineRestored),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryRestoreQuarantineAsync_returns_success_without_audit_when_offboard_completes_after_tenant_before_restore_audit_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 22, 4, 10, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);
        TenantRecord offboardedAgain = OffboardedTenant(tenantId, now.AddMinutes(2));

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored)
            .ReturnsAsync(restored)
            .ReturnsAsync(restored)
            .ReturnsAsync(offboardedAgain);
        tenants
            .Setup(t => t.TryRestoreTenantErasureQuarantineAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryRestoreQuarantineAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureQuarantineRestored),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryRestoreQuarantineAsync_returns_success_without_duplicate_audit_when_already_restored_retry()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 6, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Restore Org",
            "restore-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await tenants.TryStartTenantErasureOffboardAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(29),
            CancellationToken.None);

        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryRestoreQuarantineAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        (await sut.TryRestoreQuarantineAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureQuarantineRestored),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryClearLegalHoldAsync_returns_success_without_duplicate_audit_when_already_cleared_retry()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Hold Org",
            "hold-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await tenants.TryStartTenantErasureOffboardAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(29),
            CancellationToken.None);
        (await tenants.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                now,
                "litigation",
                "counsel@example.com",
                CancellationToken.None))
            .Should()
            .BeTrue();
        (await tenants.TryClearTenantErasureLegalHoldAsync(tenantId, CancellationToken.None))
            .Should()
            .BeTrue();

        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryClearLegalHoldAsync(tenantId, "counsel@example.com", "Counsel", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldCleared),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryClearLegalHoldAsync_concurrent_requests_return_success_without_duplicate_audit_when_race_loses_atomic_transition()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 5, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord withHold = TenantWithLegalHold(tenantId, now, holdUntil);
        TenantRecord cleared = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
        };
        TaskCompletionSource<bool> bothReadsCompleted =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        int reads = 0;

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                if (Interlocked.Increment(ref reads) == 2)
                    bothReadsCompleted.TrySetResult(true);

                if (reads <= 2)
                {
                    await bothReadsCompleted.Task;
                    return withHold;
                }

                return cleared;
            });
        tenants
            .SetupSequence(t => t.TryClearTenantErasureLegalHoldAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldCleared),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        bool[] outcomes = await Task.WhenAll(
            sut.TryClearLegalHoldAsync(tenantId, "u1", "Counsel", "corr-1", CancellationToken.None),
            sut.TryClearLegalHoldAsync(tenantId, "u2", "Counsel", "corr-2", CancellationToken.None));

        outcomes.Should().OnlyContain(result => result);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldCleared),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryClearLegalHoldAsync_returns_success_without_audit_when_legal_hold_set_after_atomic_clear()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 16, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord withHold = TenantWithLegalHold(tenantId, now, holdUntil);
        TenantRecord holdReplaced = TenantWithLegalHold(tenantId, now, holdUntil.AddDays(7));

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(withHold)
            .ReturnsAsync(holdReplaced);
        tenants
            .Setup(t => t.TryClearTenantErasureLegalHoldAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryClearLegalHoldAsync(tenantId, "counsel@example.com", "Counsel", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryClearLegalHoldAsync_returns_success_without_audit_when_legal_hold_set_after_post_clear_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 23, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord withHold = TenantWithLegalHold(tenantId, now, holdUntil);
        TenantRecord holdCleared = OffboardedTenant(tenantId, now);
        TenantRecord holdReapplied = TenantWithLegalHold(tenantId, now, holdUntil.AddDays(3));

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(withHold)
            .ReturnsAsync(holdCleared)
            .ReturnsAsync(holdReapplied);
        tenants
            .Setup(t => t.TryClearTenantErasureLegalHoldAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryClearLegalHoldAsync(tenantId, "counsel@example.com", "Counsel", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryClearLegalHoldAsync_returns_success_without_audit_when_offboard_completes_after_pre_audit_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 14, 14, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord withHold = TenantWithLegalHold(tenantId, now, holdUntil);
        TenantRecord holdCleared = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
        };
        TenantRecord offboarded = OffboardedTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(withHold)
            .ReturnsAsync(holdCleared)
            .ReturnsAsync(holdCleared)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(t => t.TryClearTenantErasureLegalHoldAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryClearLegalHoldAsync(tenantId, "counsel@example.com", "Counsel", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldCleared),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryClearLegalHoldAsync_returns_success_without_audit_when_legal_hold_reapplied_after_pre_clear_audit_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 14, 19, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord withHold = TenantWithLegalHold(tenantId, now, holdUntil);
        TenantRecord holdCleared = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
        };
        TenantRecord holdReapplied = TenantWithLegalHold(tenantId, now, holdUntil.AddDays(3));

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(withHold)
            .ReturnsAsync(holdCleared)
            .ReturnsAsync(holdCleared)
            .ReturnsAsync(holdReapplied);
        tenants
            .Setup(t => t.TryClearTenantErasureLegalHoldAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryClearLegalHoldAsync(tenantId, "counsel@example.com", "Counsel", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldCleared),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryClearLegalHoldAsync_returns_success_without_audit_when_legal_hold_reapplied_after_tenant_before_clear_audit_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 22, 4, 22, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord withHold = TenantWithLegalHold(tenantId, now, holdUntil);
        TenantRecord holdCleared = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
        };
        TenantRecord holdReapplied = TenantWithLegalHold(tenantId, now, holdUntil.AddDays(3));

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(withHold)
            .ReturnsAsync(holdCleared)
            .ReturnsAsync(holdCleared)
            .ReturnsAsync(holdCleared)
            .ReturnsAsync(holdReapplied);
        tenants
            .Setup(t => t.TryClearTenantErasureLegalHoldAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryClearLegalHoldAsync(tenantId, "counsel@example.com", "Counsel", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldCleared),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_concurrent_identical_requests_return_success_without_duplicate_audit_when_race_loses_atomic_transition()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 5, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Hold Org",
            "hold-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await tenants.TryStartTenantErasureOffboardAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(29),
            CancellationToken.None);

        int auditAppends = 0;
        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                Interlocked.Increment(ref auditAppends);
                return Task.CompletedTask;
            });

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        bool[] outcomes = await Task.WhenAll(
            Enumerable.Range(0, 16)
                .Select(_ => sut.TrySetLegalHoldAsync(
                    tenantId,
                    holdUntil,
                    "litigation",
                    "counsel@example.com",
                    "Counsel",
                    requireErasureQuarantine: true,
                    "corr",
                    CancellationToken.None))
                .ToArray());

        outcomes.Should().OnlyContain(result => result);
        auditAppends.Should().Be(1);
    }

    [Fact]
    public async Task TryApproveErasureAsync_concurrent_requests_return_success_without_duplicate_audit_when_race_loses_atomic_transition()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 5, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Erase Org",
            "erase-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await tenants.TryStartTenantErasureOffboardAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(29),
            CancellationToken.None);

        int auditAppends = 0;
        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                Interlocked.Increment(ref auditAppends);
                return Task.CompletedTask;
            });

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        bool[] outcomes = await Task.WhenAll(
            Enumerable.Range(0, 16)
                .Select(_ => sut.TryApproveErasureAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
                .ToArray());

        outcomes.Should().OnlyContain(result => result);
        auditAppends.Should().Be(1);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_when_quarantine_restored_before_atomic_set_for_platform_operator()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 14, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "platform@example.com",
                "Platform",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_when_quarantine_restored_before_atomic_set_with_quarantine_required()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 13, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_audit_when_quarantine_restored_after_atomic_set_with_quarantine_required()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 14, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_audit_when_quarantine_restored_after_post_set_read_before_audit_with_quarantine_required()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 14, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord offboardedWithHold = TenantWithLegalHold(tenantId, now, holdUntil);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboardedWithHold)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_audit_when_quarantine_restored_after_pre_set_audit_read_before_audit_with_quarantine_required()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 14, 17, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord offboardedWithHold = TenantWithLegalHold(tenantId, now, holdUntil);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboardedWithHold)
            .ReturnsAsync(offboardedWithHold)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_audit_when_quarantine_restored_after_tenant_before_set_audit_append_read_before_audit_with_quarantine_required()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 22, 4, 32, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord offboardedWithHold = TenantWithLegalHold(tenantId, now, holdUntil);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboardedWithHold)
            .ReturnsAsync(offboardedWithHold)
            .ReturnsAsync(offboardedWithHold)
            .ReturnsAsync(offboardedWithHold)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_audit_when_legal_hold_cleared_after_post_set_read_before_audit_for_platform_operator()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 14, 1, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord active = ActiveTenant(tenantId, now);
        TenantRecord activeWithHold = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            LegalHoldUntilUtc = holdUntil,
            LegalHoldReason = "litigation",
        };
        TenantRecord holdCleared = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(activeWithHold)
            .ReturnsAsync(holdCleared);
        tenants
            .Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_audit_when_legal_hold_cleared_after_tenant_before_set_audit_read_before_audit_for_platform_operator()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 22, 4, 28, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord active = ActiveTenant(tenantId, now);
        TenantRecord activeWithHold = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            LegalHoldUntilUtc = holdUntil,
            LegalHoldReason = "litigation",
        };
        TenantRecord holdCleared = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(activeWithHold)
            .ReturnsAsync(activeWithHold)
            .ReturnsAsync(activeWithHold)
            .ReturnsAsync(holdCleared);
        tenants
            .Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_audit_when_legal_hold_cleared_after_pre_set_audit_read_before_audit_for_platform_operator()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 14, 18, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        TenantRecord active = ActiveTenant(tenantId, now);
        TenantRecord activeWithHold = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            LegalHoldUntilUtc = holdUntil,
            LegalHoldReason = "litigation",
        };
        TenantRecord holdCleared = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(activeWithHold)
            .ReturnsAsync(activeWithHold)
            .ReturnsAsync(holdCleared);
        tenants
            .Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                holdUntil,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryApproveErasureAsync_returns_success_when_quarantine_restored_before_atomic_approve()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TryApproveTenantErasureAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryApproveErasureAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();
    }

    [Fact]
    public async Task TryApproveErasureAsync_returns_success_without_audit_when_quarantine_restored_after_atomic_approve()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 13, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TryApproveTenantErasureAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryApproveErasureAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryApproveErasureAsync_returns_success_without_audit_when_quarantine_restored_after_post_approve_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 22, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord approvedStillOffboarded = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            OffboardedUtc = now.AddDays(-1),
            ErasureEligibleUtc = now.AddDays(29),
            TenantErasureApprovedUtc = now,
        };
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(approvedStillOffboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TryApproveTenantErasureAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryApproveErasureAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryApproveErasureAsync_returns_success_without_audit_when_quarantine_restored_after_pre_approve_audit_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 14, 16, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord approvedStillOffboarded = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            OffboardedUtc = now.AddDays(-1),
            ErasureEligibleUtc = now.AddDays(29),
            TenantErasureApprovedUtc = now,
        };
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(approvedStillOffboarded)
            .ReturnsAsync(approvedStillOffboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TryApproveTenantErasureAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryApproveErasureAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureApproved),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryApproveErasureAsync_returns_success_without_audit_when_quarantine_restored_after_tenant_before_approve_audit_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 22, 4, 5, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord approvedStillOffboarded = new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            OffboardedUtc = now.AddDays(-1),
            ErasureEligibleUtc = now.AddDays(29),
            TenantErasureApprovedUtc = now,
        };
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(approvedStillOffboarded)
            .ReturnsAsync(approvedStillOffboarded)
            .ReturnsAsync(approvedStillOffboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TryApproveTenantErasureAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryApproveErasureAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureApproved),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryApproveErasureAsync_returns_success_without_duplicate_audit_when_already_approved_retry()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Erase Org",
            "erase-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await tenants.TryStartTenantErasureOffboardAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(29),
            CancellationToken.None);
        (await tenants.TryApproveTenantErasureAsync(tenantId, now, "admin@example.com", CancellationToken.None))
            .Should()
            .BeTrue();

        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        (await sut.TryApproveErasureAsync(tenantId, "admin@example.com", "Admin", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryOffboardTenantAsync_returns_null_without_audit_when_quarantine_restored_before_idempotent_side_effects()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 18, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        TenantErasureOffboardResult? result = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);

        result.Should().BeNull();
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryOffboardTenantAsync_returns_null_without_audit_when_quarantine_restored_after_atomic_offboard_start()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 17, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord active = ActiveTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TryStartTenantErasureOffboardAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .Setup(t => t.SuspendTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        TenantErasureOffboardResult? result = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);

        result.Should().BeNull();
        tenants.Verify(
            t => t.SuspendTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryOffboardTenantAsync_returns_null_without_audit_when_quarantine_restored_after_pre_audit_read_before_first_offboard_audit_append()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 21, 19, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord active = ActiveTenant(tenantId, now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TryStartTenantErasureOffboardAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .Setup(t => t.SuspendTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        TenantErasureOffboardResult? result = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);

        result.Should().BeNull();
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryOffboardTenantAsync_returns_null_without_audit_when_quarantine_restored_after_immediately_before_offboard_audit_read_before_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 22, 4, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord active = ActiveTenant(tenantId, now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TryStartTenantErasureOffboardAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .Setup(t => t.SuspendTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        TenantErasureOffboardResult? result = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);

        result.Should().BeNull();
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryOffboardTenantAsync_returns_null_without_audit_when_quarantine_restored_after_post_start_read_before_first_offboard_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 19, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord active = ActiveTenant(tenantId, now);
        TenantRecord offboarded = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.TryStartTenantErasureOffboardAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .Setup(t => t.SuspendTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        TenantErasureOffboardResult? result = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);

        result.Should().BeNull();
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryOffboardTenantAsync_returns_null_without_audit_when_quarantine_restored_after_idempotent_suspend_before_offboard_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 13, 20, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        TenantRecord offboardedUnsuspended = OffboardedTenant(tenantId, now);
        TenantRecord restored = ActiveTenant(tenantId, now);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboardedUnsuspended)
            .ReturnsAsync(offboardedUnsuspended)
            .ReturnsAsync(restored);
        tenants
            .Setup(t => t.SuspendTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        TenantErasureCommandService sut = new(
            tenants.Object,
            audit.Object,
            clock,
            options.Object);

        TenantErasureOffboardResult? result = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);

        result.Should().BeNull();
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryOffboardTenantAsync_retries_failed_audit_with_same_event_id_when_already_suspended()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 5, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Offboard Org",
            "offboard-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        Mock<IPlatformAuditRepository> audit = new();
        List<Guid> auditEventIds = [];
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<PlatformAuditEvent, CancellationToken>((auditEvent, _) => auditEventIds.Add(auditEvent.EventId))
            .Returns(() => auditEventIds.Count == 1
                ? Task.FromException(new InvalidOperationException("Audit storage unavailable."))
                : Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None));
        (await tenants.GetByIdAsync(tenantId, CancellationToken.None))!.SuspendedUtc.Should().NotBeNull();

        TenantErasureOffboardResult? retry = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);
        retry.Should().NotBeNull();
        retry!.OffboardedUtc.Should().Be(now);
        retry.ErasureEligibleUtc.Should().Be(now.AddDays(30));

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureOffboarded),
                It.IsAny<CancellationToken>()),
            Times.Exactly(2));
        auditEventIds.Should().HaveCount(2);
        auditEventIds[1].Should().Be(auditEventIds[0]);
    }

    [Fact]
    public async Task TryOffboardTenantAsync_offboard_audit_quarantine_days_matches_eligibility_window()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 10, 31, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Audit Quarantine Org",
            "audit-q-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        string? capturedDataJson = null;
        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<PlatformAuditEvent, CancellationToken>((auditEvent, _) => capturedDataJson = auditEvent.DataJson)
            .Returns(Task.CompletedTask);

        const int configuredQuarantineDays = 14;
        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = configuredQuarantineDays });

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        TenantErasureOffboardResult? result = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.ErasureEligibleUtc.Should().Be(now.AddDays(configuredQuarantineDays));
        capturedDataJson.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(capturedDataJson!);
        document.RootElement.GetProperty("quarantineDays").GetInt32().Should().Be(configuredQuarantineDays);
    }

    [Fact]
    public async Task TryOffboardTenantAsync_resumes_suspend_and_audit_when_marker_exists_without_suspension()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset offboardedUtc = new(2026, 10, 5, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset eligibleUtc = offboardedUtc.AddDays(30);
        FakeTimeProvider clock = new(offboardedUtc);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Partial Offboard",
            "partial-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        (await tenants.TryStartTenantErasureOffboardAsync(
                tenantId,
                offboardedUtc,
                eligibleUtc,
                CancellationToken.None))
            .Should()
            .BeTrue();

        Mock<IPlatformAuditRepository> audit = new();
        List<Guid> auditEventIds = [];
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<PlatformAuditEvent, CancellationToken>((auditEvent, _) => auditEventIds.Add(auditEvent.EventId))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        TenantErasureOffboardResult? resumed = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);

        resumed.Should().NotBeNull();
        resumed!.OffboardedUtc.Should().Be(offboardedUtc);
        resumed.ErasureEligibleUtc.Should().Be(eligibleUtc);
        (await tenants.GetByIdAsync(tenantId, CancellationToken.None))!.SuspendedUtc.Should().NotBeNull();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureOffboarded),
                It.IsAny<CancellationToken>()),
            Times.Once);

        await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e =>
                    e.EventType == AuditEventTypes.TenantErasureOffboarded),
                It.IsAny<CancellationToken>()),
            Times.Exactly(2));
        auditEventIds.Should().HaveCount(2);
        auditEventIds[1].Should().Be(auditEventIds[0]);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_duplicate_audit_when_identical_operator_retry()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Hold Org",
            "hold-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await tenants.TryStartTenantErasureOffboardAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(29),
            CancellationToken.None);

        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_duplicate_audit_when_reason_differs_only_by_surrounding_whitespace()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Hold Org",
            "hold-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "  litigation  ",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_duplicate_audit_when_reason_differs_only_by_internal_whitespace()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Hold Org",
            "hold-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation hold",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation  hold",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_duplicate_audit_when_until_utc_differs_only_by_offset()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntilUtc = new(2026, 10, 20, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntilSameInstantLocal =
            new(2026, 10, 20, 5, 0, 0, TimeSpan.FromHours(5));
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Hold Org",
            "hold-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntilUtc,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntilSameInstantLocal,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: false,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TrySetLegalHoldAsync_returns_success_without_duplicate_audit_when_reason_differs_only_by_casing()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset holdUntil = now.AddDays(14);
        FakeTimeProvider clock = new(now);
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            tenantId,
            "Hold Org",
            "hold-org-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await tenants.TryStartTenantErasureOffboardAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(29),
            CancellationToken.None);

        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "litigation",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                holdUntil,
                "LITIGATION",
                "counsel@example.com",
                "Counsel",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureLegalHoldSet),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private static TenantRecord ActiveTenant(Guid tenantId, DateTimeOffset now) =>
        new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
        };

    private static TenantRecord OffboardedTenant(Guid tenantId, DateTimeOffset now) =>
        new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            OffboardedUtc = now.AddDays(-1),
            ErasureEligibleUtc = now.AddDays(29),
        };

    private static TenantRecord TenantWithLegalHold(Guid tenantId, DateTimeOffset now, DateTimeOffset holdUntil) =>
        new()
        {
            Id = tenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            OffboardedUtc = now.AddDays(-1),
            ErasureEligibleUtc = now.AddDays(29),
            LegalHoldUntilUtc = holdUntil,
            LegalHoldReason = "litigation",
        };
}
