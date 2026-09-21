using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecurityEvidencePathRoutingRepository(ISqlConnectionFactory connectionFactory)
    : ISecurityEvidencePathRoutingRepository
{
    public async Task<IReadOnlyList<SecurityEvidencePathRoutingRecord>> ListByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT RoutingRowId, TenantId, PathId, FindingId, RoutingRole, PrincipalId, DisplayName,
                                  ProvenanceKind, SourceReference, CreatedUtc, UpdatedUtc
                           FROM dbo.SecurityEvidencePathRouting
                           WHERE TenantId = @TenantId AND PathId = @PathId
                           ORDER BY RoutingRole;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RoutingRow> rows = await conn.QueryAsync<RoutingRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, PathId = pathId }, cancellationToken: cancellationToken));

        return rows.Select(MapRow).ToList();
    }

    public async Task<IReadOnlyList<SecurityEvidencePathRoutingRecord>> ListByPathIdInScopeAsync(
        ProjectScopeKey scope,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT r.RoutingRowId, r.TenantId, r.PathId, r.FindingId, r.RoutingRole, r.PrincipalId, r.DisplayName,
                                  r.ProvenanceKind, r.SourceReference, r.CreatedUtc, r.UpdatedUtc
                           FROM dbo.SecurityEvidencePathRouting r
                           INNER JOIN dbo.SecurityEvidencePaths p
                               ON p.TenantId = r.TenantId AND p.PathId = r.PathId
                           WHERE r.TenantId = @TenantId
                             AND r.PathId = @PathId
                             AND p.WorkspaceId = @WorkspaceId
                             AND p.ProjectId = @ProjectId
                           ORDER BY r.RoutingRole;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<RoutingRow> rows = await conn.QueryAsync<RoutingRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, PathId = pathId },
                cancellationToken: cancellationToken));

        return rows.Select(MapRow).ToList();
    }

    public async Task ReplaceRoutingForPathAsync(
        Guid tenantId,
        Guid pathId,
        IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(routingRows);

        foreach (SecurityEvidencePathRoutingRecord row in routingRows)
        {
            SecurityEvidencePathRoutingGuard.EnsureAllowedProvenance(row.ProvenanceKind);
        }

        SecurityEvidencePathRoutingGuard.EnsureSeparationOfDuties(routingRows);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        using System.Data.IDbTransaction transaction = conn.BeginTransaction();

        try
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    """
                    DELETE FROM dbo.SecurityEvidencePathRouting
                    WHERE TenantId = @TenantId AND PathId = @PathId;
                    """,
                    new { TenantId = tenantId, PathId = pathId },
                    transaction,
                    cancellationToken: cancellationToken));

            if (routingRows.Count > 0)
            {
                const string insertSql = """
                                         INSERT INTO dbo.SecurityEvidencePathRouting
                                             (RoutingRowId, TenantId, PathId, FindingId, RoutingRole, PrincipalId,
                                              DisplayName, ProvenanceKind, SourceReference, CreatedUtc, UpdatedUtc)
                                         VALUES
                                             (@RoutingRowId, @TenantId, @PathId, @FindingId, @RoutingRole, @PrincipalId,
                                              @DisplayName, @ProvenanceKind, @SourceReference, @CreatedUtc, @UpdatedUtc);
                                         """;

                foreach (SecurityEvidencePathRoutingRecord row in routingRows)
                {
                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            insertSql,
                            new
                            {
                                row.RoutingRowId,
                                row.TenantId,
                                row.PathId,
                                row.FindingId,
                                RoutingRole = (int)row.Role,
                                row.PrincipalId,
                                row.DisplayName,
                                ProvenanceKind = (int)row.ProvenanceKind,
                                row.SourceReference,
                                row.CreatedUtc,
                                row.UpdatedUtc,
                            },
                            transaction,
                            cancellationToken: cancellationToken));
                }
            }

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task ReplaceRoutingForPathInScopeAsync(
        ProjectScopeKey scope,
        Guid pathId,
        IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(routingRows);

        foreach (SecurityEvidencePathRoutingRecord row in routingRows)
            SecurityEvidencePathRoutingGuard.EnsureAllowedProvenance(row.ProvenanceKind);

        SecurityEvidencePathRoutingGuard.EnsureSeparationOfDuties(routingRows);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using System.Data.IDbTransaction transaction = conn.BeginTransaction();

        const string ensurePathSql = """
                                     SELECT COUNT(1)
                                     FROM dbo.SecurityEvidencePaths
                                     WHERE TenantId = @TenantId
                                       AND WorkspaceId = @WorkspaceId
                                       AND ProjectId = @ProjectId
                                       AND PathId = @PathId;
                                     """;

        int pathCount = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                ensurePathSql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, PathId = pathId },
                transaction,
                cancellationToken: cancellationToken));

        if (pathCount != 1)
            throw new InvalidOperationException("Scoped routing replacement target path was not found.");

        await conn.ExecuteAsync(
            new CommandDefinition(
                """
                DELETE r
                FROM dbo.SecurityEvidencePathRouting r
                INNER JOIN dbo.SecurityEvidencePaths p
                    ON p.TenantId = r.TenantId AND p.PathId = r.PathId
                WHERE r.TenantId = @TenantId
                  AND r.PathId = @PathId
                  AND p.WorkspaceId = @WorkspaceId
                  AND p.ProjectId = @ProjectId;
                """,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, PathId = pathId },
                transaction,
                cancellationToken: cancellationToken));

        const string insertSql = """
                                 INSERT INTO dbo.SecurityEvidencePathRouting
                                     (RoutingRowId, TenantId, PathId, FindingId, RoutingRole, PrincipalId,
                                      DisplayName, ProvenanceKind, SourceReference, CreatedUtc, UpdatedUtc)
                                 VALUES
                                     (@RoutingRowId, @TenantId, @PathId, @FindingId, @RoutingRole, @PrincipalId,
                                      @DisplayName, @ProvenanceKind, @SourceReference, @CreatedUtc, @UpdatedUtc);
                                 """;

        foreach (SecurityEvidencePathRoutingRecord row in routingRows)
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    insertSql,
                    new
                    {
                        row.RoutingRowId,
                        TenantId = scope.TenantId,
                        PathId = pathId,
                        row.FindingId,
                        RoutingRole = (int)row.Role,
                        row.PrincipalId,
                        row.DisplayName,
                        ProvenanceKind = (int)row.ProvenanceKind,
                        row.SourceReference,
                        row.CreatedUtc,
                        row.UpdatedUtc,
                    },
                    transaction,
                    cancellationToken: cancellationToken));
        }

        transaction.Commit();
    }

    private static SecurityEvidencePathRoutingRecord MapRow(RoutingRow row) =>
        new()
        {
            RoutingRowId = row.RoutingRowId,
            TenantId = row.TenantId,
            PathId = row.PathId,
            FindingId = row.FindingId,
            Role = (SecurityEvidencePathRoutingRole)row.RoutingRole,
            PrincipalId = row.PrincipalId,
            DisplayName = row.DisplayName,
            ProvenanceKind = (ProvenanceKind)row.ProvenanceKind,
            SourceReference = row.SourceReference,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
        };

    private sealed class RoutingRow
    {
        public Guid RoutingRowId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid PathId
        {
            get;
            init;
        }

        public Guid? FindingId
        {
            get;
            init;
        }

        public int RoutingRole
        {
            get;
            init;
        }

        public string? PrincipalId
        {
            get;
            init;
        }

        public string? DisplayName
        {
            get;
            init;
        }

        public int ProvenanceKind
        {
            get;
            init;
        }

        public string SourceReference
        {
            get;
            init;
        } = string.Empty;

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
}
