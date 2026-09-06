using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch7Tests
{
    [Fact]
    public async Task TenantErasureCommandService_offboard_approve_legal_hold_restore_and_clear()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 7, 20, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);

        Mock<ITenantRepository> tenants = new();
        TenantRecord active = new() { Id = tenantId };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            OffboardedUtc = now,
            ErasureEligibleUtc = now.AddDays(30),
        };
        TenantRecord withLegalHold = new()
        {
            Id = tenantId,
            OffboardedUtc = now,
            ErasureEligibleUtc = now.AddDays(30),
            TenantErasureApprovedUtc = now,
            LegalHoldUntilUtc = now.AddDays(3),
            LegalHoldReason = "hold",
        };

        tenants.SetupSequence(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(withLegalHold)
            .ReturnsAsync(withLegalHold)
            .ReturnsAsync(offboarded);

        tenants.Setup(t => t.TryStartTenantErasureOffboardAsync(tenantId, now, now.AddDays(14), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants.Setup(t => t.SuspendTenantAsync(tenantId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        tenants.Setup(t => t.TryApproveTenantErasureAsync(tenantId, now, "actor", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants.Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                now.AddDays(3),
                now,
                "hold",
                "actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants.Setup(t => t.TryClearTenantErasureLegalHoldAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants.Setup(t => t.TryRestoreTenantErasureQuarantineAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new();
        audit.Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { QuarantineDays = 14 });

        TenantErasureCommandService sut = new(tenants.Object, audit.Object, clock, options.Object);

        (await sut.TryOffboardTenantAsync(tenantId, "actor", "Actor", "corr", CancellationToken.None))
            .Should()
            .BeNull();

        TenantErasureOffboardResult? offboard = await sut.TryOffboardTenantAsync(
            tenantId,
            "actor",
            "Actor",
            "corr",
            CancellationToken.None);
        offboard.Should().NotBeNull();
        offboard!.OffboardedUtc.Should().Be(now);
        offboard.ErasureEligibleUtc.Should().Be(now.AddDays(14));

        (await sut.TryApproveErasureAsync(tenantId, "actor", "Actor", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                now.AddDays(3),
                "hold",
                "actor",
                "Actor",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        (await sut.TrySetLegalHoldAsync(
                tenantId,
                now.AddDays(3),
                "hold",
                "actor",
                "Actor",
                requireErasureQuarantine: true,
                "corr",
                CancellationToken.None))
            .Should()
            .BeTrue();

        (await sut.TryClearLegalHoldAsync(tenantId, "actor", "Actor", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        (await sut.TryRestoreQuarantineAsync(tenantId, "actor", "Actor", "corr", CancellationToken.None))
            .Should()
            .BeTrue();

        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Exactly(5));
    }

    [Fact]
    public async Task TenantErasureCommandService_returns_false_when_repository_cas_fails()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 7, 20, 15, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                OffboardedUtc = now,
                LegalHoldUntilUtc = now.AddDays(1),
            });
        tenants.Setup(t => t.TryApproveTenantErasureAsync(tenantId, now, "actor", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        tenants.Setup(t => t.TryClearTenantErasureLegalHoldAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        tenants.Setup(t => t.TryRestoreTenantErasureQuarantineAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        tenants.Setup(t => t.TrySetTenantErasureLegalHoldAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                now,
                It.IsAny<string?>(),
                "actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions());

        TenantErasureCommandService sut = new(
            tenants.Object,
            Mock.Of<IPlatformAuditRepository>(),
            clock,
            options.Object);

        (await sut.TryApproveErasureAsync(tenantId, "actor", "Actor", null, CancellationToken.None)).Should().BeFalse();
        (await sut.TryClearLegalHoldAsync(tenantId, "actor", "Actor", null, CancellationToken.None)).Should().BeFalse();
        (await sut.TryRestoreQuarantineAsync(tenantId, "actor", "Actor", null, CancellationToken.None)).Should().BeFalse();
        (await sut.TrySetLegalHoldAsync(
                tenantId,
                now.AddDays(2),
                null,
                "actor",
                "Actor",
                requireErasureQuarantine: false,
                null,
                CancellationToken.None))
            .Should()
            .BeFalse();
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
