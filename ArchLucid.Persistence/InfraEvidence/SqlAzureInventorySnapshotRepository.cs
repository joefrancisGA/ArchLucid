using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository(ISqlConnectionFactory connectionFactory)
    : IAzureInventorySnapshotRepository
{
    public async Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.AzureInventorySnapshots
                           (
                               SnapshotId, TenantId, WorkspaceId, ProjectId, PackageId,
                               SubscriptionId, SubscriptionName, CapturedUtc, CaptureStatus, CaptureVersion,
                               ResourceCount, RelationshipCount, CaptureMethod, CollectorVersion,
                               RequestedBy, DurationMs, CompletenessScore, WarningCount, ErrorCount,
                               ContentHashSha256, CreatedUtc, UpdatedUtc
                           )
                           VALUES
                           (
                               @SnapshotId, @TenantId, @WorkspaceId, @ProjectId, @PackageId,
                               @SubscriptionId, @SubscriptionName, @CapturedUtc, @CaptureStatus, @CaptureVersion,
                               @ResourceCount, @RelationshipCount, @CaptureMethod, @CollectorVersion,
                               @RequestedBy, @DurationMs, @CompletenessScore, @WarningCount, @ErrorCount,
                               @ContentHashSha256, @CreatedUtc, @UpdatedUtc
                           );
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.SnapshotId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    record.PackageId,
                    record.SubscriptionId,
                    record.SubscriptionName,
                    record.CapturedUtc,
                    CaptureStatus = (int)record.CaptureStatus,
                    record.CaptureVersion,
                    record.ResourceCount,
                    record.RelationshipCount,
                    CaptureMethod = (int)record.CaptureMethod,
                    record.CollectorVersion,
                    record.RequestedBy,
                    record.DurationMs,
                    record.CompletenessScore,
                    record.WarningCount,
                    record.ErrorCount,
                    record.ContentHashSha256,
                    record.CreatedUtc,
                    record.UpdatedUtc,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));
    }

    public async Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
        ScopeContext scope,
        Guid packageId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT TOP (1)
                               s.SnapshotId, s.TenantId, s.WorkspaceId, s.ProjectId, s.PackageId,
                               COALESCE(s.SubscriptionId, JSON_VALUE(p.ManifestJson, '$.subscriptionId')) AS SubscriptionId,
                               s.SubscriptionName, s.CapturedUtc, s.CaptureStatus, s.CaptureVersion,
                               s.ResourceCount, s.RelationshipCount, s.CaptureMethod, s.CollectorVersion,
                               s.RequestedBy, s.DurationMs, s.CompletenessScore, s.WarningCount, s.CompletenessWarningsJson, s.ErrorCount,
                               s.ContentHashSha256, s.CreatedUtc, s.UpdatedUtc,
                               JSON_VALUE(p.ManifestJson, '$.subscriptionName') AS ManifestSubscriptionName,
                               sibling.SiblingSubscriptionName
                           FROM dbo.AzureInventorySnapshots s
                           LEFT JOIN dbo.AzureExtractorPackages p
                               ON p.PackageId = s.PackageId
                               AND p.TenantId = s.TenantId
                               AND p.WorkspaceId = s.WorkspaceId
                               AND p.ProjectId = s.ProjectId
                           OUTER APPLY (
                               SELECT TOP (1)
                                   COALESCE(
                                       sib.SubscriptionName,
                                       JSON_VALUE(pSib.ManifestJson, '$.subscriptionName')
                                   ) AS SiblingSubscriptionName
                               FROM dbo.AzureInventorySnapshots sib
                               LEFT JOIN dbo.AzureExtractorPackages pSib
                                   ON pSib.PackageId = sib.PackageId
                                   AND pSib.TenantId = sib.TenantId
                                   AND pSib.WorkspaceId = sib.WorkspaceId
                                   AND pSib.ProjectId = sib.ProjectId
                               WHERE sib.TenantId = s.TenantId
                                   AND sib.WorkspaceId = s.WorkspaceId
                                   AND sib.ProjectId = s.ProjectId
                                   AND sib.CaptureStatus IN (@SucceededStatus, @PartialStatus)
                                   AND COALESCE(
                                       sib.SubscriptionId,
                                       JSON_VALUE(pSib.ManifestJson, '$.subscriptionId')
                                   ) = COALESCE(
                                       s.SubscriptionId,
                                       JSON_VALUE(p.ManifestJson, '$.subscriptionId')
                                   )
                                   AND COALESCE(
                                       sib.SubscriptionName,
                                       JSON_VALUE(pSib.ManifestJson, '$.subscriptionName')
                                   ) IS NOT NULL
                               ORDER BY COALESCE(sib.CapturedUtc, sib.CreatedUtc) DESC
                           ) sibling
                           WHERE s.TenantId = @TenantId
                               AND s.WorkspaceId = @WorkspaceId
                               AND s.ProjectId = @ProjectId
                               AND s.PackageId = @PackageId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await conn.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    PackageId = packageId,
                    SucceededStatus = (int)AzureInventoryCaptureStatus.Succeeded,
                    PartialStatus = (int)AzureInventoryCaptureStatus.Partial,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT TOP (1)
                               s.SnapshotId, s.TenantId, s.WorkspaceId, s.ProjectId, s.PackageId,
                               COALESCE(s.SubscriptionId, JSON_VALUE(p.ManifestJson, '$.subscriptionId')) AS SubscriptionId,
                               s.SubscriptionName, s.CapturedUtc, s.CaptureStatus, s.CaptureVersion,
                               s.ResourceCount, s.RelationshipCount, s.CaptureMethod, s.CollectorVersion,
                               s.RequestedBy, s.DurationMs, s.CompletenessScore, s.WarningCount, s.CompletenessWarningsJson, s.ErrorCount,
                               s.ContentHashSha256, s.CreatedUtc, s.UpdatedUtc,
                               JSON_VALUE(p.ManifestJson, '$.subscriptionName') AS ManifestSubscriptionName,
                               sibling.SiblingSubscriptionName
                           FROM dbo.AzureInventorySnapshots s
                           LEFT JOIN dbo.AzureExtractorPackages p
                               ON p.PackageId = s.PackageId
                               AND p.TenantId = s.TenantId
                               AND p.WorkspaceId = s.WorkspaceId
                               AND p.ProjectId = s.ProjectId
                           OUTER APPLY (
                               SELECT TOP (1)
                                   COALESCE(
                                       sib.SubscriptionName,
                                       JSON_VALUE(pSib.ManifestJson, '$.subscriptionName')
                                   ) AS SiblingSubscriptionName
                               FROM dbo.AzureInventorySnapshots sib
                               LEFT JOIN dbo.AzureExtractorPackages pSib
                                   ON pSib.PackageId = sib.PackageId
                                   AND pSib.TenantId = sib.TenantId
                                   AND pSib.WorkspaceId = sib.WorkspaceId
                                   AND pSib.ProjectId = sib.ProjectId
                               WHERE sib.TenantId = s.TenantId
                                   AND sib.WorkspaceId = s.WorkspaceId
                                   AND sib.ProjectId = s.ProjectId
                                   AND sib.CaptureStatus IN (@SucceededStatus, @PartialStatus)
                                   AND COALESCE(
                                       sib.SubscriptionId,
                                       JSON_VALUE(pSib.ManifestJson, '$.subscriptionId')
                                   ) = COALESCE(
                                       s.SubscriptionId,
                                       JSON_VALUE(p.ManifestJson, '$.subscriptionId')
                                   )
                                   AND COALESCE(
                                       sib.SubscriptionName,
                                       JSON_VALUE(pSib.ManifestJson, '$.subscriptionName')
                                   ) IS NOT NULL
                               ORDER BY COALESCE(sib.CapturedUtc, sib.CreatedUtc) DESC
                           ) sibling
                           WHERE s.TenantId = @TenantId
                               AND s.WorkspaceId = @WorkspaceId
                               AND s.ProjectId = @ProjectId
                               AND s.SnapshotId = @SnapshotId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await conn.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SnapshotId = snapshotId,
                    SucceededStatus = (int)AzureInventoryCaptureStatus.Succeeded,
                    PartialStatus = (int)AzureInventoryCaptureStatus.Partial,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    private static AzureInventorySnapshotRecord Map(Row row)
    {
        (string? subscriptionId, string? subscriptionName) = AzureInventorySnapshotSubscriptionIdentity.Resolve(
            row.SubscriptionId,
            row.SubscriptionName,
            manifestSubscriptionId: null,
            row.ManifestSubscriptionName,
            row.SiblingSubscriptionName);

        return new AzureInventorySnapshotRecord
        {
            SnapshotId = row.SnapshotId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            PackageId = row.PackageId,
            SubscriptionId = subscriptionId,
            SubscriptionName = subscriptionName,
            CapturedUtc = row.CapturedUtc,
            CaptureStatus = (AzureInventoryCaptureStatus)row.CaptureStatus,
            CaptureVersion = row.CaptureVersion,
            ResourceCount = row.ResourceCount,
            RelationshipCount = row.RelationshipCount,
            CaptureMethod = (AzureInventoryCaptureMethod)row.CaptureMethod,
            CollectorVersion = row.CollectorVersion,
            RequestedBy = row.RequestedBy,
            DurationMs = row.DurationMs,
            CompletenessScore = row.CompletenessScore,
            WarningCount = row.WarningCount,
            CompletenessWarningsJson = row.CompletenessWarningsJson,
            ErrorCount = row.ErrorCount,
            ContentHashSha256 = row.ContentHashSha256,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
        };
    }

    private sealed class Row
    {
        public Guid SnapshotId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid ProjectId
        {
            get;
            init;
        }

        public Guid PackageId
        {
            get;
            init;
        }

        public string? SubscriptionId
        {
            get;
            init;
        }

        public string? SubscriptionName
        {
            get;
            init;
        }

        public DateTime? CapturedUtc
        {
            get;
            init;
        }

        public int CaptureStatus
        {
            get;
            init;
        }

        public string? CaptureVersion
        {
            get;
            init;
        }

        public int ResourceCount
        {
            get;
            init;
        }

        public int RelationshipCount
        {
            get;
            init;
        }

        public int CaptureMethod
        {
            get;
            init;
        }

        public string? CollectorVersion
        {
            get;
            init;
        }

        public string? RequestedBy
        {
            get;
            init;
        }

        public int? DurationMs
        {
            get;
            init;
        }

        public decimal? CompletenessScore
        {
            get;
            init;
        }

        public int WarningCount
        {
            get;
            init;
        }

        public string? CompletenessWarningsJson
        {
            get;
            init;
        }

        public int ErrorCount
        {
            get;
            init;
        }

        public byte[]? ContentHashSha256
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }

        public string? ManifestSubscriptionName
        {
            get;
            init;
        }

        public string? SiblingSubscriptionName
        {
            get;
            init;
        }
    }
}
