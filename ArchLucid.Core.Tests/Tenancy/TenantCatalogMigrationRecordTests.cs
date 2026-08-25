using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantCatalogMigrationRecordTests
{
    [Fact]
    public void TenantCatalogMigrationRecord_InFlightMigration_IsActive()
    {
        Guid migrationId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset startedUtc = new(2026, 8, 8, 12, 0, 0, TimeSpan.Zero);

        TenantCatalogMigrationRecord record = new()
        {
            MigrationId = migrationId,
            TenantId = tenantId,
            CorrelationId = "corr-1",
            Stage = TenantCatalogMigrationStage.ProjectionRefresh,
            StartedUtc = startedUtc,
            MaintenanceMessage = "Migration in progress",
        };

        record.MigrationId.Should().Be(migrationId);
        record.TenantId.Should().Be(tenantId);
        record.CorrelationId.Should().Be("corr-1");
        record.Stage.Should().Be(TenantCatalogMigrationStage.ProjectionRefresh);
        record.StartedUtc.Should().Be(startedUtc);
        record.CompletedUtc.Should().BeNull();
        record.MaintenanceMessage.Should().Be("Migration in progress");
        record.VerificationPassedUtc.Should().BeNull();
        record.LastVerificationError.Should().BeNull();
        record.IsActive.Should().BeTrue();
    }

    [Fact]
    public void TenantCatalogMigrationRecord_CompletedMigration_IsNotActive()
    {
        DateTimeOffset completedUtc = new(2026, 8, 8, 13, 30, 0, TimeSpan.Zero);
        DateTimeOffset verifiedUtc = new(2026, 8, 8, 13, 25, 0, TimeSpan.Zero);

        TenantCatalogMigrationRecord record = new()
        {
            Stage = TenantCatalogMigrationStage.Complete,
            CompletedUtc = completedUtc,
            VerificationPassedUtc = verifiedUtc,
            LastVerificationError = "row count drifted on first attempt",
        };

        record.Stage.Should().Be(TenantCatalogMigrationStage.Complete);
        record.CompletedUtc.Should().Be(completedUtc);
        record.VerificationPassedUtc.Should().Be(verifiedUtc);
        record.LastVerificationError.Should().Be("row count drifted on first attempt");
        record.CorrelationId.Should().BeEmpty();
        record.MaintenanceMessage.Should().BeEmpty();
        record.IsActive.Should().BeFalse();
    }
}
