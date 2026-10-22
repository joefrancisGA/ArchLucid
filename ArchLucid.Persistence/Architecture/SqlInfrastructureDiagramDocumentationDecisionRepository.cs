using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

public sealed class SqlInfrastructureDiagramDocumentationDecisionRepository(
    ISqlConnectionFactory connectionFactory) : IInfrastructureDiagramDocumentationDecisionRepository
{
    public async Task UpsertAsync(
        InfrastructureDiagramDocumentationDecisionPersistRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
            MERGE dbo.InfrastructureDiagramDocumentationDecisions AS target
            USING (
                SELECT @TenantId AS TenantId, @ScopeId AS ScopeId,
                       @SubjectKind AS SubjectKind, @SubjectKey AS SubjectKey
            ) AS source
            ON target.TenantId = source.TenantId
               AND target.ScopeId = source.ScopeId
               AND target.SubjectKind = source.SubjectKind
               AND target.SubjectKey = source.SubjectKey
            WHEN MATCHED THEN
                UPDATE SET
                    SnapshotId = @SnapshotId,
                    Decision = @Decision,
                    DiagramFingerprint = @DiagramFingerprint,
                    EvidenceFingerprint = @EvidenceFingerprint,
                    SavedByUserOid = @SavedByUserOid,
                    UpdatedUtc = @UpdatedUtc
            WHEN NOT MATCHED THEN
                INSERT (
                    DecisionId, TenantId, ScopeId, SnapshotId, SubjectKind,
                    SubjectKey, Decision, DiagramFingerprint, EvidenceFingerprint, SavedByUserOid, CreatedUtc, UpdatedUtc)
                VALUES (
                    @DecisionId, @TenantId, @ScopeId, @SnapshotId, @SubjectKind,
                    @SubjectKey, @Decision, @DiagramFingerprint, @EvidenceFingerprint, @SavedByUserOid, @CreatedUtc, @UpdatedUtc);
            """;

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task<InfrastructureDiagramDocumentationDecisionPersistRecord?> TryGetAsync(
        Guid tenantId,
        Guid scopeId,
        string subjectKind,
        string subjectKey,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT DecisionId, TenantId, ScopeId, SnapshotId, SubjectKind,
                   SubjectKey, Decision, DiagramFingerprint, EvidenceFingerprint, SavedByUserOid, CreatedUtc, UpdatedUtc
            FROM dbo.InfrastructureDiagramDocumentationDecisions
            WHERE TenantId = @TenantId
              AND ScopeId = @ScopeId
              AND SubjectKind = @SubjectKind
              AND SubjectKey = @SubjectKey;
            """;

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<InfrastructureDiagramDocumentationDecisionPersistRecord>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ScopeId = scopeId, SubjectKind = subjectKind, SubjectKey = subjectKey },
                cancellationToken: cancellationToken));
    }

    public async Task<InfrastructureDiagramDocumentationDecisionPersistRecord?> TryGetLatestBySubjectAsync(
        Guid tenantId,
        string diagramFingerprint,
        string subjectKind,
        string subjectKey,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT TOP (1) DecisionId, TenantId, ScopeId, SnapshotId, SubjectKind,
                   SubjectKey, Decision, EvidenceFingerprint, SavedByUserOid, CreatedUtc, UpdatedUtc
            FROM dbo.InfrastructureDiagramDocumentationDecisions
            WHERE TenantId = @TenantId
              AND SubjectKind = @SubjectKind
              AND SubjectKey = @SubjectKey
              AND DiagramFingerprint = @DiagramFingerprint
            ORDER BY UpdatedUtc DESC;
            """;

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<InfrastructureDiagramDocumentationDecisionPersistRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    DiagramFingerprint = diagramFingerprint,
                    SubjectKind = subjectKind,
                    SubjectKey = subjectKey,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<InfrastructureDiagramDocumentationDecisionPersistRecord>> ListByDiagramFingerprintAsync(
        Guid tenantId,
        string diagramFingerprint,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            WITH ranked AS
            (
                SELECT DecisionId, TenantId, ScopeId, SnapshotId, SubjectKind,
                       SubjectKey, Decision, DiagramFingerprint, EvidenceFingerprint,
                       SavedByUserOid, CreatedUtc, UpdatedUtc,
                       ROW_NUMBER() OVER (
                           PARTITION BY SubjectKind, SubjectKey
                           ORDER BY UpdatedUtc DESC, DecisionId DESC) AS RowNumber
                FROM dbo.InfrastructureDiagramDocumentationDecisions
                WHERE TenantId = @TenantId
                  AND DiagramFingerprint = @DiagramFingerprint
            )
            SELECT DecisionId, TenantId, ScopeId, SnapshotId, SubjectKind,
                   SubjectKey, Decision, DiagramFingerprint, EvidenceFingerprint,
                   SavedByUserOid, CreatedUtc, UpdatedUtc
            FROM ranked
            WHERE RowNumber = 1
            ORDER BY SubjectKind, SubjectKey;
            """;

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<InfrastructureDiagramDocumentationDecisionPersistRecord> records =
            await connection.QueryAsync<InfrastructureDiagramDocumentationDecisionPersistRecord>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, DiagramFingerprint = diagramFingerprint },
                    cancellationToken: cancellationToken));

        return records.ToList();
    }

    public async Task<IReadOnlyList<InfrastructureDiagramDocumentationDecisionPersistRecord>> ListByScopeAndDiagramFingerprintAsync(
        Guid tenantId,
        Guid scopeId,
        string diagramFingerprint,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT DecisionId, TenantId, ScopeId, SnapshotId, SubjectKind,
                   SubjectKey, Decision, DiagramFingerprint, EvidenceFingerprint,
                   SavedByUserOid, CreatedUtc, UpdatedUtc
            FROM dbo.InfrastructureDiagramDocumentationDecisions
            WHERE TenantId = @TenantId
              AND ScopeId = @ScopeId
              AND DiagramFingerprint = @DiagramFingerprint
            ORDER BY SubjectKind, SubjectKey;
            """;

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<InfrastructureDiagramDocumentationDecisionPersistRecord> records =
            await connection.QueryAsync<InfrastructureDiagramDocumentationDecisionPersistRecord>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        ScopeId = scopeId,
                        DiagramFingerprint = diagramFingerprint,
                    },
                    cancellationToken: cancellationToken));

        return records.ToList();
    }
}
