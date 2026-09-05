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
}
