using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class AgentResultRepository(
    IDbConnectionFactory connectionFactory,
    IAgentResultEnrichmentRepository agentResultEnrichmentRepository) : IAgentResultRepository
{
    private readonly IAgentResultEnrichmentRepository _agentResultEnrichmentRepository =
        agentResultEnrichmentRepository ?? throw new ArgumentNullException(nameof(agentResultEnrichmentRepository));
    /// <summary>
    ///     Persists one agent result row. Duplicate <c>(RunId, TaskId)</c> inserts fail with
    ///     <see cref="ArchLucid.Core.Persistence.AgentResultDuplicateConflictException" /> (see TB-201 unique index).
    /// </summary>
    public async Task CreateAsync(
        AgentResult result,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(result);

        const string insertSql = """
                                 INSERT INTO AgentResults
                                 (
                                     ResultId,
                                     TaskId,
                                     RunId,
                                     AgentType,
                                     Confidence,
                                     CalibratedConfidence,
                                     ProposedEvidenceJson,
                                     PromptVariantKey,
                                     ResultJson,
                                     CreatedUtc
                                 )
                                 VALUES
                                 (
                                     @ResultId,
                                     @TaskId,
                                     @RunId,
                                     @AgentType,
                                     @Confidence,
                                     @CalibratedConfidence,
                                     @ProposedEvidenceJson,
                                     @PromptVariantKey,
                                     @ResultJson,
                                     @CreatedUtc
                                 );
                                 """;

        string json = JsonSerializer.Serialize(result, ContractJson.Default);
        object parameters = new
        {
            result.ResultId,
            result.TaskId,
            RunId = RunChildRunScopeSql.ToSqlRunId(result.RunId),
            AgentType = result.AgentType.ToString(),
            result.Confidence,
            result.CalibratedConfidence,
            ProposedEvidenceJson = result.ProposedEvidenceJson,
            PromptVariantKey = result.PromptVariantKey,
            ResultJson = json,
            result.CreatedUtc
        };

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            if (transaction is not null)
            {
                await conn.ExecuteAsync(new CommandDefinition(
                    insertSql,
                    parameters,
                    transaction,
                    cancellationToken: cancellationToken));
            }
            else
            {
                await conn.ExecuteAsync(new CommandDefinition(
                    insertSql,
                    parameters,
                    cancellationToken: cancellationToken));
            }
        }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        {
            throw new AgentResultDuplicateConflictException(result.RunId, result.TaskId, ex);
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task CreateManyAsync(
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(results);

        if (results.Count == 0)
            return;

        List<string> distinctRunIds = results.Select(r => r.RunId).Distinct().ToList();

        if (distinctRunIds.Count > 1)
            throw new ArgumentException(
                $"All results in a batch must belong to the same run. Found distinct RunIds: {string.Join(", ", distinctRunIds)}.",
                nameof(results));

        foreach (AgentResult result in results)
        {
            await CreateAsync(result, cancellationToken, connection, transaction).ConfigureAwait(false);
        }
    }

    public async Task<IReadOnlyList<AgentResult>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        RunChildRunScopeSql.RequireScope(scope);

        string sql = $"""
                      SELECT ar.ResultJson
                      FROM AgentResults ar
                      {RunChildRunScopeSql.InnerJoinRuns("ar")}
                      WHERE ar.RunId = @RunId
                        AND {RunChildRunScopeSql.ScopeWhereClause}
                      ORDER BY ar.CreatedUtc
                      {SqlPagingSyntax.FirstRowsOnly(1000)};
                      """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        IEnumerable<string> rows;
        try
        {
            rows = await conn.QueryAsync<string>(new CommandDefinition(
                sql,
                new
                {
                    RunId = RunChildRunScopeSql.ToSqlRunId(runId),
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                transaction,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        List<AgentResult> results = [];
        foreach (string json in rows)
        {
            AgentResult? result;
            try
            {
                result = JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default);
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException(
                    $"Failed to deserialize an AgentResult for run '{runId}'. " +
                    "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
            }

            if (result is null)

                throw new InvalidOperationException(
                    $"An AgentResult row for run '{runId}' deserialized to null. " +
                    "The stored JSON may be empty or corrupt.");

            results.Add(result);
        }

        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichments =
            await _agentResultEnrichmentRepository.GetByResultIdsAsync(
                results.Select(static r => r.ResultId).ToList(),
                cancellationToken).ConfigureAwait(false);

        return AgentResultEnrichmentMerger.Apply(results, enrichments);
    }

    public async Task<IReadOnlyList<EvidenceProposalListItem>> ListEvidenceProposalsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        RunChildRunScopeSql.RequireScope(scope);

        string sql = $"""
                      SELECT
                          ar.ResultId,
                          ar.RunId,
                          ar.AgentType,
                          ar.ProposedEvidenceJson,
                          ar.CreatedUtc,
                          CAST(0 AS BIT) AS IsPromoted
                      FROM AgentResults AS ar
                      LEFT JOIN dbo.AgentResultEnrichments AS enr ON enr.ResultId = ar.ResultId
                      {RunChildRunScopeSql.InnerJoinRuns("ar")}
                      WHERE ar.ProposedEvidenceJson IS NOT NULL
                        AND ar.EvidenceProposalPromotedUtc IS NULL
                        AND enr.EvidenceProposalPromotedUtc IS NULL
                        AND {RunChildRunScopeSql.ScopeWhereClause}
                        AND NOT EXISTS (
                            SELECT 1
                            FROM TenantCuratedEvidenceEntries AS tce
                            WHERE tce.SourceResultId = ar.ResultId
                              AND tce.TenantId = @TenantId)
                      ORDER BY ar.CreatedUtc DESC;
                      """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        IEnumerable<EvidenceProposalListItem> rows;
        try
        {
            rows = await conn.QueryAsync<EvidenceProposalListItem>(new CommandDefinition(
                sql,
                RunChildRunScopeSql.ScopeParameters(scope),
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        return rows.ToList();
    }

    public async Task<EvidenceProposalListItem?> TryGetEvidenceProposalAsync(
        ScopeContext scope,
        string resultId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);
        RunChildRunScopeSql.RequireScope(scope);

        string sql = $"""
                      SELECT TOP (1)
                          ar.ResultId,
                          ar.RunId,
                          ar.AgentType,
                          ar.ProposedEvidenceJson,
                          ar.CreatedUtc,
                          CASE
                              WHEN enr.EvidenceProposalPromotedUtc IS NOT NULL
                                   OR ar.EvidenceProposalPromotedUtc IS NOT NULL
                                   OR EXISTS (
                                       SELECT 1
                                       FROM TenantCuratedEvidenceEntries AS tce
                                       WHERE tce.SourceResultId = ar.ResultId
                                         AND tce.TenantId = @TenantId)
                              THEN CAST(1 AS BIT)
                              ELSE CAST(0 AS BIT)
                          END AS IsPromoted
                      FROM AgentResults AS ar
                      LEFT JOIN dbo.AgentResultEnrichments AS enr ON enr.ResultId = ar.ResultId
                      {RunChildRunScopeSql.InnerJoinRuns("ar")}
                      WHERE ar.ResultId = @ResultId
                        AND ar.ProposedEvidenceJson IS NOT NULL
                        AND {RunChildRunScopeSql.ScopeWhereClause};
                      """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        try
        {
            return await conn.QuerySingleOrDefaultAsync<EvidenceProposalListItem>(new CommandDefinition(
                sql,
                new
                {
                    ResultId = resultId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }
}
