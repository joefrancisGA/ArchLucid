using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    private static readonly string VisibleResourceTypePredicate =
        AzureInventoryVisibleSnapshotProjection.BuildSqlResourceTypeVisiblePredicate("r.ResourceType");

    private static readonly string VisibleAzureResourceIdPredicate =
        AzureInventoryVisibleSnapshotProjection.BuildSqlAzureResourceIdVisiblePredicate("r.AzureResourceId");

    private static readonly string VisibleFromResourceTypePredicate =
        AzureInventoryVisibleSnapshotProjection.BuildSqlResourceTypeVisiblePredicate("fromResource.ResourceType");

    private static readonly string VisibleFromAzureResourceIdPredicate =
        AzureInventoryVisibleSnapshotProjection.BuildSqlAzureResourceIdVisiblePredicate("fromResource.AzureResourceId");

    private static readonly string VisibleToResourceTypePredicate =
        AzureInventoryVisibleSnapshotProjection.BuildSqlResourceTypeVisiblePredicate("toResource.ResourceType");

    private static readonly string VisibleToAzureResourceIdPredicate =
        AzureInventoryVisibleSnapshotProjection.BuildSqlAzureResourceIdVisiblePredicate("toResource.AzureResourceId");

    public async Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);

        const string countSql = """
                                SELECT COUNT(1)
                                FROM dbo.AzureInventorySnapshots s
                                LEFT JOIN dbo.AzureExtractorPackages p
                                    ON p.PackageId = s.PackageId
                                    AND p.TenantId = s.TenantId
                                    AND p.WorkspaceId = s.WorkspaceId
                                    AND p.ProjectId = s.ProjectId
                                WHERE s.TenantId = @TenantId
                                    AND s.WorkspaceId = @WorkspaceId
                                    AND s.ProjectId = @ProjectId
                                    AND s.CaptureStatus IN (@SucceededStatus, @PartialStatus)
                                    AND (
                                        @SubscriptionId IS NULL
                                        OR COALESCE(s.SubscriptionId, JSON_VALUE(p.ManifestJson, '$.subscriptionId')) = @SubscriptionId
                                    );
                                """;

        string listSql = $"""
                               SELECT
                                   s.SnapshotId, s.TenantId, s.WorkspaceId, s.ProjectId, s.PackageId,
                                   COALESCE(s.SubscriptionId, JSON_VALUE(p.ManifestJson, '$.subscriptionId')) AS SubscriptionId,
                                   s.SubscriptionName, s.CapturedUtc, s.CaptureStatus, s.CaptureVersion,
                                   (
                                       SELECT COUNT(1)
                                       FROM dbo.AzureInventoryResources r
                                       WHERE r.TenantId = s.TenantId
                                         AND r.SnapshotId = s.SnapshotId
                                         AND {VisibleResourceTypePredicate}
                                         AND {VisibleAzureResourceIdPredicate}
                                   ) AS ResourceCount,
                                   (
                                       SELECT COUNT(1)
                                       FROM dbo.AzureInventoryResourceRelationships rel
                                       WHERE rel.TenantId = s.TenantId
                                         AND rel.SnapshotId = s.SnapshotId
                                         AND (
                                             rel.FromAzureResourceId NOT LIKE '/subscriptions/%'
                                             OR EXISTS (
                                                 SELECT 1
                                                 FROM dbo.AzureInventoryResources fromResource
                                                 WHERE fromResource.TenantId = rel.TenantId
                                                   AND fromResource.SnapshotId = rel.SnapshotId
                                                   AND fromResource.AzureResourceId = rel.FromAzureResourceId
                                                   AND {VisibleFromResourceTypePredicate}
                                                   AND {VisibleFromAzureResourceIdPredicate}
                                             )
                                         )
                                         AND (
                                             rel.ToAzureResourceId NOT LIKE '/subscriptions/%'
                                             OR EXISTS (
                                                 SELECT 1
                                                 FROM dbo.AzureInventoryResources toResource
                                                 WHERE toResource.TenantId = rel.TenantId
                                                   AND toResource.SnapshotId = rel.SnapshotId
                                                   AND toResource.AzureResourceId = rel.ToAzureResourceId
                                                   AND {VisibleToResourceTypePredicate}
                                                   AND {VisibleToAzureResourceIdPredicate}
                                             )
                                         )
                                   ) AS RelationshipCount,
                                   s.CaptureMethod, s.CollectorVersion,
                                   s.RequestedBy, s.DurationMs, s.CompletenessScore, s.WarningCount, s.CompletenessWarningsJson, s.ErrorCount,
                                   s.ContentHashSha256, s.CreatedUtc, s.UpdatedUtc,
                                   JSON_VALUE(p.ManifestJson, '$.subscriptionName') AS ManifestSubscriptionName,
                                   sibling.SiblingSubscriptionName,
                                   architectureBinding.ArchitectureDisplayName
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
                               OUTER APPLY (
                                   SELECT TOP (1)
                                       a.DisplayName AS ArchitectureDisplayName
                                   FROM dbo.ArchitectureInventoryBindings bib
                                   INNER JOIN dbo.Architectures a
                                       ON a.ArchitectureId = bib.ArchitectureId
                                   WHERE bib.TenantId = s.TenantId
                                       AND bib.SnapshotId = s.SnapshotId
                                   ORDER BY bib.BoundUtc DESC
                               ) architectureBinding
                               WHERE s.TenantId = @TenantId
                                   AND s.WorkspaceId = @WorkspaceId
                                   AND s.ProjectId = @ProjectId
                                   AND s.CaptureStatus IN (@SucceededStatus, @PartialStatus)
                                   AND (
                                       @SubscriptionId IS NULL
                                       OR COALESCE(s.SubscriptionId, JSON_VALUE(p.ManifestJson, '$.subscriptionId')) = @SubscriptionId
                                   )
                               ORDER BY COALESCE(s.CapturedUtc, s.CreatedUtc) DESC
                               OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY;
                               """;

        object parameters = new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            SucceededStatus = (int)AzureInventoryCaptureStatus.Succeeded,
            PartialStatus = (int)AzureInventoryCaptureStatus.Partial,
            SubscriptionId = string.IsNullOrWhiteSpace(subscriptionId) ? null : subscriptionId.Trim(),
            Skip = skip,
            PageSize = safePageSize,
        };

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int totalCount = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken));

        IEnumerable<ListRow> rows = await conn.QueryAsync<ListRow>(
            new CommandDefinition(
                listSql,
                parameters,
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        IReadOnlyList<AzureInventorySnapshotRecord> items = rows.Select(MapListRow).ToList();

        return (items, totalCount);
    }

    private static AzureInventorySnapshotRecord MapListRow(ListRow row)
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
            ArchitectureDisplayName = row.ArchitectureDisplayName,
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

    private sealed class ListRow
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

        public string? ArchitectureDisplayName
        {
            get;
            init;
        }
    }
}
