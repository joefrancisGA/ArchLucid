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
        TenantRecord cleared = OffboardedTenant(tenantId, now);
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
    public async Task TryOffboardTenantAsync_returns_existing_quarantine_without_duplicate_audit_when_already_offboarded_retry()
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
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 30 });

        TenantErasureCommandService sut = new(
            tenants,
            audit.Object,
            clock,
            options.Object);

        TenantErasureOffboardResult? first = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);
        first.Should().NotBeNull();
        first!.OffboardedUtc.Should().Be(now);
        first.ErasureEligibleUtc.Should().Be(now.AddDays(30));

        TenantErasureOffboardResult? retry = await sut.TryOffboardTenantAsync(
            tenantId,
            "admin@example.com",
            "Admin",
            "corr",
            CancellationToken.None);
        retry.Should().NotBeNull();
        retry!.OffboardedUtc.Should().Be(first.OffboardedUtc);
        retry.ErasureEligibleUtc.Should().Be(first.ErasureEligibleUtc);

        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantErasureOffboarded),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
