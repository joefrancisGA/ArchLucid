using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Persists authority <see cref="DecisionTraceDto" /> (rule audit) from decisioning (not coordinator
///     <c>DecisionTraces</c> table). JSON columns are <c>NVARCHAR(MAX)</c> with rowstore PAGE compression (migration 088).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlDecisionTraceRepository(ISqlConnectionFactory connectionFactory) : IDecisionTraceRepository
{
    public async Task SaveAsync(
        DecisionTraceDto trace,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(trace);

        if (trace is not RuleAuditTraceDto ruleAuditTrace)
            throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");

        RuleAuditTracePayload audit = ruleAuditTrace.RuleAudit;
        ScopedRepositoryScopeValidation.RequireEntityTenant(audit.TenantId);

        const string sql = """
                           INSERT INTO dbo.DecisioningTraces
                           (
                               TenantId, WorkspaceId, ProjectId,
                               DecisionTraceId, RunId, CreatedUtc,
                               RuleSetId, RuleSetVersion, RuleSetHash,
                               AppliedRuleIdsJson, AcceptedFindingIdsJson, RequiredFindingIdsJson,
                               AllowedFindingIdsJson, PreferredFindingIdsJson, RejectedFindingIdsJson, NotesJson,
                               ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, PromptRefsJson, WarningsJson
                           )
                           VALUES
                           (
                               @TenantId, @WorkspaceId, @ProjectId,
                               @DecisionTraceId, @RunId, @CreatedUtc,
                               @RuleSetId, @RuleSetVersion, @RuleSetHash,
                               @AppliedRuleIdsJson, @AcceptedFindingIdsJson, @RequiredFindingIdsJson,
                               @AllowedFindingIdsJson, @PreferredFindingIdsJson, @RejectedFindingIdsJson, @NotesJson,
                               @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId, @PromptRefsJson, @WarningsJson
                           );
                           """;

        object args = new
        {
            audit.TenantId,
            audit.WorkspaceId,
            audit.ProjectId,
            audit.DecisionTraceId,
            audit.RunId,
            audit.CreatedUtc,
            audit.RuleSetId,
            audit.RuleSetVersion,
            audit.RuleSetHash,
            AppliedRuleIdsJson = JsonEntitySerializer.Serialize(audit.AppliedRuleIds),
            AcceptedFindingIdsJson = JsonEntitySerializer.Serialize(audit.AcceptedFindingIds),
            RequiredFindingIdsJson = JsonEntitySerializer.Serialize(audit.RequiredFindingIds),
            AllowedFindingIdsJson = JsonEntitySerializer.Serialize(audit.AllowedFindingIds),
            PreferredFindingIdsJson = JsonEntitySerializer.Serialize(audit.PreferredFindingIds),
            RejectedFindingIdsJson = JsonEntitySerializer.Serialize(audit.RejectedFindingIds),
            NotesJson = JsonEntitySerializer.Serialize(audit.Notes),
            audit.ContextSnapshotId,
            audit.GraphSnapshotId,
            audit.FindingsSnapshotId,
            PromptRefsJson = JsonEntitySerializer.Serialize(audit.PromptRefs),
            WarningsJson = JsonEntitySerializer.Serialize(audit.Warnings),
        };

        if (connection is not null)
        {
            await connection.ExecuteAsync(new CommandDefinition(sql, args, transaction, cancellationToken: ct));
            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct);
        await owned.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct));
    }

    public async Task<DecisionTraceDto?> GetByIdAsync(ScopeContext scope, Guid decisionTraceId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        const string sql = """
                           SELECT
                               TenantId, WorkspaceId, ProjectId,
                               DecisionTraceId, RunId, CreatedUtc,
                               RuleSetId, RuleSetVersion, RuleSetHash,
                               AppliedRuleIdsJson, AcceptedFindingIdsJson, RequiredFindingIdsJson,
                               AllowedFindingIdsJson, PreferredFindingIdsJson, RejectedFindingIdsJson, NotesJson,
                               ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, PromptRefsJson, WarningsJson
                           FROM dbo.DecisioningTraces
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ScopeProjectId
                             AND DecisionTraceId = @DecisionTraceId;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        DecisionTraceRow? row = await connection.QuerySingleOrDefaultAsync<DecisionTraceRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, ScopeProjectId = scope.ProjectId, DecisionTraceId = decisionTraceId },
                flags: CommandFlags.None,
                cancellationToken: ct));

        if (row is null)
            return null;

        return RuleAuditTraceDto.From(new RuleAuditTracePayload
        {
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            DecisionTraceId = row.DecisionTraceId,
            RunId = row.RunId,
            CreatedUtc = row.CreatedUtc,
            RuleSetId = row.RuleSetId,
            RuleSetVersion = row.RuleSetVersion,
            RuleSetHash = row.RuleSetHash,
            AppliedRuleIds = JsonEntitySerializer.Deserialize<List<string>>(row.AppliedRuleIdsJson),
            AcceptedFindingIds = JsonEntitySerializer.Deserialize<List<string>>(row.AcceptedFindingIdsJson),
            RequiredFindingIds = DeserializeFindingIds(row.RequiredFindingIdsJson),
            AllowedFindingIds = DeserializeFindingIds(row.AllowedFindingIdsJson),
            PreferredFindingIds = DeserializeFindingIds(row.PreferredFindingIdsJson),
            RejectedFindingIds = JsonEntitySerializer.Deserialize<List<string>>(row.RejectedFindingIdsJson),
            Notes = JsonEntitySerializer.Deserialize<List<string>>(row.NotesJson),
            ContextSnapshotId = row.ContextSnapshotId,
            GraphSnapshotId = row.GraphSnapshotId,
            FindingsSnapshotId = row.FindingsSnapshotId,
            PromptRefs = JsonEntitySerializer.Deserialize<List<RuleAuditTracePromptRef>>(row.PromptRefsJson ?? "[]"),
            Warnings = JsonEntitySerializer.Deserialize<List<RuleAuditTraceWarning>>(row.WarningsJson ?? "[]"),
        });
    }

    private static List<string> DeserializeFindingIds(string? json) =>
        string.IsNullOrWhiteSpace(json)
            ? []
            : JsonEntitySerializer.Deserialize<List<string>>(json);

    private sealed class DecisionTraceRow
    {
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

        public Guid DecisionTraceId
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public string RuleSetId
        {
            get;
            init;
        } = null!;

        public string RuleSetVersion
        {
            get;
            init;
        } = null!;

        public string RuleSetHash
        {
            get;
            init;
        } = null!;

        public string AppliedRuleIdsJson
        {
            get;
            init;
        } = null!;

        public string AcceptedFindingIdsJson
        {
            get;
            init;
        } = null!;

        public string? RequiredFindingIdsJson
        {
            get;
            init;
        }

        public string? AllowedFindingIdsJson
        {
            get;
            init;
        }

        public string? PreferredFindingIdsJson
        {
            get;
            init;
        }

        public string RejectedFindingIdsJson
        {
            get;
            init;
        } = null!;

        public string NotesJson
        {
            get;
            init;
        } = null!;

        public Guid? ContextSnapshotId
        {
            get;
            init;
        }

        public Guid? GraphSnapshotId
        {
            get;
            init;
        }

        public Guid? FindingsSnapshotId
        {
            get;
            init;
        }

        public string? PromptRefsJson
        {
            get;
            init;
        }

        public string? WarningsJson
        {
            get;
            init;
        }
    }
}
