using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class TenantCatalogMigrationOrchestratorTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000001");

    [Fact]
    public async Task RunProjectionRefreshAsync_returns_wrong_stage_until_catalog_attach_is_acknowledged()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(migrations);

        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = Guid.NewGuid(),
                TenantId = TenantId,
                CorrelationId = "corr-1",
                Stage = TenantCatalogMigrationStage.ScopeFreeze,
                StartedUtc = DateTimeOffset.UtcNow,
            },
            CancellationToken.None);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationProjectionRefreshResult? refresh) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.WrongStage, outcome);
        Assert.Null(refresh);
    }

    [Fact]
    public async Task Fan_out_stage_sequence_advances_scope_freeze_to_verification()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(migrations);

        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = Guid.NewGuid(),
                TenantId = TenantId,
                CorrelationId = "corr-2",
                Stage = TenantCatalogMigrationStage.ScopeFreeze,
                StartedUtc = DateTimeOffset.UtcNow,
            },
            CancellationToken.None);

        Assert.Equal(
            TenantCatalogMigrationCommandOutcome.Applied,
            await sut.AcknowledgeCatalogAttachDetachAsync(TenantId, "admin", "Admin", CancellationToken.None));

        TenantCatalogMigrationRecord? afterAttach =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.CatalogAttachDetach, afterAttach?.Stage);

        (TenantCatalogMigrationCommandOutcome refreshOutcome, _) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, refreshOutcome);

        TenantCatalogMigrationRecord? afterRefresh =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.ProjectionRefresh, afterRefresh?.Stage);

        (TenantCatalogMigrationCommandOutcome verifyOutcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, verifyOutcome);
        Assert.NotNull(probe);
        Assert.True(probe.Passed);

        TenantCatalogMigrationRecord? afterVerify =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.Verification, afterVerify?.Stage);
        Assert.NotNull(afterVerify?.VerificationPassedUtc);
    }

    [Fact]
    public async Task RunProjectionRefreshAsync_keeps_catalog_attach_stage_when_refresh_throws()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-refresh-fail",
                Stage = TenantCatalogMigrationStage.CatalogAttachDetach,
                StartedUtc = DateTimeOffset.UtcNow,
            },
            CancellationToken.None);

        Mock<ITenantMigrationProjectionRefreshService> projection = new(MockBehavior.Strict);
        projection
            .Setup(service => service.RefreshAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("projection refresh failed"));

        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(
            migrations,
            projectionRefreshService: projection.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None));

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.CatalogAttachDetach, record?.Stage);
    }

    [Fact]
    public async Task RunVerificationAsync_returns_wrong_stage_before_projection_refresh_succeeds()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = Guid.NewGuid(),
                TenantId = TenantId,
                CorrelationId = "corr-no-refresh",
                Stage = TenantCatalogMigrationStage.CatalogAttachDetach,
                StartedUtc = DateTimeOffset.UtcNow,
            },
            CancellationToken.None);

        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(migrations);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.WrongStage, outcome);
        Assert.Null(probe);
    }

    [Fact]
    public async Task StartAsync_rejects_erasure_quarantined_tenant_without_creating_migration()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 9, 2, 12, 0, 0, TimeSpan.Zero));

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
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
                    CreatedUtc = clock.GetUtcNow().AddDays(-30),
                    OffboardedUtc = clock.GetUtcNow().AddHours(-1),
                });

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Loose);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);

        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(
            migrations,
            tenants.Object,
            suspend);

        (TenantCatalogMigrationCommandOutcome outcome, Guid? migrationId) =
            await sut.StartAsync(TenantId, "corr-offboard", "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.Null(migrationId);
        Assert.Null(await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None));
        tenants.Verify(t => t.SuspendTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task StartAsync_suspends_before_inserting_migration_record()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 9, 2, 12, 0, 0, TimeSpan.Zero));
        List<string> operationOrder = [];

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ActiveTenant(clock));
        tenants
            .Setup(t => t.SuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .Callback(() => operationOrder.Add("suspend"))
            .Returns(Task.CompletedTask);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        InMemoryTenantCatalogMigrationRepository trackingMigrations = new();
        Mock<ITenantCatalogMigrationRepository> migrationSpy = new(MockBehavior.Strict);
        migrationSpy
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .Returns<Guid, CancellationToken>((_, _) => trackingMigrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None));
        migrationSpy
            .Setup(r => r.InsertAsync(It.IsAny<TenantCatalogMigrationRecord>(), It.IsAny<CancellationToken>()))
            .Callback<TenantCatalogMigrationRecord, CancellationToken>((record, _) =>
            {
                operationOrder.Add("insert");
                trackingMigrations.InsertAsync(record, CancellationToken.None).GetAwaiter().GetResult();
            })
            .Returns(Task.CompletedTask);

        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);

        TenantCatalogMigrationOrchestrator sut = new(
            migrationSpy.Object,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, Guid? migrationId) =
            await sut.StartAsync(TenantId, "corr-order", "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, outcome);
        Assert.NotNull(migrationId);
        Assert.Equal(["suspend", "insert"], operationOrder);
    }

    [Fact]
    public async Task StartAsync_unsuspends_when_migration_insert_fails_after_scope_freeze_suspend()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        InMemoryTenantRepository tenants = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 9, 7, 12, 0, 0, TimeSpan.Zero));

        await tenants.InsertTenantAsync(
            TenantId,
            "Acme",
            "acme",
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        Mock<ITenantCatalogMigrationRepository> migrationSpy = new(MockBehavior.Strict);
        migrationSpy
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCatalogMigrationRecord?)null);
        migrationSpy
            .Setup(r => r.InsertAsync(It.IsAny<TenantCatalogMigrationRecord>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("migration insert failed"));

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Loose);
        TenantSuspendCommandService suspend = new(tenants, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrationSpy.Object,
            tenants,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await sut.StartAsync(TenantId, "corr-insert-fail", "admin", "Admin", CancellationToken.None));

        TenantRecord? tenantAfterFailure = await tenants.GetByIdAsync(TenantId, CancellationToken.None);
        Assert.NotNull(tenantAfterFailure);
        Assert.Null(tenantAfterFailure.SuspendedUtc);
        Assert.Null(await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None));
    }

    [Fact]
    public async Task StartAsync_preserves_admin_suspend_when_migration_insert_fails()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        InMemoryTenantRepository tenants = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 9, 7, 12, 0, 0, TimeSpan.Zero));

        await tenants.InsertTenantAsync(
            TenantId,
            "Acme",
            "acme",
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await tenants.SuspendTenantAsync(TenantId, CancellationToken.None);

        TenantRecord? adminSuspended = await tenants.GetByIdAsync(TenantId, CancellationToken.None);
        Assert.NotNull(adminSuspended?.SuspendedUtc);

        Mock<ITenantCatalogMigrationRepository> migrationSpy = new(MockBehavior.Strict);
        migrationSpy
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCatalogMigrationRecord?)null);
        migrationSpy
            .Setup(r => r.InsertAsync(It.IsAny<TenantCatalogMigrationRecord>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("migration insert failed"));

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Loose);
        TenantSuspendCommandService suspend = new(tenants, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrationSpy.Object,
            tenants,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await sut.StartAsync(TenantId, "corr-pre-suspended-insert-fail", "admin", "Admin", CancellationToken.None));

        TenantRecord? tenantAfterFailure = await tenants.GetByIdAsync(TenantId, CancellationToken.None);
        Assert.NotNull(tenantAfterFailure?.SuspendedUtc);
        Assert.Equal(adminSuspended.SuspendedUtc, tenantAfterFailure.SuspendedUtc);
        Assert.Null(await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None));
    }

    [Fact]
    public async Task CompleteAsync_preserves_admin_suspend_when_tenant_was_suspended_before_migration_start()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        InMemoryTenantRepository tenants = new();
        DateTimeOffset migrationStartUtc = DateTimeOffset.UtcNow.AddHours(2);
        FakeTimeProvider clock = new(migrationStartUtc);

        await tenants.InsertTenantAsync(
            TenantId,
            "Acme",
            "acme",
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await tenants.SuspendTenantAsync(TenantId, CancellationToken.None);

        TenantRecord? suspendedTenant = await tenants.GetByIdAsync(TenantId, CancellationToken.None);
        Assert.NotNull(suspendedTenant?.SuspendedUtc);
        Assert.True(suspendedTenant.SuspendedUtc < migrationStartUtc);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Loose);
        TenantSuspendCommandService suspend = new(tenants, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(
            migrations,
            tenants,
            suspend,
            projectionRefreshService: CreateDefaultProjectionRefresh(),
            verificationProbe: CreateDefaultVerificationProbe());

        (TenantCatalogMigrationCommandOutcome startOutcome, Guid? migrationId) =
            await sut.StartAsync(TenantId, "corr-pre-suspended", "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, startOutcome);
        Assert.NotNull(migrationId);

        Assert.Equal(
            TenantCatalogMigrationCommandOutcome.Applied,
            await sut.AcknowledgeCatalogAttachDetachAsync(TenantId, "admin", "Admin", CancellationToken.None));

        (TenantCatalogMigrationCommandOutcome refreshOutcome, _) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, refreshOutcome);

        (TenantCatalogMigrationCommandOutcome verifyOutcome, _) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, verifyOutcome);

        TenantCatalogMigrationCommandOutcome completeOutcome =
            await sut.CompleteAsync(TenantId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, completeOutcome);

        TenantRecord? tenantAfterComplete = await tenants.GetByIdAsync(TenantId, CancellationToken.None);
        Assert.NotNull(tenantAfterComplete?.SuspendedUtc);
        Assert.Equal(suspendedTenant.SuspendedUtc, tenantAfterComplete.SuspendedUtc);
        Assert.True(tenantAfterComplete.SuspendedUtc < migrationStartUtc);
    }

    [Fact]
    public async Task CompleteAsync_unsuspends_when_migration_applied_scope_freeze_suspend()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        InMemoryTenantRepository tenants = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        await tenants.InsertTenantAsync(
            TenantId,
            "Acme",
            "acme",
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Loose);
        TenantSuspendCommandService suspend = new(tenants, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(
            migrations,
            tenants,
            suspend,
            projectionRefreshService: CreateDefaultProjectionRefresh(),
            verificationProbe: CreateDefaultVerificationProbe());

        (TenantCatalogMigrationCommandOutcome startOutcome, _) =
            await sut.StartAsync(TenantId, "corr-migration-suspend", "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, startOutcome);

        TenantRecord? suspendedByMigration = await tenants.GetByIdAsync(TenantId, CancellationToken.None);
        Assert.NotNull(suspendedByMigration?.SuspendedUtc);

        Assert.Equal(
            TenantCatalogMigrationCommandOutcome.Applied,
            await sut.AcknowledgeCatalogAttachDetachAsync(TenantId, "admin", "Admin", CancellationToken.None));
        (TenantCatalogMigrationCommandOutcome refreshOutcome, _) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, refreshOutcome);
        (TenantCatalogMigrationCommandOutcome verifyOutcome, _) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, verifyOutcome);

        TenantCatalogMigrationCommandOutcome completeOutcome =
            await sut.CompleteAsync(TenantId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, completeOutcome);

        TenantRecord? tenantAfterComplete = await tenants.GetByIdAsync(TenantId, CancellationToken.None);
        Assert.NotNull(tenantAfterComplete);
        Assert.Null(tenantAfterComplete.SuspendedUtc);
    }

    [Fact]
    public async Task RunVerificationAsync_allows_retry_after_failed_verification()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-retry",
                Stage = TenantCatalogMigrationStage.Verification,
                StartedUtc = DateTimeOffset.UtcNow,
                LastVerificationError = "first attempt failed",
            },
            CancellationToken.None);

        Mock<ITenantMigrationVerificationProbe> verification = new(MockBehavior.Strict);
        verification
            .SetupSequence(probe => probe.RunAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationVerificationProbeResult
                {
                    Passed = false,
                    ErrorMessage = "first attempt failed",
                })
            .ReturnsAsync(
                new TenantMigrationVerificationProbeResult
                {
                    Passed = true,
                    ProbeRunId = "run-retry",
                    WriteFreezeVerified = true,
                    AuthorizationBoundaryVerified = true,
                });

        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(migrations, verificationProbe: verification.Object);

        (TenantCatalogMigrationCommandOutcome firstOutcome, _) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.VerificationFailed, firstOutcome);

        (TenantCatalogMigrationCommandOutcome retryOutcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, retryOutcome);
        Assert.NotNull(probe);
        Assert.True(probe.Passed);

        TenantCatalogMigrationRecord? afterRetry =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.Verification, afterRetry?.Stage);
        Assert.NotNull(afterRetry?.VerificationPassedUtc);
    }

    private static TenantCatalogMigrationOrchestrator CreateOrchestrator(
        InMemoryTenantCatalogMigrationRepository migrations,
        ITenantRepository? tenantRepository = null,
        ITenantSuspendCommandService? tenantSuspendCommandService = null,
        ITenantMigrationVerificationProbe? verificationProbe = null,
        ITenantMigrationProjectionRefreshService? projectionRefreshService = null)
    {
        ITenantRepository tenants = tenantRepository ?? CreateDefaultTenantRepository().Object;
        ITenantSuspendCommandService suspend = tenantSuspendCommandService ?? new Mock<ITenantSuspendCommandService>(MockBehavior.Loose).Object;
        ITenantMigrationProjectionRefreshService projection;
        if (projectionRefreshService is not null)
        {
            projection = projectionRefreshService;
        }
        else
        {
            Mock<ITenantMigrationProjectionRefreshService> projectionMock = new(MockBehavior.Strict);
            projectionMock
                .Setup(service => service.RefreshAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(
                    new TenantMigrationProjectionRefreshResult
                    {
                        RetrievalIndexingRowsProcessed = 3,
                        RoiCacheKeysInvalidated = 1,
                        TenantScopeCachesInvalidated = 7,
                    });
            projection = projectionMock.Object;
        }

        ITenantMigrationVerificationProbe verification;
        if (verificationProbe is not null)
        {
            verification = verificationProbe;
        }
        else
        {
            Mock<ITenantMigrationVerificationProbe> verificationMock = new(MockBehavior.Strict);
            verificationMock
                .Setup(probe => probe.RunAsync(TenantId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(
                    new TenantMigrationVerificationProbeResult
                    {
                        Passed = true,
                        ProbeRunId = "run-1",
                        WriteFreezeVerified = true,
                        AuthorizationBoundaryVerified = true,
                    });
            verification = verificationMock.Object;
        }

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Loose);
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        return new TenantCatalogMigrationOrchestrator(
            migrations,
            tenants,
            suspend,
            projection,
            verification,
            audit.Object,
            clock);
    }

    private static Mock<ITenantRepository> CreateDefaultTenantRepository()
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Loose);
        return tenants;
    }

    private static ITenantMigrationProjectionRefreshService CreateDefaultProjectionRefresh()
    {
        Mock<ITenantMigrationProjectionRefreshService> projectionMock = new(MockBehavior.Strict);
        projectionMock
            .Setup(service => service.RefreshAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationProjectionRefreshResult
                {
                    RetrievalIndexingRowsProcessed = 3,
                    RoiCacheKeysInvalidated = 1,
                    TenantScopeCachesInvalidated = 7,
                });
        return projectionMock.Object;
    }

    private static ITenantMigrationVerificationProbe CreateDefaultVerificationProbe()
    {
        Mock<ITenantMigrationVerificationProbe> verificationMock = new(MockBehavior.Strict);
        verificationMock
            .Setup(probe => probe.RunAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationVerificationProbeResult
                {
                    Passed = true,
                    ProbeRunId = "run-1",
                    WriteFreezeVerified = true,
                    AuthorizationBoundaryVerified = true,
                });
        return verificationMock.Object;
    }

    private static TenantRecord ActiveTenant(FakeTimeProvider clock) =>
        new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
        };
}
