using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAuditControlEvaluationRepository(ISqlConnectionFactory connectionFactory)
    : IAuditControlEvaluationRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task InsertAsync(AuditControlEvaluationPersistRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.Evaluation);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (conn is not SqlConnection sqlConn)
            throw new InvalidOperationException("Audit control evaluation persist requires SqlConnection.");

        using System.Data.IDbTransaction tx = sqlConn.BeginTransaction();

        try
        {
            AuditControlEvaluationRecord evaluation = request.Evaluation;

            const string insertEvaluation = """
                                            INSERT INTO dbo.AuditControlEvaluations
                                            (
                                                EvaluationId, ControlId, FrameworkId, SnapshotId, TenantId, Outcome,
                                                PassCount, ApplicableCount, Confidence, EvaluationText, Formula,
                                                RequirementIdsJson, ExceptionIdsJson, ProvenanceKind,
                                                HumanDisposition, Notes, CreatedUtc
                                            )
                                            VALUES
                                            (
                                                @EvaluationId, @ControlId, @FrameworkId, @SnapshotId, @TenantId, @Outcome,
                                                @PassCount, @ApplicableCount, @Confidence, @EvaluationText, @Formula,
                                                @RequirementIdsJson, @ExceptionIdsJson, @ProvenanceKind,
                                                @HumanDisposition, @Notes, @CreatedUtc
                                            );
                                            """;

            await sqlConn.ExecuteAsync(
                new CommandDefinition(
                    insertEvaluation,
                    new
                    {
                        evaluation.EvaluationId,
                        evaluation.ControlId,
                        evaluation.FrameworkId,
                        evaluation.SnapshotId,
                        evaluation.TenantId,
                        Outcome = (int)evaluation.Outcome,
                        evaluation.PassCount,
                        evaluation.ApplicableCount,
                        evaluation.Confidence,
                        evaluation.EvaluationText,
                        evaluation.Formula,
                        RequirementIdsJson = JsonSerializer.Serialize(evaluation.RequirementIds, JsonOptions),
                        ExceptionIdsJson = JsonSerializer.Serialize(evaluation.ExceptionIds, JsonOptions),
                        ProvenanceKind = (int)evaluation.ProvenanceKind,
                        evaluation.HumanDisposition,
                        evaluation.Notes,
                        evaluation.CreatedUtc,
                    },
                    transaction: tx,
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));

            if (request.EvidenceItems.Count > 0)
            {
                const string insertItem = """
                                          INSERT INTO dbo.AuditEvidenceItems
                                          (
                                              EvidenceItemId, EvaluationId, RequirementId, TenantId, CloudResourceId,
                                              AzureResourceId, EvidenceType, Summary, CollectionStatus, ProvenanceKind,
                                              CreatedUtc
                                          )
                                          VALUES
                                          (
                                              @EvidenceItemId, @EvaluationId, @RequirementId, @TenantId, @CloudResourceId,
                                              @AzureResourceId, @EvidenceType, @Summary, @CollectionStatus, @ProvenanceKind,
                                              @CreatedUtc
                                          );
                                          """;

                foreach (AuditEvidenceItemRecord item in request.EvidenceItems)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertItem,
                            new
                            {
                                item.EvidenceItemId,
                                item.EvaluationId,
                                item.RequirementId,
                                item.TenantId,
                                item.CloudResourceId,
                                item.AzureResourceId,
                                item.EvidenceType,
                                item.Summary,
                                CollectionStatus = (int)item.CollectionStatus,
                                ProvenanceKind = (int)item.ProvenanceKind,
                                item.CreatedUtc,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task InsertInScopeAsync(
        ProjectScopeKey scope,
        AuditControlEvaluationPersistRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.Evaluation);

        const string ownershipSql = """
                                    SELECT COUNT(1)
                                    FROM dbo.AuditEvidenceSnapshots s
                                    INNER JOIN dbo.AuditAssessments a
                                        ON a.TenantId = s.TenantId AND a.AssessmentId = s.AssessmentId
                                    WHERE s.TenantId = @TenantId
                                      AND s.AuditEvidenceSnapshotId = @SnapshotId
                                      AND a.WorkspaceId = @WorkspaceId
                                      AND a.ProjectId = @ProjectId;
                                    """;
        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(ownershipSql, new
            {
                scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                SnapshotId = request.Evaluation.SnapshotId,
            }, cancellationToken: cancellationToken));
        if (count != 1)
            throw new InvalidOperationException("Scoped audit evaluation snapshot was not found.");

        if (request.Evaluation.TenantId != scope.TenantId
            || request.EvidenceItems.Any(item => item.TenantId != scope.TenantId))
            throw new InvalidOperationException("Scoped audit evaluation payload contains foreign tenant authority.");

        await InsertAsync(request, cancellationToken);
    }

    public async Task<AuditControlEvaluationRecord?> TryGetLatestByControlAsync(
        Guid tenantId,
        Guid controlId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1)
                               EvaluationId, ControlId, FrameworkId, SnapshotId, TenantId, Outcome,
                               PassCount, ApplicableCount, Confidence, EvaluationText, Formula,
                               RequirementIdsJson, ExceptionIdsJson, ProvenanceKind, HumanDisposition, Notes, CreatedUtc
                           FROM dbo.AuditControlEvaluations
                           WHERE TenantId = @TenantId AND ControlId = @ControlId AND SnapshotId = @SnapshotId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        EvaluationRow? row = await conn.QuerySingleOrDefaultAsync<EvaluationRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ControlId = controlId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<AuditControlEvaluationRecord?> TryGetLatestByControlInScopeAsync(
        ProjectScopeKey scope,
        Guid controlId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1)
                               e.EvaluationId, e.ControlId, e.FrameworkId, e.SnapshotId, e.TenantId, e.Outcome,
                               e.PassCount, e.ApplicableCount, e.Confidence, e.EvaluationText, e.Formula,
                               e.RequirementIdsJson, e.ExceptionIdsJson, e.ProvenanceKind, e.HumanDisposition, e.Notes, e.CreatedUtc
                           FROM dbo.AuditControlEvaluations e
                           INNER JOIN dbo.AuditEvidenceSnapshots s
                               ON s.TenantId = e.TenantId AND s.AuditEvidenceSnapshotId = e.SnapshotId
                           INNER JOIN dbo.AuditAssessments a
                               ON a.TenantId = s.TenantId AND a.AssessmentId = s.AssessmentId
                           WHERE e.TenantId = @TenantId
                             AND e.ControlId = @ControlId
                             AND e.SnapshotId = @SnapshotId
                             AND a.WorkspaceId = @WorkspaceId
                             AND a.ProjectId = @ProjectId
                           ORDER BY e.CreatedUtc DESC;
                           """;
        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        EvaluationRow? row = await conn.QuerySingleOrDefaultAsync<EvaluationRow>(
            new CommandDefinition(sql, new
            {
                scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                ControlId = controlId, SnapshotId = snapshotId,
            }, cancellationToken: cancellationToken));
        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationAsync(
        Guid tenantId,
        Guid evaluationId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT EvidenceItemId, EvaluationId, RequirementId, TenantId, CloudResourceId,
                                  AzureResourceId, EvidenceType, Summary, CollectionStatus, ProvenanceKind, CreatedUtc
                           FROM dbo.AuditEvidenceItems
                           WHERE TenantId = @TenantId AND EvaluationId = @EvaluationId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<EvidenceItemRow> rows = await conn.QueryAsync<EvidenceItemRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, EvaluationId = evaluationId },
                cancellationToken: cancellationToken));

        return rows
            .Select(row => new AuditEvidenceItemRecord
            {
                EvidenceItemId = row.EvidenceItemId,
                EvaluationId = row.EvaluationId,
                RequirementId = row.RequirementId,
                TenantId = row.TenantId,
                CloudResourceId = row.CloudResourceId,
                AzureResourceId = row.AzureResourceId,
                EvidenceType = row.EvidenceType,
                Summary = row.Summary,
                CollectionStatus = (AuditEvidenceCollectionStatus)row.CollectionStatus,
                ProvenanceKind = (ProvenanceKind)row.ProvenanceKind,
                CreatedUtc = row.CreatedUtc,
            })
            .ToList();
    }

    public async Task<IReadOnlyList<AuditEvidenceItemRecord>> ListEvidenceItemsByEvaluationInScopeAsync(
        ProjectScopeKey scope,
        Guid evaluationId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT i.EvidenceItemId, i.EvaluationId, i.RequirementId, i.TenantId, i.CloudResourceId,
                                  i.AzureResourceId, i.EvidenceType, i.Summary, i.CollectionStatus, i.ProvenanceKind, i.CreatedUtc
                           FROM dbo.AuditEvidenceItems i
                           INNER JOIN dbo.AuditControlEvaluations e
                               ON e.TenantId = i.TenantId AND e.EvaluationId = i.EvaluationId
                           INNER JOIN dbo.AuditEvidenceSnapshots s
                               ON s.TenantId = e.TenantId AND s.AuditEvidenceSnapshotId = e.SnapshotId
                           INNER JOIN dbo.AuditAssessments a
                               ON a.TenantId = s.TenantId AND a.AssessmentId = s.AssessmentId
                           WHERE i.TenantId = @TenantId
                             AND i.EvaluationId = @EvaluationId
                             AND a.WorkspaceId = @WorkspaceId
                             AND a.ProjectId = @ProjectId;
                           """;
        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<EvidenceItemRow> rows = await conn.QueryAsync<EvidenceItemRow>(
            new CommandDefinition(sql, new
            {
                scope.TenantId, scope.WorkspaceId, scope.ProjectId, EvaluationId = evaluationId,
            }, cancellationToken: cancellationToken));
        return rows.Select(row => new AuditEvidenceItemRecord
        {
            EvidenceItemId = row.EvidenceItemId, EvaluationId = row.EvaluationId, RequirementId = row.RequirementId,
            TenantId = row.TenantId, CloudResourceId = row.CloudResourceId, AzureResourceId = row.AzureResourceId,
            EvidenceType = row.EvidenceType, Summary = row.Summary,
            CollectionStatus = (AuditEvidenceCollectionStatus)row.CollectionStatus,
            ProvenanceKind = (ProvenanceKind)row.ProvenanceKind, CreatedUtc = row.CreatedUtc,
        }).ToList();
    }

    private static AuditControlEvaluationRecord Map(EvaluationRow row)
    {
        IReadOnlyList<Guid> requirementIds = [];
        IReadOnlyList<string> exceptionIds = [];

        if (!string.IsNullOrWhiteSpace(row.RequirementIdsJson))
            requirementIds = JsonSerializer.Deserialize<List<Guid>>(row.RequirementIdsJson, JsonOptions) ?? [];

        if (!string.IsNullOrWhiteSpace(row.ExceptionIdsJson))
            exceptionIds = JsonSerializer.Deserialize<List<string>>(row.ExceptionIdsJson, JsonOptions) ?? [];

        return new AuditControlEvaluationRecord
        {
            EvaluationId = row.EvaluationId,
            ControlId = row.ControlId,
            FrameworkId = row.FrameworkId,
            SnapshotId = row.SnapshotId,
            TenantId = row.TenantId,
            Outcome = (AuditEvaluationOutcome)row.Outcome,
            PassCount = row.PassCount,
            ApplicableCount = row.ApplicableCount,
            Confidence = row.Confidence,
            EvaluationText = row.EvaluationText,
            Formula = row.Formula,
            RequirementIds = requirementIds,
            ExceptionIds = exceptionIds,
            ProvenanceKind = (ProvenanceKind)row.ProvenanceKind,
            HumanDisposition = row.HumanDisposition,
            Notes = row.Notes,
            CreatedUtc = row.CreatedUtc,
        };
    }

    private sealed class EvaluationRow
    {
        public Guid EvaluationId
        {
            get;
            init;
        }

        public Guid ControlId
        {
            get;
            init;
        }

        public Guid FrameworkId
        {
            get;
            init;
        }

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

        public int Outcome
        {
            get;
            init;
        }

        public int PassCount
        {
            get;
            init;
        }

        public int ApplicableCount
        {
            get;
            init;
        }

        public decimal Confidence
        {
            get;
            init;
        }

        public string EvaluationText
        {
            get;
            init;
        } = string.Empty;

        public string Formula
        {
            get;
            init;
        } = string.Empty;

        public string RequirementIdsJson
        {
            get;
            init;
        } = string.Empty;

        public string ExceptionIdsJson
        {
            get;
            init;
        } = string.Empty;

        public int ProvenanceKind
        {
            get;
            init;
        }

        public string? HumanDisposition
        {
            get;
            init;
        }

        public string? Notes
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }

    private sealed class EvidenceItemRow
    {
        public Guid EvidenceItemId
        {
            get;
            init;
        }

        public Guid EvaluationId
        {
            get;
            init;
        }

        public Guid RequirementId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid? CloudResourceId
        {
            get;
            init;
        }

        public string? AzureResourceId
        {
            get;
            init;
        }

        public string EvidenceType
        {
            get;
            init;
        } = string.Empty;

        public string Summary
        {
            get;
            init;
        } = string.Empty;

        public int CollectionStatus
        {
            get;
            init;
        }

        public int ProvenanceKind
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }
}
