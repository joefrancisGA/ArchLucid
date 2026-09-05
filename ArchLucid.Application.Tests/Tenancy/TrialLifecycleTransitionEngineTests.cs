using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class TrialLifecycleTransitionEngineTests
{
    private sealed class FixedUtcTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    [SkippableFact]
    public async Task TryAdvanceTenantAsync_when_repository_returns_false_does_not_audit()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset anchor = new(2026, 5, 1, 0, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Active,
            TrialExpiresUtc = anchor,
        };

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        repo.Setup(r => r.TryRecordTrialLifecycleTransitionAsync(
                tenantId,
                TrialLifecycleStatus.Active,
                TrialLifecycleStatus.Expired,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<ITenantHardPurgeService> purge = new();
        Mock<IAuditService> audit = new();

        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> opts = new();
        opts.Setup(m => m.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TrialLifecycleTransitionEngine engine = new(
            repo.Object,
            purge.Object,
            audit.Object,
            opts.Object,
            new FixedUtcTimeProvider(anchor),
            NullLogger<TrialLifecycleTransitionEngine>.Instance);

        bool ok = await engine.TryAdvanceTenantAsync(tenantId, CancellationToken.None);

        ok.Should().BeFalse();
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryAdvanceTenantAsync_when_transition_succeeds_audits_once()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset anchor = new(2026, 5, 1, 0, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Active,
            TrialExpiresUtc = anchor,
        };

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        repo.Setup(r => r.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink { WorkspaceId = Guid.NewGuid(), DefaultProjectId = Guid.NewGuid() });
        repo.Setup(r => r.TryRecordTrialLifecycleTransitionAsync(
                tenantId,
                TrialLifecycleStatus.Active,
                TrialLifecycleStatus.Expired,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ITenantHardPurgeService> purge = new();
        Mock<IAuditService> audit = new();

        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> opts = new();
        opts.Setup(m => m.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TrialLifecycleTransitionEngine engine = new(
            repo.Object,
            purge.Object,
            audit.Object,
            opts.Object,
            new FixedUtcTimeProvider(anchor),
            NullLogger<TrialLifecycleTransitionEngine>.Instance);

        bool ok = await engine.TryAdvanceTenantAsync(tenantId, CancellationToken.None);

        ok.Should().BeTrue();
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialLifecycleTransition),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryAdvanceTenantAsync_when_trial_status_is_lowercase_active_advances_on_expiry()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset anchor = new(2026, 5, 1, 0, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = "active",
            TrialExpiresUtc = anchor,
        };

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        repo.Setup(r => r.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink { WorkspaceId = Guid.NewGuid(), DefaultProjectId = Guid.NewGuid() });
        repo.Setup(r => r.TryRecordTrialLifecycleTransitionAsync(
                tenantId,
                TrialLifecycleStatus.Active,
                TrialLifecycleStatus.Expired,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ITenantHardPurgeService> purge = new();
        Mock<IAuditService> audit = new();

        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> opts = new();
        opts.Setup(m => m.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TrialLifecycleTransitionEngine engine = new(
            repo.Object,
            purge.Object,
            audit.Object,
            opts.Object,
            new FixedUtcTimeProvider(anchor),
            NullLogger<TrialLifecycleTransitionEngine>.Instance);

        bool ok = await engine.TryAdvanceTenantAsync(tenantId, CancellationToken.None);

        ok.Should().BeTrue();
    }

    [Fact]
    public async Task TryAdvanceTenantAsync_when_tenant_is_offboarded_does_not_advance_or_purge()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset trialExpires = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset now = new(2026, 9, 1, 0, 0, 0, TimeSpan.Zero);

        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "n",
            Slug = "s",
            Tier = TenantTier.Standard,
            CreatedUtc = trialExpires,
            TrialStatus = TrialLifecycleStatus.ExportOnly,
            TrialExpiresUtc = trialExpires,
            OffboardedUtc = now.AddDays(-30),
            LegalHoldUntilUtc = now.AddDays(30),
        };

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

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
        repo.Verify(
            r => r.TryRecordTrialLifecycleTransitionAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        purge.Verify(
            p => p.PurgeTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
