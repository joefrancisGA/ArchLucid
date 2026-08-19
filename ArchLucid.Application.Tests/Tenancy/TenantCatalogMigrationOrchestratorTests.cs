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

        TenantCatalogMigrationOrchestrator sut = CreateOrchestrator(migrations, verification.Object);

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
        ITenantMigrationVerificationProbe? verificationProbe = null)
    {
        Mock<ITenantRepository> tenants = new(MockBehavior.Loose);
        Mock<ITenantSuspendCommandService> suspend = new(MockBehavior.Loose);
        Mock<ITenantMigrationProjectionRefreshService> projection = new(MockBehavior.Strict);
        projection
            .Setup(service => service.RefreshAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantMigrationProjectionRefreshResult
                {
                    RetrievalIndexingRowsProcessed = 3,
                    RoiCacheKeysInvalidated = 1,
                    TenantScopeCachesInvalidated = 7,
                });

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
            tenants.Object,
            suspend.Object,
            projection.Object,
            verification,
            audit.Object,
            clock);
    }
}
