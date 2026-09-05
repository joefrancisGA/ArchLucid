using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
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
}
