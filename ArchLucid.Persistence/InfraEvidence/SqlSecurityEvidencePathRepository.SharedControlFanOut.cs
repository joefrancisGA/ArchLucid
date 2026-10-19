using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlSecurityEvidencePathRepository
{
    public async Task<IReadOnlyList<SecurityEvidencePathWithHops>> ListSharedControlFanOutHopsBySnapshotAsync(
        ProjectSnapshotScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            SELECT p.PathId, p.TenantId, p.WorkspaceId, p.ProjectId, p.SnapshotId, p.PathKind, p.PathConfidenceBand,
                p.CanonicalHopHashSha256, p.WeakestHopOrdinal, p.WeakestHopReason, p.CrownJewelAssertionId, p.CreatedUtc, p.UpdatedUtc
            FROM dbo.SecurityEvidencePaths p
            INNER JOIN dbo.SecurityEvidencePathHops h
                ON h.TenantId = p.TenantId AND h.PathId = p.PathId
            WHERE p.TenantId = @TenantId
              AND p.WorkspaceId = @WorkspaceId
              AND p.ProjectId = @ProjectId
              AND p.SnapshotId = @SnapshotId
              AND h.EdgeType = @FanOutEdgeType
            ORDER BY p.CreatedUtc, p.PathId;

            SELECT h.HopRowId, h.PathId, h.TenantId, h.HopOrdinal, h.FromNodeId, h.ToNodeId, h.EdgeType,
                h.ProvenanceKind, h.HopConfidenceBand, h.InferenceSource, h.EvidenceReference, h.CloudResourceId
            FROM dbo.SecurityEvidencePathHops h
            INNER JOIN dbo.SecurityEvidencePaths p ON p.TenantId = h.TenantId AND p.PathId = h.PathId
            WHERE p.TenantId = @TenantId
              AND p.WorkspaceId = @WorkspaceId
              AND p.ProjectId = @ProjectId
              AND p.SnapshotId = @SnapshotId
              AND h.EdgeType = @FanOutEdgeType
            ORDER BY h.PathId, h.HopOrdinal;
            """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using SqlMapper.GridReader reader = await conn.QueryMultipleAsync(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    scope.SnapshotId,
                    FanOutEdgeType = SecureNowArchitectConstants.SharedControlFanOutHopEdgeType,
                },
                commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken));

        List<PathRow> paths = (await reader.ReadAsync<PathRow>()).ToList();
        ILookup<Guid, SecurityEvidencePathHopRecord> hops = (await reader.ReadAsync<HopRow>())
            .Select(MapHop)
            .ToLookup(hop => hop.PathId);

        return paths
            .Select(path => new SecurityEvidencePathWithHops(
                MapPath(path),
                hops[path.PathId].Where(hop =>
                        hop.EdgeType.Equals(
                            SecureNowArchitectConstants.SharedControlFanOutHopEdgeType,
                            StringComparison.OrdinalIgnoreCase))
                    .ToList()))
            .Where(item => item.Hops.Count > 0)
            .ToList();
    }
}
