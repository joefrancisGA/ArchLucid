using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecurityEvidencePathRepository(ISqlConnectionFactory connectionFactory)
    : ISecurityEvidencePathRepository
{
    public async Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT PathId, TenantId, WorkspaceId, ProjectId, SnapshotId, PathKind, PathConfidenceBand,
                                  CanonicalHopHashSha256, WeakestHopOrdinal, WeakestHopReason, CrownJewelAssertionId,
                                  CreatedUtc, UpdatedUtc
                           FROM dbo.SecurityEvidencePaths
                           WHERE TenantId = @TenantId AND PathId = @PathId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        PathRow? row = await conn.QuerySingleOrDefaultAsync<PathRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, PathId = pathId }, cancellationToken: cancellationToken));

        return row is null ? null : MapPath(row);
    }

    public async Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
        Guid tenantId,
        Guid snapshotId,
        byte[] canonicalHopHashSha256,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(canonicalHopHashSha256);

        const string sql = """
                           SELECT PathId, TenantId, WorkspaceId, ProjectId, SnapshotId, PathKind, PathConfidenceBand,
                                  CanonicalHopHashSha256, WeakestHopOrdinal, WeakestHopReason, CrownJewelAssertionId,
                                  CreatedUtc, UpdatedUtc
                           FROM dbo.SecurityEvidencePaths
                           WHERE TenantId = @TenantId
                             AND SnapshotId = @SnapshotId
                             AND CanonicalHopHashSha256 = @CanonicalHopHashSha256;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        PathRow? row = await conn.QuerySingleOrDefaultAsync<PathRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    SnapshotId = snapshotId,
                    CanonicalHopHashSha256 = canonicalHopHashSha256,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : MapPath(row);
    }

    public async Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT HopRowId, PathId, TenantId, HopOrdinal, FromNodeId, ToNodeId, EdgeType,
                                  ProvenanceKind, HopConfidenceBand, InferenceSource, EvidenceReference, CloudResourceId
                           FROM dbo.SecurityEvidencePathHops
                           WHERE TenantId = @TenantId AND PathId = @PathId
                           ORDER BY HopOrdinal;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<HopRow> rows = await conn.QueryAsync<HopRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, PathId = pathId }, cancellationToken: cancellationToken));

        return rows.Select(MapHop).ToList();
    }

    public async Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
        SecurityEvidencePathRecord pathHeader,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        CancellationToken cancellationToken = default)
    {
        SecurityEvidencePathGuard.ValidatedPath validated =
            SecurityEvidencePathGuard.ValidateAndMaterialize(pathHeader, hops);

        SecurityEvidencePathRecord? existing = await TryGetByCanonicalHashAsync(
            validated.Path.TenantId,
            validated.Path.SnapshotId,
            validated.Path.CanonicalHopHashSha256,
            cancellationToken);

        if (existing is not null)
        {
            return new SecurityEvidencePathInsertResult
            {
                PathId = existing.PathId,
                Created = false,
            };
        }

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using System.Data.IDbTransaction tx = conn.BeginTransaction();

        const string insertPathSql = """
                                     INSERT INTO dbo.SecurityEvidencePaths
                                     (
                                         PathId, TenantId, WorkspaceId, ProjectId, SnapshotId, PathKind, PathConfidenceBand,
                                         CanonicalHopHashSha256, WeakestHopOrdinal, WeakestHopReason, CrownJewelAssertionId,
                                         CreatedUtc, UpdatedUtc
                                     )
                                     VALUES
                                     (
                                         @PathId, @TenantId, @WorkspaceId, @ProjectId, @SnapshotId, @PathKind, @PathConfidenceBand,
                                         @CanonicalHopHashSha256, @WeakestHopOrdinal, @WeakestHopReason, @CrownJewelAssertionId,
                                         @CreatedUtc, @UpdatedUtc
                                     );
                                     """;

        await conn.ExecuteAsync(
            new CommandDefinition(
                insertPathSql,
                new
                {
                    validated.Path.PathId,
                    validated.Path.TenantId,
                    validated.Path.WorkspaceId,
                    validated.Path.ProjectId,
                    validated.Path.SnapshotId,
                    PathKind = (int)validated.Path.PathKind,
                    PathConfidenceBand = (int)validated.Path.PathConfidenceBand,
                    validated.Path.CanonicalHopHashSha256,
                    validated.Path.WeakestHopOrdinal,
                    validated.Path.WeakestHopReason,
                    validated.Path.CrownJewelAssertionId,
                    validated.Path.CreatedUtc,
                    validated.Path.UpdatedUtc,
                },
                transaction: tx,
                cancellationToken: cancellationToken));

        const string insertHopSql = """
                                      INSERT INTO dbo.SecurityEvidencePathHops
                                      (
                                          HopRowId, PathId, TenantId, HopOrdinal, FromNodeId, ToNodeId, EdgeType,
                                          ProvenanceKind, HopConfidenceBand, InferenceSource, EvidenceReference, CloudResourceId
                                      )
                                      VALUES
                                      (
                                          @HopRowId, @PathId, @TenantId, @HopOrdinal, @FromNodeId, @ToNodeId, @EdgeType,
                                          @ProvenanceKind, @HopConfidenceBand, @InferenceSource, @EvidenceReference, @CloudResourceId
                                      );
                                      """;

        foreach (SecurityEvidencePathHopRecord hop in validated.Hops)
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    insertHopSql,
                    new
                    {
                        hop.HopRowId,
                        hop.PathId,
                        hop.TenantId,
                        hop.HopOrdinal,
                        hop.FromNodeId,
                        hop.ToNodeId,
                        hop.EdgeType,
                        ProvenanceKind = (int)hop.ProvenanceKind,
                        HopConfidenceBand = (int)hop.HopConfidenceBand,
                        hop.InferenceSource,
                        hop.EvidenceReference,
                        hop.CloudResourceId,
                    },
                    transaction: tx,
                    cancellationToken: cancellationToken));
        }

        tx.Commit();

        return new SecurityEvidencePathInsertResult
        {
            PathId = validated.Path.PathId,
            Created = true,
        };
    }

    private static SecurityEvidencePathRecord MapPath(PathRow row) =>
        new()
        {
            PathId = row.PathId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            SnapshotId = row.SnapshotId,
            PathKind = (PathKind)row.PathKind,
            PathConfidenceBand = (PathConfidenceBand)row.PathConfidenceBand,
            CanonicalHopHashSha256 = row.CanonicalHopHashSha256,
            WeakestHopOrdinal = row.WeakestHopOrdinal,
            WeakestHopReason = row.WeakestHopReason,
            CrownJewelAssertionId = row.CrownJewelAssertionId,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
        };

    private static SecurityEvidencePathHopRecord MapHop(HopRow row) =>
        new()
        {
            HopRowId = row.HopRowId,
            PathId = row.PathId,
            TenantId = row.TenantId,
            HopOrdinal = row.HopOrdinal,
            FromNodeId = row.FromNodeId,
            ToNodeId = row.ToNodeId,
            EdgeType = row.EdgeType,
            ProvenanceKind = (ProvenanceKind)row.ProvenanceKind,
            HopConfidenceBand = (PathConfidenceBand)row.HopConfidenceBand,
            InferenceSource = row.InferenceSource,
            EvidenceReference = row.EvidenceReference,
            CloudResourceId = row.CloudResourceId,
        };

    private sealed class PathRow
    {
        public Guid PathId
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

        public Guid SnapshotId
        {
            get;
            init;
        }

        public int PathKind
        {
            get;
            init;
        }

        public int PathConfidenceBand
        {
            get;
            init;
        }

        public byte[] CanonicalHopHashSha256
        {
            get;
            init;
        } = [];

        public int WeakestHopOrdinal
        {
            get;
            init;
        }

        public string WeakestHopReason
        {
            get;
            init;
        } = string.Empty;

        public Guid? CrownJewelAssertionId
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
    }

    private sealed class HopRow
    {
        public Guid HopRowId
        {
            get;
            init;
        }

        public Guid PathId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public int HopOrdinal
        {
            get;
            init;
        }

        public string FromNodeId
        {
            get;
            init;
        } = string.Empty;

        public string ToNodeId
        {
            get;
            init;
        } = string.Empty;

        public string EdgeType
        {
            get;
            init;
        } = string.Empty;

        public int ProvenanceKind
        {
            get;
            init;
        }

        public int HopConfidenceBand
        {
            get;
            init;
        }

        public string? InferenceSource
        {
            get;
            init;
        }

        public string EvidenceReference
        {
            get;
            init;
        } = string.Empty;

        public Guid? CloudResourceId
        {
            get;
            init;
        }
    }
}
