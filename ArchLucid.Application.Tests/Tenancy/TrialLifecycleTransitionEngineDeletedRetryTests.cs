using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Application")]
public sealed class TrialLifecycleTransitionEngineDeletedRetryTests
{
    private sealed class FixedUtcTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    [Fact]
    public async Task TryAdvanceTenantAsync_when_already_deleted_and_purge_deletes_no_rows_returns_success()
    {
        Guid tenantId = Guid.NewGuid();
        TenantRecord deleted = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = DateTimeOffset.UtcNow,
            TrialStatus = TrialLifecycleStatus.Deleted,
            TrialExpiresUtc = DateTimeOffset.UtcNow,
        };

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(deleted);

        Mock<ITenantHardPurgeService> purge = new();
        purge
            .Setup(p => p.PurgeTenantAsync(tenantId, It.IsAny<TenantHardPurgeOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult { RowsDeleted = 0 });

        Mock<IAuditService> audit = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> opts = new();
        opts.Setup(m => m.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TrialLifecycleTransitionEngine engine = new(
            repo.Object,
            purge.Object,
            audit.Object,
            opts.Object,
            TimeProvider.System,
            NullLogger<TrialLifecycleTransitionEngine>.Instance);

        bool ok = await engine.TryAdvanceTenantAsync(tenantId, CancellationToken.None);

        ok.Should().BeTrue();
    }

    [Fact]
    public async Task TryAdvanceTenantAsync_skips_deleted_hard_purge_when_legal_hold_activated_before_purge()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 9, 1, 0, 0, 0, TimeSpan.Zero);
        TenantRecord deleted = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = now.AddDays(-90),
            TrialStatus = TrialLifecycleStatus.Deleted,
            TrialExpiresUtc = now.AddDays(-60),
        };
        TenantRecord deletedWithHold = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = now.AddDays(-90),
            TrialStatus = TrialLifecycleStatus.Deleted,
            TrialExpiresUtc = now.AddDays(-60),
            LegalHoldUntilUtc = now.AddDays(30),
        };

        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(deleted)
            .ReturnsAsync(deletedWithHold);

        Mock<ITenantHardPurgeService> purge = new();
        Mock<IAuditService> audit = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> opts = new();
        opts.Setup(m => m.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TrialLifecycleTransitionEngine engine = new(
            repo.Object,
            purge.Object,
            audit.Object,
            opts.Object,
            new FixedUtcTimeProvider(now),
            NullLogger<TrialLifecycleTransitionEngine>.Instance);

        bool ok = await engine.TryAdvanceTenantAsync(tenantId, CancellationToken.None);

        ok.Should().BeFalse();
        purge.Verify(
            p => p.PurgeTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryAdvanceTenantAsync_skips_deleted_hard_purge_when_offboard_completes_after_automation_gate_before_purge()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 9, 1, 0, 0, 0, TimeSpan.Zero);
        TenantRecord deleted = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = now.AddDays(-90),
            TrialStatus = TrialLifecycleStatus.Deleted,
            TrialExpiresUtc = now.AddDays(-60),
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = now.AddDays(-90),
            TrialStatus = TrialLifecycleStatus.Deleted,
            TrialExpiresUtc = now.AddDays(-60),
            OffboardedUtc = now.AddHours(-1),
        };

        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(deleted)
            .ReturnsAsync(deleted)
            .ReturnsAsync(offboarded);

        Mock<ITenantHardPurgeService> purge = new();
        Mock<IAuditService> audit = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> opts = new();
        opts.Setup(m => m.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TrialLifecycleTransitionEngine engine = new(
            repo.Object,
            purge.Object,
            audit.Object,
            opts.Object,
            new FixedUtcTimeProvider(now),
            NullLogger<TrialLifecycleTransitionEngine>.Instance);

        bool ok = await engine.TryAdvanceTenantAsync(tenantId, CancellationToken.None);

        ok.Should().BeTrue();
        purge.Verify(
            p => p.PurgeTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
