using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Sql;

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
                                     TaskStructuralExecutionMode,
                                     CacheServed,
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
                                     @TaskStructuralExecutionMode,
                                     @CacheServed,
                                     @ResultJson,
                                     @CreatedUtc
                                 );
                                 """;

        string json = JsonSerializer.Serialize(result, ContractJson.Default);
        object parameters = new
        {
            result.ResultId,
            result.TaskId,
            RunId = SqlRunIdMapping.ToSqlRunId(result.RunId),
            AgentType = result.AgentType.ToString(),
            result.Confidence,
            result.CalibratedConfidence,
            ProposedEvidenceJson = result.ProposedEvidenceJson,
            PromptVariantKey = result.PromptVariantKey,
            TaskStructuralExecutionMode = (byte?)result.TaskStructuralExecutionMode,
            CacheServed = result.CacheServed,
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

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken).ConfigureAwait(false);

        IDbTransaction? localTransaction = null;

        try
        {
            if (transaction is null && ownsConnection)
            {
                localTransaction = conn.BeginTransaction();
                transaction = localTransaction;
            }

            await InsertAgentResultsBatchAsync(conn, transaction, results, cancellationToken).ConfigureAwait(false);

            localTransaction?.Commit();
        }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        {
            string runId = results[0].RunId;
            string taskId = results[0].TaskId;
            throw new AgentResultDuplicateConflictException(runId, taskId, ex);
        }
        finally
        {
            localTransaction?.Dispose();
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task ReplaceForRunTaskAsync(
        AgentResult replacement,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(replacement);

        const string deleteSql = """
                                 DELETE FROM AgentResults
                                 WHERE RunId = @RunId AND TaskId = @TaskId;
                                 """;

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
                                     TaskStructuralExecutionMode,
                                     CacheServed,
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
                                     @TaskStructuralExecutionMode,
                                     @CacheServed,
                                     @ResultJson,
                                     @CreatedUtc
                                 );
                                 """;

        string json = JsonSerializer.Serialize(replacement, ContractJson.Default);
        object parameters = new
        {
            replacement.ResultId,
            replacement.TaskId,
            RunId = SqlRunIdMapping.ToSqlRunId(replacement.RunId),
            AgentType = replacement.AgentType.ToString(),
            replacement.Confidence,
            replacement.CalibratedConfidence,
            ProposedEvidenceJson = replacement.ProposedEvidenceJson,
            PromptVariantKey = replacement.PromptVariantKey,
            TaskStructuralExecutionMode = (byte?)replacement.TaskStructuralExecutionMode,
            CacheServed = replacement.CacheServed,
            ResultJson = json,
            replacement.CreatedUtc
        };

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            if (transaction is not null)
            {
                await conn.ExecuteAsync(new CommandDefinition(
                    deleteSql,
                    new { RunId = SqlRunIdMapping.ToSqlRunId(replacement.RunId), replacement.TaskId },
                    transaction,
                    cancellationToken: cancellationToken));

                await conn.ExecuteAsync(new CommandDefinition(
                    insertSql,
                    parameters,
                    transaction,
                    cancellationToken: cancellationToken));
            }
            else
            {
                await conn.ExecuteAsync(new CommandDefinition(
                    deleteSql,
                    new { RunId = SqlRunIdMapping.ToSqlRunId(replacement.RunId), replacement.TaskId },
                    cancellationToken: cancellationToken));

                await conn.ExecuteAsync(new CommandDefinition(
                    insertSql,
                    parameters,
                    cancellationToken: cancellationToken));
            }
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    /// <inheritdoc />
    public async Task DeleteForRunTaskAsync(
        string runId,
        string taskId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        const string deleteSql = """
                                 DELETE FROM AgentResults
                                 WHERE RunId = @RunId AND TaskId = @TaskId;
                                 """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                deleteSql,
                new { RunId = SqlRunIdMapping.ToSqlRunId(runId), TaskId = taskId },
                transaction,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
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
                      {AgentResultListSql.GetByRunIdSelectResultJson}
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
                    RunId = SqlRunIdMapping.ToSqlRunId(runId),
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
                result = JsonSerializer.Deserialize<AgentResult>(json, AgentResultJsonSerialization.DeserializeOptions);
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

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> GetAgentTypeMarkersByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        RunChildRunScopeSql.RequireScope(scope);

        string sql = $"""
                      {AgentResultListSql.GetByRunIdSelectAgentTypeMarkers}
                      FROM AgentResults ar
                      {RunChildRunScopeSql.InnerJoinRuns("ar")}
                      WHERE ar.RunId = @RunId
                        AND {RunChildRunScopeSql.ScopeWhereClause}
                      ORDER BY ar.CreatedUtc
                      {SqlPagingSyntax.FirstRowsOnly(1000)};
                      """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection: null, cancellationToken);

        IEnumerable<AgentTypeMarkerRow> rows;
        try
        {
            rows = await conn.QueryAsync<AgentTypeMarkerRow>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        RunId = SqlRunIdMapping.ToSqlRunId(runId),
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                    },
                    cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        List<AgentResult> markers = [];

        foreach (AgentTypeMarkerRow row in rows)
        {
            if (!Enum.TryParse(row.AgentType, ignoreCase: true, out AgentType agentType))
                continue;

            markers.Add(new AgentResult
            {
                ResultId = row.ResultId,
                TaskId = row.TaskId,
                // SQL UNIQUEIDENTIFIER — map via Guid row type (string cast throws DataException).
                RunId = SqlRunIdMapping.ToContractRunId(row.RunId),
                AgentType = agentType,
                Confidence = row.Confidence,
                CreatedUtc = row.CreatedUtc,
            });
        }

        return markers;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> GetRollupProjectionByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        RunChildRunScopeSql.RequireScope(scope);

        string sql = $"""
                      {AgentResultListSql.GetByRunIdSelectRollupProjection}
                      FROM AgentResults ar
                      {RunChildRunScopeSql.InnerJoinRuns("ar")}
                      WHERE ar.RunId = @RunId
                        AND {RunChildRunScopeSql.ScopeWhereClause}
                      ORDER BY ar.CreatedUtc
                      {SqlPagingSyntax.FirstRowsOnly(1000)};
                      """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection: null, cancellationToken);

        IEnumerable<RollupProjectionRow> rows;
        try
        {
            rows = await conn.QueryAsync<RollupProjectionRow>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        RunId = SqlRunIdMapping.ToSqlRunId(runId),
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                    },
                    cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        List<AgentResult> projected = [];

        foreach (RollupProjectionRow row in rows)
        {
            if (!Enum.TryParse(row.AgentType, ignoreCase: true, out AgentType agentType))
                continue;

            AgentResult result = new()
            {
                ResultId = row.ResultId,
                TaskId = row.TaskId,
                RunId = SqlRunIdMapping.ToContractRunId(row.RunId),
                AgentType = agentType,
                Confidence = row.Confidence,
                CreatedUtc = row.CreatedUtc,
                Claims = DeserializeClaimList(row.ClaimsJson, runId),
                EvidenceRefs = DeserializeStringList(row.EvidenceRefsJson, runId, "evidenceRefs"),
                Findings = DeserializeFindingList(row.FindingsJson, runId),
                ProposedChanges = BuildProposedChanges(row.RequiredControlsJson, row.WarningsJson, runId),
            };

            projected.Add(AgentResultRollupProjection.StripHeavyFields(result));
        }

        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichments =
            await _agentResultEnrichmentRepository.GetByResultIdsAsync(
                projected.Select(static r => r.ResultId).ToList(),
                cancellationToken).ConfigureAwait(false);

        return ApplyRollupEnrichments(projected, enrichments);
    }

    private static IReadOnlyList<AgentResult> ApplyRollupEnrichments(
        IReadOnlyList<AgentResult> projected,
        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichmentsByResultId)
    {
        if (enrichmentsByResultId.Count == 0)
            return projected;

        List<AgentResult> merged = [];

        foreach (AgentResult baseResult in projected)
        {
            if (!enrichmentsByResultId.TryGetValue(baseResult.ResultId, out AgentResultEnrichmentRecord? enrichment))
            {
                merged.Add(baseResult);
                continue;
            }

            // Prefer scalar calibration; when an enriched blob exists, re-project it so compare stays field-complete
            // without retaining reasoning/topology LOBs from the enrichment payload.
            if (!string.IsNullOrWhiteSpace(enrichment.EnrichedResultJson))
            {
                AgentResult? enriched;

                try
                {
                    enriched = JsonSerializer.Deserialize<AgentResult>(
                        enrichment.EnrichedResultJson,
                        AgentResultJsonSerialization.DeserializeOptions);
                }
                catch (JsonException ex)
                {
                    throw new InvalidOperationException(
                        $"Enriched AgentResult JSON for '{baseResult.ResultId}' could not be deserialized.", ex);
                }

                if (enriched is not null)
                {
                    merged.Add(AgentResultRollupProjection.StripHeavyFields(enriched));
                    continue;
                }
            }

            if (enrichment.CalibratedConfidence.HasValue)
                baseResult.CalibratedConfidence = enrichment.CalibratedConfidence;

            merged.Add(baseResult);
        }

        return merged;
    }

    private static List<string> DeserializeClaimList(string? claimsJson, string runId)
    {
        if (string.IsNullOrWhiteSpace(claimsJson))
            return [];

        try
        {
            // Route through AgentResult so AgentResultClaimListJsonConverter accepts legacy claim shapes.
            AgentResult? shell = JsonSerializer.Deserialize<AgentResult>(
                $"{{\"claims\":{claimsJson}}}",
                AgentResultJsonSerialization.DeserializeOptions);

            return shell?.Claims ?? [];
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize rollup claims for run '{runId}'.", ex);
        }
    }

    private static List<string> DeserializeStringList(string? json, string runId, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, AgentResultJsonSerialization.DeserializeOptions) ?? [];
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize rollup {fieldName} for run '{runId}'.", ex);
        }
    }

    private static List<ArchitectureFinding> DeserializeFindingList(string? findingsJson, string runId)
    {
        if (string.IsNullOrWhiteSpace(findingsJson))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<ArchitectureFinding>>(findingsJson, AgentResultJsonSerialization.DeserializeOptions) ?? [];
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize rollup findings for run '{runId}'.", ex);
        }
    }

    private static AgentTopologyProposal? BuildProposedChanges(
        string? requiredControlsJson,
        string? warningsJson,
        string runId)
    {
        List<string> requiredControls = DeserializeStringList(requiredControlsJson, runId, "requiredControls");
        List<string> warnings = DeserializeStringList(warningsJson, runId, "warnings");

        if (requiredControls.Count == 0 && warnings.Count == 0)
            return null;

        return new AgentTopologyProposal
        {
            RequiredControls = requiredControls,
            Warnings = warnings,
        };
    }

    public async Task<IReadOnlyList<EvidenceProposalListItem>> ListEvidenceProposalsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        RunChildRunScopeSql.RequireScope(scope);

        string sql = $"""
                      SELECT
                          {AgentResultListSql.ListEvidenceProposalsSelectColumns},
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

        IEnumerable<EvidenceProposalRow> rows;
        try
        {
            rows = await conn.QueryAsync<EvidenceProposalRow>(new CommandDefinition(
                sql,
                RunChildRunScopeSql.ScopeParameters(scope),
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        return rows.Select(MapEvidenceProposal).ToList();
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
            EvidenceProposalRow? row = await conn.QuerySingleOrDefaultAsync<EvidenceProposalRow>(new CommandDefinition(
                sql,
                new
                {
                    ResultId = resultId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken));

            return row is null ? null : MapEvidenceProposal(row);
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    private static EvidenceProposalListItem MapEvidenceProposal(EvidenceProposalRow row)
    {
        return new EvidenceProposalListItem
        {
            ResultId = row.ResultId,
            RunId = SqlRunIdMapping.ToContractRunId(row.RunId),
            AgentType = row.AgentType,
            ProposedEvidenceJson = row.ProposedEvidenceJson,
            CreatedUtc = row.CreatedUtc,
            IsPromoted = row.IsPromoted,
        };
    }

    private static async Task InsertAgentResultsBatchAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken)
    {
        List<(AgentResult Result, string ResultJson)> serialized = results
            .Select(static result => (result, JsonSerializer.Serialize(result, ContractJson.Default)))
            .ToList();

        const string insertHeader = """
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
                                        TaskStructuralExecutionMode,
                                        CacheServed,
                                        ResultJson,
                                        CreatedUtc
                                    )
                                    VALUES
                                    """;

        await SqlChunkedDapperBatch.ExecuteChunksAsync(
            connection,
            transaction,
            serialized.Count,
            SqlChunkedDapperBatch.DefaultMaxRowsPerCommand,
            (offset, rowCount) => BuildAgentResultInsertChunk(insertHeader, serialized, offset, rowCount),
            cancellationToken).ConfigureAwait(false);
    }

    private static SqlChunkedBatchCommand BuildAgentResultInsertChunk(
        string insertHeader,
        IReadOnlyList<(AgentResult Result, string ResultJson)> serialized,
        int offset,
        int rowCount)
    {
        StringBuilder commandText = new(insertHeader.Length + rowCount * 120);
        commandText.Append(insertHeader);
        DynamicParameters parameters = new();

        for (int i = 0; i < rowCount; i++)
        {
            (AgentResult result, string resultJson) = serialized[offset + i];

            if (i > 0)
                commandText.Append(',');

            commandText.Append(
                $"(@ResultId{i},@TaskId{i},@RunId{i},@AgentType{i},@Confidence{i},@CalibratedConfidence{i},@ProposedEvidenceJson{i},@PromptVariantKey{i},@TaskStructuralExecutionMode{i},@CacheServed{i},@ResultJson{i},@CreatedUtc{i})");

            parameters.Add($"ResultId{i}", result.ResultId);
            parameters.Add($"TaskId{i}", result.TaskId);
            parameters.Add($"RunId{i}", SqlRunIdMapping.ToSqlRunId(result.RunId));
            parameters.Add($"AgentType{i}", result.AgentType.ToString());
            parameters.Add($"Confidence{i}", result.Confidence);
            parameters.Add($"CalibratedConfidence{i}", result.CalibratedConfidence);
            parameters.Add($"ProposedEvidenceJson{i}", result.ProposedEvidenceJson);
            parameters.Add($"PromptVariantKey{i}", result.PromptVariantKey);
            parameters.Add($"TaskStructuralExecutionMode{i}", (byte?)result.TaskStructuralExecutionMode);
            parameters.Add($"CacheServed{i}", result.CacheServed);
            parameters.Add($"ResultJson{i}", resultJson);
            parameters.Add($"CreatedUtc{i}", result.CreatedUtc);
        }

        commandText.Append(';');
        return new SqlChunkedBatchCommand(commandText.ToString(), parameters);
    }

    private sealed class EvidenceProposalRow
    {
        public string ResultId
        {
            get;
            init;
        } = null!;

        public Guid RunId
        {
            get;
            init;
        }

        public string AgentType
        {
            get;
            init;
        } = null!;

        public string ProposedEvidenceJson
        {
            get;
            init;
        } = null!;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public bool IsPromoted
        {
            get;
            init;
        }
    }

    private sealed class AgentTypeMarkerRow
    {
        public string ResultId
        {
            get;
            init;
        } = null!;

        public string TaskId
        {
            get;
            init;
        } = null!;

        public Guid RunId
        {
            get;
            init;
        }

        public string AgentType
        {
            get;
            init;
        } = null!;

        public double Confidence
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

    private sealed class RollupProjectionRow
    {
        public string ResultId
        {
            get;
            init;
        } = null!;

        public string TaskId
        {
            get;
            init;
        } = null!;

        public Guid RunId
        {
            get;
            init;
        }

        public string AgentType
        {
            get;
            init;
        } = null!;

        public double Confidence
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public string? ClaimsJson
        {
            get;
            init;
        }

        public string? EvidenceRefsJson
        {
            get;
            init;
        }

        public string? FindingsJson
        {
            get;
            init;
        }

        public string? RequiredControlsJson
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
