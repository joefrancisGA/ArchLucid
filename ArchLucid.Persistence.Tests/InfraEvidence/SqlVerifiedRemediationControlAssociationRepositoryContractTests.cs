using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Tests;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlVerifiedRemediationControlAssociationRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : VerifiedRemediationControlAssociationRepositoryContractTests
{
    protected override void SkipIfUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IVerifiedRemediationControlAssociationRepository CreateRepository() =>
        new SqlVerifiedRemediationControlAssociationRepository(new SqlConnectionFactory(fixture.ConnectionString));

    protected override async Task PrepareStorageAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        Guid verificationSnapshotId)
    {
        await using Microsoft.Data.SqlClient.SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();
        Guid packageId = Guid.NewGuid();
        Guid findingId = Guid.NewGuid();
        Guid patternId = Guid.NewGuid();
        Guid versionId = Guid.NewGuid();
        DateTime utcNow = new(2026, 10, 12, 10, 0, 0, DateTimeKind.Utc);

        await connection.ExecuteAsync(
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.AzureExtractorPackages WHERE PackageId = @PackageId)
                INSERT INTO dbo.AzureExtractorPackages
                    (PackageId, TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc, SchemaVersion,
                     OriginalFileName, ManifestJson, PackageBytes)
                VALUES
                    (@PackageId, @TenantId, @WorkspaceId, @ProjectId, NULL, @UtcNow, 1,
                     N'sn-hand-05.zip', N'{}', 0x00);

            IF NOT EXISTS (SELECT 1 FROM dbo.AzureInventorySnapshots WHERE SnapshotId = @SnapshotId)
                INSERT INTO dbo.AzureInventorySnapshots
                    (SnapshotId, TenantId, WorkspaceId, ProjectId, PackageId, CaptureStatus, CreatedUtc, UpdatedUtc)
                VALUES
                    (@SnapshotId, @TenantId, @WorkspaceId, @ProjectId, @PackageId, 1, @UtcNow, @UtcNow);

            IF NOT EXISTS (SELECT 1 FROM dbo.RemediationInstances WHERE InstanceId = @InstanceId)
            BEGIN
                INSERT INTO dbo.OperationalSecurityFindings
                    (FindingId, TenantId, WorkspaceId, ProjectId, Provider, SourceSystem, SourceFindingId,
                     Title, FirstObservedUtc, LastObservedUtc, Status, PayloadHashSha256, CreatedUtc, UpdatedUtc)
                VALUES
                    (@FindingId, @TenantId, @WorkspaceId, @ProjectId, 1, N'sn-hand-05', @InstanceId,
                     N'SN-HAND-05 association parent', @UtcNow, @UtcNow, 1, @PayloadHash, @UtcNow, @UtcNow);

                INSERT INTO dbo.RemediationPatterns
                    (PatternId, TenantId, PatternKey, DisplayName, CreatedByActorKey, CreatedUtc, UpdatedUtc)
                VALUES
                    (@PatternId, @TenantId, @PatternKey, N'SN-HAND-05', N'test', @UtcNow, @UtcNow);

                INSERT INTO dbo.RemediationPatternVersions
                    (VersionId, PatternId, TenantId, Version, Status, ControlObjective, ContentJson,
                     AutomationLevel, AuthorActorKey, CreatedUtc, UpdatedUtc)
                VALUES
                    (@VersionId, @PatternId, @TenantId, N'1', 1, N'parent', N'{}',
                     1, N'test', @UtcNow, @UtcNow);

                INSERT INTO dbo.RemediationInstances
                    (InstanceId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, PatternVersionId,
                     PatternKey, FrozenPatternVersion, AutomationLevel, Status, CreatedByActorKey, CreatedUtc, UpdatedUtc)
                VALUES
                    (@InstanceId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @PatternId, @VersionId,
                     @PatternKey, N'1', 1, 1, N'test', @UtcNow, @UtcNow);
            END
            """,
            new
            {
                PackageId = packageId,
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                SnapshotId = verificationSnapshotId,
                InstanceId = instanceId,
                FindingId = findingId,
                PatternId = patternId,
                PatternKey = "sn-hand-05-" + instanceId.ToString("N"),
                VersionId = versionId,
                UtcNow = utcNow,
                PayloadHash = new byte[32],
            });
    }
}
