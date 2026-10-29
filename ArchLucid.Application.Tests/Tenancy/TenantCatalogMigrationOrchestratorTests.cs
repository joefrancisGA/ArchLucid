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
    public async Task AcknowledgeCatalogAttachDetachAsync_returns_in_erasure_quarantine_without_stage_update_when_offboarded_before_acknowledge()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 20, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-pre-attach",
                Stage = TenantCatalogMigrationStage.ScopeFreeze,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.AcknowledgeCatalogAttachDetachAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.ScopeFreeze, record?.Stage);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationCatalogAttachAcknowledged),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AcknowledgeCatalogAttachDetachAsync_returns_in_erasure_quarantine_without_attach_audit_when_offboarded_after_stage_update()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 18, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-attach",
                Stage = TenantCatalogMigrationStage.ScopeFreeze,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.AcknowledgeCatalogAttachDetachAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.CatalogAttachDetach, record?.Stage);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationCatalogAttachAcknowledged),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AcknowledgeCatalogAttachDetachAsync_returns_in_erasure_quarantine_without_attach_audit_when_offboard_completes_after_stage_update_before_audit()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 14, 12, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-attach-pre-audit",
                Stage = TenantCatalogMigrationStage.ScopeFreeze,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.AcknowledgeCatalogAttachDetachAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.CatalogAttachDetach, record?.Stage);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationCatalogAttachAcknowledged),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AcknowledgeCatalogAttachDetachAsync_returns_in_erasure_quarantine_without_attach_audit_when_offboard_completes_after_tenant_before_attach_audit_read_before_audit()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 22, 6, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-attach-pre-append",
                Stage = TenantCatalogMigrationStage.ScopeFreeze,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.AcknowledgeCatalogAttachDetachAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.CatalogAttachDetach, record?.Stage);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationCatalogAttachAcknowledged),
                It.IsAny<CancellationToken>()),
            Times.Never);
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
    public async Task RunProjectionRefreshAsync_returns_in_erasure_quarantine_without_calling_refresh_when_offboarded_before_refresh()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 19, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-pre-refresh",
                Stage = TenantCatalogMigrationStage.CatalogAttachDetach,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded);

        Mock<ITenantMigrationProjectionRefreshService> projection = new(MockBehavior.Strict);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            projection.Object,
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationProjectionRefreshResult? refresh) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.Null(refresh);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.CatalogAttachDetach, record?.Stage);
    }

    [Fact]
    public async Task RunProjectionRefreshAsync_returns_in_erasure_quarantine_without_calling_refresh_when_offboarded_after_entry_before_refresh_run()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 14, 0, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-pre-refresh-run",
                Stage = TenantCatalogMigrationStage.CatalogAttachDetach,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<ITenantMigrationProjectionRefreshService> projection = new(MockBehavior.Strict);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            projection.Object,
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationProjectionRefreshResult? refresh) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.Null(refresh);
        projection.Verify(
            service => service.RefreshAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunProjectionRefreshAsync_returns_in_erasure_quarantine_without_refresh_audit_when_offboarded_after_refresh()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 17, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-refresh",
                Stage = TenantCatalogMigrationStage.CatalogAttachDetach,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationProjectionRefreshResult? refresh) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(refresh);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.CatalogAttachDetach, record?.Stage);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationProjectionRefreshCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunProjectionRefreshAsync_returns_in_erasure_quarantine_without_stage_update_when_offboarded_after_refresh_before_stage_advance()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 23, 45, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-pre-stage-refresh",
                Stage = TenantCatalogMigrationStage.CatalogAttachDetach,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationProjectionRefreshResult? refresh) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(refresh);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.CatalogAttachDetach, record?.Stage);
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunProjectionRefreshAsync_returns_in_erasure_quarantine_without_refresh_audit_when_offboarded_after_stage_update()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 19, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-refresh-stage",
                Stage = TenantCatalogMigrationStage.CatalogAttachDetach,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationProjectionRefreshResult? refresh) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(refresh);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.ProjectionRefresh, record?.Stage);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationProjectionRefreshCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunProjectionRefreshAsync_returns_in_erasure_quarantine_without_refresh_audit_when_offboard_completes_after_stage_update_before_audit()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 14, 11, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-refresh-pre-audit",
                Stage = TenantCatalogMigrationStage.CatalogAttachDetach,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationProjectionRefreshResult? refresh) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(refresh);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.ProjectionRefresh, record?.Stage);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationProjectionRefreshCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunProjectionRefreshAsync_returns_in_erasure_quarantine_without_refresh_audit_when_offboard_completes_after_tenant_before_refresh_audit_read_before_audit()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 22, 5, 5, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-refresh-pre-append-audit",
                Stage = TenantCatalogMigrationStage.CatalogAttachDetach,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationProjectionRefreshResult? refresh) =
            await sut.RunProjectionRefreshAsync(TenantId, WorkspaceId, ProjectId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(refresh);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.ProjectionRefresh, record?.Stage);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationProjectionRefreshCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
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
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .Callback(() => operationOrder.Add("suspend"))
            .ReturnsAsync(true);

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
    public async Task StartAsync_returns_in_erasure_quarantine_when_offboard_completes_after_scope_freeze_suspend_before_insert()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 12, 0, 0, TimeSpan.Zero));
        TenantRecord active = ActiveTenant(clock);
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .Setup(t => t.TryUnsuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ITenantCatalogMigrationRepository> migrationSpy = new(MockBehavior.Strict);
        migrationSpy
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCatalogMigrationRecord?)null);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantSuspended),
                It.IsAny<CancellationToken>()))
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
            await sut.StartAsync(TenantId, "corr-offboard-race", "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.Null(migrationId);
        migrationSpy.Verify(
            r => r.InsertAsync(It.IsAny<TenantCatalogMigrationRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task StartAsync_skips_compensating_unsuspend_when_offboarded_before_insert()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 14, 2, 0, 0, TimeSpan.Zero));
        DateTimeOffset now = clock.GetUtcNow();
        TenantRecord active = ActiveTenant(clock);
        TenantRecord suspendedOnly = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            SuspendedUtc = now,
        };
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now.AddDays(-1),
            OffboardedUtc = now,
            ErasureEligibleUtc = now.AddDays(30),
            SuspendedUtc = now,
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(suspendedOnly)
            .ReturnsAsync(suspendedOnly)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        tenants
            .Setup(t => t.TryUnsuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ITenantCatalogMigrationRepository> migrationSpy = new(MockBehavior.Strict);
        migrationSpy
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCatalogMigrationRecord?)null);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantSuspended),
                It.IsAny<CancellationToken>()))
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
            await sut.StartAsync(TenantId, "corr-skip-compensate-unsuspend", "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.Null(migrationId);
        tenants.Verify(t => t.TryUnsuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()), Times.Never);
        migrationSpy.Verify(
            r => r.InsertAsync(It.IsAny<TenantCatalogMigrationRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task StartAsync_returns_in_erasure_quarantine_without_started_audit_when_offboard_completes_after_insert()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 14, 0, 0, TimeSpan.Zero));
        TenantRecord active = ActiveTenant(clock);
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ITenantCatalogMigrationRepository> migrationSpy = new(MockBehavior.Strict);
        migrationSpy
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCatalogMigrationRecord?)null);
        migrationSpy
            .Setup(r => r.InsertAsync(It.IsAny<TenantCatalogMigrationRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantSuspended),
                It.IsAny<CancellationToken>()))
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
            await sut.StartAsync(TenantId, "corr-offboard-post-insert", "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(migrationId);
        migrationSpy.Verify(
            r => r.InsertAsync(It.IsAny<TenantCatalogMigrationRecord>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationStarted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task StartAsync_returns_in_erasure_quarantine_without_started_audit_when_offboard_completes_after_tenant_after_insert_read_before_audit()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 22, 5, 10, 0, TimeSpan.Zero));
        TenantRecord active = ActiveTenant(clock);
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ITenantCatalogMigrationRepository> migrationSpy = new(MockBehavior.Strict);
        migrationSpy
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCatalogMigrationRecord?)null);
        migrationSpy
            .Setup(r => r.InsertAsync(It.IsAny<TenantCatalogMigrationRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantSuspended),
                It.IsAny<CancellationToken>()))
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
            await sut.StartAsync(TenantId, "corr-offboard-post-insert-pre-append-audit", "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(migrationId);
        migrationSpy.Verify(
            r => r.InsertAsync(It.IsAny<TenantCatalogMigrationRecord>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationStarted),
                It.IsAny<CancellationToken>()),
            Times.Never);
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
    public async Task CompleteAsync_returns_in_erasure_quarantine_when_offboarded_before_complete()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 13, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        TenantCatalogMigrationRecord activeMigration = new()
        {
            MigrationId = migrationId,
            TenantId = TenantId,
            CorrelationId = "corr-offboard-complete",
            Stage = TenantCatalogMigrationStage.Verification,
            StartedUtc = clock.GetUtcNow().AddHours(-1),
            VerificationPassedUtc = clock.GetUtcNow().AddMinutes(-5),
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantCatalogMigrationRepository> migrations = new(MockBehavior.Strict);
        migrations
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeMigration);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(
            tenants.Object,
            audit.Object,
            clock);

        TenantCatalogMigrationOrchestrator sut = new(
            migrations.Object,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.CompleteAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        migrations.Verify(
            r => r.CompleteAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteAsync_returns_in_erasure_quarantine_without_repository_complete_when_offboarded_after_entry_before_complete()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 23, 30, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        TenantCatalogMigrationRecord activeMigration = new()
        {
            MigrationId = migrationId,
            TenantId = TenantId,
            CorrelationId = "corr-offboard-pre-repo-complete",
            Stage = TenantCatalogMigrationStage.Verification,
            StartedUtc = clock.GetUtcNow().AddHours(-1),
            VerificationPassedUtc = clock.GetUtcNow().AddMinutes(-5),
        };

        TenantRecord active = ActiveTenant(clock);
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantCatalogMigrationRepository> migrations = new(MockBehavior.Strict);
        migrations
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeMigration);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(
            tenants.Object,
            audit.Object,
            clock);

        TenantCatalogMigrationOrchestrator sut = new(
            migrations.Object,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.CompleteAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        migrations.Verify(
            r => r.CompleteAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteAsync_returns_in_erasure_quarantine_without_completed_audit_when_offboarded_after_repository_complete()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 15, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        TenantCatalogMigrationRecord activeMigration = new()
        {
            MigrationId = migrationId,
            TenantId = TenantId,
            CorrelationId = "corr-offboard-post-complete",
            Stage = TenantCatalogMigrationStage.Verification,
            StartedUtc = clock.GetUtcNow().AddHours(-1),
            VerificationPassedUtc = clock.GetUtcNow().AddMinutes(-5),
        };

        TenantRecord active = ActiveTenant(clock);
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
            SuspendedUtc = clock.GetUtcNow(),
        };

        Mock<ITenantCatalogMigrationRepository> migrations = new(MockBehavior.Strict);
        migrations
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeMigration);
        migrations
            .Setup(r => r.CompleteAsync(migrationId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(
            tenants.Object,
            audit.Object,
            clock);

        TenantCatalogMigrationOrchestrator sut = new(
            migrations.Object,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.CompleteAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        migrations.Verify(
            r => r.CompleteAsync(migrationId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteAsync_returns_in_erasure_quarantine_without_completed_audit_when_offboard_completes_after_pre_audit_read_before_audit()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 14, 13, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        TenantCatalogMigrationRecord activeMigration = new()
        {
            MigrationId = migrationId,
            TenantId = TenantId,
            CorrelationId = "corr-offboard-complete-pre-audit",
            Stage = TenantCatalogMigrationStage.Verification,
            StartedUtc = clock.GetUtcNow().AddHours(-1),
            VerificationPassedUtc = clock.GetUtcNow().AddMinutes(-5),
        };

        TenantRecord active = ActiveTenant(clock);
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantCatalogMigrationRepository> migrations = new(MockBehavior.Strict);
        migrations
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeMigration);
        migrations
            .Setup(r => r.CompleteAsync(migrationId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(
            tenants.Object,
            audit.Object,
            clock);

        TenantCatalogMigrationOrchestrator sut = new(
            migrations.Object,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.CompleteAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        migrations.Verify(
            r => r.CompleteAsync(migrationId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteAsync_returns_in_erasure_quarantine_without_completed_audit_when_offboard_completes_after_tenant_before_completed_audit_read_before_audit()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 22, 4, 58, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        TenantCatalogMigrationRecord activeMigration = new()
        {
            MigrationId = migrationId,
            TenantId = TenantId,
            CorrelationId = "corr-offboard-complete-pre-append-audit",
            Stage = TenantCatalogMigrationStage.Verification,
            StartedUtc = clock.GetUtcNow().AddHours(-1),
            VerificationPassedUtc = clock.GetUtcNow().AddMinutes(-5),
        };

        TenantRecord active = ActiveTenant(clock);
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantCatalogMigrationRepository> migrations = new(MockBehavior.Strict);
        migrations
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeMigration);
        migrations
            .Setup(r => r.CompleteAsync(migrationId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(
            tenants.Object,
            audit.Object,
            clock);

        TenantCatalogMigrationOrchestrator sut = new(
            migrations.Object,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.CompleteAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        migrations.Verify(
            r => r.CompleteAsync(migrationId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteAsync_skips_unsuspend_when_offboarded_after_post_complete_read_before_unsuspend()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 22, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        TenantCatalogMigrationRecord activeMigration = new()
        {
            MigrationId = migrationId,
            TenantId = TenantId,
            CorrelationId = "corr-offboard-pre-unsuspend",
            Stage = TenantCatalogMigrationStage.Verification,
            StartedUtc = clock.GetUtcNow().AddHours(-1),
            VerificationPassedUtc = clock.GetUtcNow().AddMinutes(-5),
        };

        TenantRecord suspendedActive = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            SuspendedUtc = clock.GetUtcNow(),
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
            SuspendedUtc = clock.GetUtcNow(),
        };

        Mock<ITenantCatalogMigrationRepository> migrations = new(MockBehavior.Strict);
        migrations
            .Setup(r => r.GetActiveByTenantIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeMigration);
        migrations
            .Setup(r => r.CompleteAsync(migrationId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(suspendedActive)
            .ReturnsAsync(suspendedActive)
            .ReturnsAsync(offboarded)
            .ReturnsAsync(offboarded);

        Mock<ITenantSuspendCommandService> suspend = new(MockBehavior.Strict);
        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);

        TenantCatalogMigrationOrchestrator sut = new(
            migrations.Object,
            tenants.Object,
            suspend.Object,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        TenantCatalogMigrationCommandOutcome outcome =
            await sut.CompleteAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        suspend.Verify(
            service => service.TryUnsuspendAsync(
                TenantId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunVerificationAsync_returns_in_erasure_quarantine_without_probe_when_offboarded_before_verification()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 21, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-pre-verify",
                Stage = TenantCatalogMigrationStage.ProjectionRefresh,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Standard,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = clock.GetUtcNow().AddDays(-1),
            OffboardedUtc = clock.GetUtcNow(),
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded);

        Mock<ITenantMigrationVerificationProbe> verification = new(MockBehavior.Strict);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            verification.Object,
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.Null(probe);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.ProjectionRefresh, record?.Stage);
    }

    [Fact]
    public async Task RunVerificationAsync_returns_in_erasure_quarantine_without_probe_when_offboarded_after_stage_update_before_probe()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 22, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-post-stage-verify",
                Stage = TenantCatalogMigrationStage.ProjectionRefresh,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<ITenantMigrationVerificationProbe> verification = new(MockBehavior.Strict);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            verification.Object,
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.Null(probe);
        verification.Verify(
            probeRunner => probeRunner.RunAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Equal(TenantCatalogMigrationStage.Verification, record?.Stage);
    }

    [Fact]
    public async Task RunVerificationAsync_returns_in_erasure_quarantine_without_passed_audit_when_offboarded_after_probe()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 16, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-verify",
                Stage = TenantCatalogMigrationStage.ProjectionRefresh,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<ITenantMigrationVerificationProbe> verification = new(MockBehavior.Strict);
        verification
            .Setup(probe => probe.RunAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationVerificationProbeResult
                {
                    Passed = true,
                    ProbeRunId = "run-offboard",
                    WriteFreezeVerified = true,
                    AuthorizationBoundaryVerified = true,
                });

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            verification.Object,
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(probe);
        Assert.True(probe.Passed);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationVerificationPassed),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunVerificationAsync_returns_in_erasure_quarantine_without_passed_audit_when_offboard_completes_after_mark_before_audit()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 14, 10, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-verify-pre-audit",
                Stage = TenantCatalogMigrationStage.ProjectionRefresh,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<ITenantMigrationVerificationProbe> verification = new(MockBehavior.Strict);
        verification
            .Setup(probe => probe.RunAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationVerificationProbeResult
                {
                    Passed = true,
                    ProbeRunId = "run-offboard-pre-audit",
                    WriteFreezeVerified = true,
                    AuthorizationBoundaryVerified = true,
                });

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            verification.Object,
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(probe);
        Assert.True(probe.Passed);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationVerificationPassed),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunVerificationAsync_returns_in_erasure_quarantine_without_passed_audit_when_offboard_completes_after_tenant_before_verification_audit_read_before_audit()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 22, 4, 52, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-verify-pre-append-audit",
                Stage = TenantCatalogMigrationStage.ProjectionRefresh,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<ITenantMigrationVerificationProbe> verification = new(MockBehavior.Strict);
        verification
            .Setup(probe => probe.RunAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationVerificationProbeResult
                {
                    Passed = true,
                    ProbeRunId = "run-offboard-pre-append-audit",
                    WriteFreezeVerified = true,
                    AuthorizationBoundaryVerified = true,
                });

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            verification.Object,
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(probe);
        Assert.True(probe.Passed);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationVerificationPassed),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunVerificationAsync_returns_in_erasure_quarantine_without_marking_result_when_offboarded_after_probe_before_mark()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 23, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-pre-mark",
                Stage = TenantCatalogMigrationStage.ProjectionRefresh,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<ITenantMigrationVerificationProbe> verification = new(MockBehavior.Strict);
        verification
            .Setup(probe => probe.RunAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationVerificationProbeResult
                {
                    Passed = true,
                    ProbeRunId = "run-offboard-pre-mark",
                    WriteFreezeVerified = true,
                    AuthorizationBoundaryVerified = true,
                });

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            verification.Object,
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(probe);
        Assert.True(probe.Passed);
        audit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);

        TenantCatalogMigrationRecord? record =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);
        Assert.Null(record?.VerificationPassedUtc);
    }

    [Fact]
    public async Task RunVerificationAsync_returns_in_erasure_quarantine_without_failed_audit_when_offboarded_after_probe()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 13, 17, 0, 0, TimeSpan.Zero));
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-offboard-verify-failed",
                Stage = TenantCatalogMigrationStage.ProjectionRefresh,
                StartedUtc = clock.GetUtcNow().AddHours(-1),
            },
            CancellationToken.None);

        TenantRecord activeTenant = new()
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
            ErasureEligibleUtc = clock.GetUtcNow().AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(activeTenant)
            .ReturnsAsync(offboarded);

        Mock<ITenantMigrationVerificationProbe> verification = new(MockBehavior.Strict);
        verification
            .Setup(probe => probe.RunAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationVerificationProbeResult
                {
                    Passed = false,
                    ProbeRunId = "run-offboard-failed",
                    ErrorMessage = "write freeze not verified",
                    WriteFreezeVerified = false,
                    AuthorizationBoundaryVerified = true,
                });

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            verification.Object,
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationVerificationProbeResult? probe) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.InErasureQuarantine, outcome);
        Assert.NotNull(probe);
        Assert.False(probe.Passed);
        audit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e => e.EventType == AuditEventTypes.TenantCatalogMigrationVerificationFailed),
                It.IsAny<CancellationToken>()),
            Times.Never);
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

    [Fact]
    public async Task RunVerificationAsync_trims_whitespace_from_persisted_verification_error_message()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        Guid migrationId = Guid.NewGuid();
        await migrations.InsertAsync(
            new TenantCatalogMigrationRecord
            {
                MigrationId = migrationId,
                TenantId = TenantId,
                CorrelationId = "corr-trim-error",
                Stage = TenantCatalogMigrationStage.ProjectionRefresh,
                StartedUtc = DateTimeOffset.UtcNow,
            },
            CancellationToken.None);

        Mock<ITenantMigrationVerificationProbe> verification = new(MockBehavior.Strict);
        verification
            .Setup(probe => probe.RunAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationVerificationProbeResult
                {
                    Passed = false,
                    ErrorMessage = "  catalog probe timeout  ",
                });

        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(migrations, verificationProbe: verification.Object);

        (TenantCatalogMigrationCommandOutcome outcome, _) =
            await sut.RunVerificationAsync(TenantId, "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.VerificationFailed, outcome);

        TenantCatalogMigrationRecord? active =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);

        Assert.Equal("catalog probe timeout", active?.LastVerificationError);
    }

    [Fact]
    public async Task StartAsync_trims_correlation_id_on_started_migration_audit_event()
    {
        InMemoryTenantCatalogMigrationRepository migrations = new();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 29, 12, 0, 0, TimeSpan.Zero));
        PlatformAuditEvent? captured = null;

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ActiveTenant(clock));
        tenants
            .Setup(t => t.TrySuspendTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IPlatformAuditRepository> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<PlatformAuditEvent, CancellationToken>((auditEvent, _) =>
            {
                if (auditEvent.EventType == AuditEventTypes.TenantCatalogMigrationStarted)
                    captured = auditEvent;
            })
            .Returns(Task.CompletedTask);

        TenantSuspendCommandService suspend = new(tenants.Object, audit.Object, clock);
        TenantCatalogMigrationOrchestrator sut = new(
            migrations,
            tenants.Object,
            suspend,
            CreateDefaultProjectionRefresh(),
            CreateDefaultVerificationProbe(),
            audit.Object,
            clock);

        (TenantCatalogMigrationCommandOutcome outcome, Guid? migrationId) =
            await sut.StartAsync(TenantId, "  corr-trim-audit  ", "admin", "Admin", CancellationToken.None);

        Assert.Equal(TenantCatalogMigrationCommandOutcome.Applied, outcome);
        Assert.NotNull(migrationId);
        Assert.NotNull(captured);
        Assert.Equal(AuditEventTypes.TenantCatalogMigrationStarted, captured!.EventType);
        Assert.Equal("corr-trim-audit", captured.CorrelationId);

        TenantCatalogMigrationRecord? active =
            await migrations.GetActiveByTenantIdAsync(TenantId, CancellationToken.None);

        Assert.Equal("corr-trim-audit", active?.CorrelationId);
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
