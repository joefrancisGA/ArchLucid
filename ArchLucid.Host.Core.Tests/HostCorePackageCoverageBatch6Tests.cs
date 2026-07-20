using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch6Tests
{
    [Fact]
    public async Task TenantErasureEligiblePurgeBackgroundWork_disabled_and_purge_paths()
    {
        Mock<IOptionsMonitor<TenantErasurePurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new TenantErasurePurgeOptions { Enabled = false });

        await TenantErasureEligiblePurgeBackgroundWork.RunSinglePassAsync(
            new ServiceCollection().BuildServiceProvider().GetRequiredService<IServiceScopeFactory>(),
            options.Object,
            NullLogger.Instance,
            CancellationToken.None);

        Guid eligibleId = Guid.NewGuid();
        Guid ineligibleId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 7, 20, 12, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.ListTenantIdsEligibleForScheduledHardPurgeAsync(now, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync([eligibleId, ineligibleId]);
        tenants.Setup(t => t.GetByIdAsync(eligibleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = eligibleId,
                    OffboardedUtc = now.AddDays(-40),
                    ErasureEligibleUtc = now.AddDays(-1),
                    TenantErasureApprovedUtc = now.AddDays(-2),
                });
        tenants.Setup(t => t.GetByIdAsync(ineligibleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = ineligibleId });

        Mock<ITenantDeletionService> deletion = new();
        deletion.Setup(d => d.DeleteTenantAsync(
                eligibleId,
                It.IsAny<TenantDeletionInvocation>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantDeletionResult { TenantId = eligibleId });

        options.Setup(o => o.CurrentValue).Returns(
            new TenantErasurePurgeOptions { Enabled = true, BatchSize = 10 });

        await TenantErasureEligiblePurgeBackgroundWork.RunSinglePassAsync(
            BuildScopeFactory(tenants.Object, deletion.Object, new FakeTimeProvider(now)),
            options.Object,
            NullLogger.Instance,
            CancellationToken.None);

        deletion.Verify(
            d => d.DeleteTenantAsync(eligibleId, It.IsAny<TenantDeletionInvocation>(), It.IsAny<CancellationToken>()),
            Times.Once);
        deletion.Verify(
            d => d.DeleteTenantAsync(ineligibleId, It.IsAny<TenantDeletionInvocation>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task OrphanedTenantCatalogCleanupBackgroundWork_skips_legal_hold_and_purges_eligible()
    {
        Guid purgeId = Guid.NewGuid();
        Guid holdId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 7, 20, 12, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.ListTenantIdsForOrphanedCatalogCleanupAsync(
                now,
                now.AddDays(-30),
                5,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([purgeId, holdId]);
        tenants.Setup(t => t.GetByIdAsync(purgeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = purgeId,
                    TenantErasureApprovedUtc = now.AddDays(-40),
                    TenantErasureRequestedUtc = now.AddDays(-40),
                });
        tenants.Setup(t => t.GetByIdAsync(holdId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = holdId,
                    TenantErasureApprovedUtc = now.AddDays(-40),
                    TenantErasureRequestedUtc = now.AddDays(-40),
                    LegalHoldUntilUtc = now.AddDays(3),
                });

        Mock<ITenantDeletionService> deletion = new();
        deletion.Setup(d => d.DeleteTenantAsync(
                purgeId,
                It.IsAny<TenantDeletionInvocation>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantDeletionResult { TenantId = purgeId });

        Mock<IOptionsMonitor<OrphanedTenantCatalogCleanupOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(
            new OrphanedTenantCatalogCleanupOptions
            {
                Enabled = true,
                RetentionDays = 30,
                MaxCatalogsPerHour = 5,
            });

        await OrphanedTenantCatalogCleanupBackgroundWork.RunSinglePassAsync(
            BuildScopeFactory(tenants.Object, deletion.Object, new FakeTimeProvider(now)),
            options.Object,
            NullLogger.Instance,
            CancellationToken.None);

        deletion.Verify(
            d => d.DeleteTenantAsync(purgeId, It.IsAny<TenantDeletionInvocation>(), It.IsAny<CancellationToken>()),
            Times.Once);
        deletion.Verify(
            d => d.DeleteTenantAsync(holdId, It.IsAny<TenantDeletionInvocation>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SampleRunAndDraftIntake_ttl_passes_invoke_services_when_enabled()
    {
        Mock<ISampleRunPurgeService> samplePurge = new();
        samplePurge.Setup(s => s.PurgeExpiredAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SampleRunPurgeResult());

        Mock<IDraftIntakeReaperService> draftReaper = new();
        draftReaper.Setup(s => s.PurgeExpiredTerminalDraftsAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DraftIntakeReaperResult());

        ServiceCollection services = new();
        services.AddSingleton(samplePurge.Object);
        services.AddSingleton(draftReaper.Object);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        Mock<IOptionsMonitor<SampleRunPurgeOptions>> sampleOptions = new();
        sampleOptions.Setup(o => o.CurrentValue).Returns(new SampleRunPurgeOptions { Enabled = true, TtlDays = 7 });

        Mock<IOptionsMonitor<DraftIntakeReaperOptions>> draftOptions = new();
        draftOptions.Setup(o => o.CurrentValue).Returns(new DraftIntakeReaperOptions { Enabled = true, TtlDays = 14 });

        await SampleRunPurgeBackgroundWork.RunTtlPassAsync(
            scopeFactory,
            sampleOptions.Object,
            NullLogger.Instance,
            CancellationToken.None);
        await DraftIntakeReaperBackgroundWork.RunTtlPassAsync(
            scopeFactory,
            draftOptions.Object,
            NullLogger.Instance,
            CancellationToken.None);

        samplePurge.Verify(s => s.PurgeExpiredAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Once);
        draftReaper.Verify(
            s => s.PurgeExpiredTerminalDraftsAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Once);

        sampleOptions.Setup(o => o.CurrentValue).Returns(new SampleRunPurgeOptions { Enabled = false });
        draftOptions.Setup(o => o.CurrentValue).Returns(new DraftIntakeReaperOptions { Enabled = false });

        await SampleRunPurgeBackgroundWork.RunTtlPassAsync(
            scopeFactory,
            sampleOptions.Object,
            NullLogger.Instance,
            CancellationToken.None);
        await DraftIntakeReaperBackgroundWork.RunTtlPassAsync(
            scopeFactory,
            draftOptions.Object,
            NullLogger.Instance,
            CancellationToken.None);

        samplePurge.Verify(s => s.PurgeExpiredAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Once);
        draftReaper.Verify(
            s => s.PurgeExpiredTerminalDraftsAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Background_work_swallows_ordinary_faults_and_rethrows_cancellation()
    {
        Mock<IOptionsMonitor<SampleRunPurgeOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new SampleRunPurgeOptions { Enabled = true, TtlDays = 3 });

        Mock<ISampleRunPurgeService> samplePurge = new();
        samplePurge.Setup(s => s.PurgeExpiredAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        ServiceCollection services = new();
        services.AddSingleton(samplePurge.Object);
        IServiceScopeFactory scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();

        Func<Task> swallow = () => SampleRunPurgeBackgroundWork.RunTtlPassAsync(
            scopeFactory,
            options.Object,
            NullLogger.Instance,
            CancellationToken.None);
        await swallow.Should().NotThrowAsync();

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();
        samplePurge.Setup(s => s.PurgeExpiredAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException(cts.Token));

        Func<Task> cancel = () => SampleRunPurgeBackgroundWork.RunTtlPassAsync(
            scopeFactory,
            options.Object,
            NullLogger.Instance,
            cts.Token);
        await cancel.Should().ThrowAsync<OperationCanceledException>();
    }

    private static IServiceScopeFactory BuildScopeFactory(
        ITenantRepository tenants,
        ITenantDeletionService deletion,
        TimeProvider clock)
    {
        ServiceCollection services = new();
        services.AddSingleton(tenants);
        services.AddSingleton(deletion);
        services.AddSingleton(clock);

        return services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
