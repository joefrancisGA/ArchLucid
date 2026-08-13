using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Core.Agents;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Agents;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
public sealed class DapperAgentModelCatalogRepository(ISqlConnectionFactory connectionFactory)
    : IAgentModelCatalogRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<int> CountAsync(CancellationToken cancellationToken)
    {
        const string sql = "SELECT COUNT(1) FROM dbo.AgentModelCatalogEntry WITH (NOLOCK);";

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AgentModelCatalogRow>> ListAllAsync(CancellationToken cancellationToken)
    {
        const string entrySql = """
                                SELECT
                                    AliasId,
                                    ProviderConnectionKind,
                                    DeploymentName,
                                    TierBinding,
                                    CapabilityTagsJson,
                                    ApprovedTaskTypesJson,
                                    StructuredOutputLevel,
                                    DataBoundary,
                                    LifecycleStatus,
                                    StructuredOutputProbeUtc
                                FROM dbo.AgentModelCatalogEntry WITH (NOLOCK)
                                ORDER BY AliasId ASC;
                                """;

        const string evalSql = """
                               SELECT
                                   AliasId,
                                   TaskType,
                                   EvaluationState,
                                   EvidenceJson,
                                   EvaluatedUtc
                               FROM dbo.AgentModelCatalogEvaluation WITH (NOLOCK);
                               """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<EntryDbRow> entries = await connection.QueryAsync<EntryDbRow>(
            new CommandDefinition(entrySql, cancellationToken: cancellationToken));

        IEnumerable<EvalDbRow> evaluations = await connection.QueryAsync<EvalDbRow>(
            new CommandDefinition(evalSql, cancellationToken: cancellationToken));

        Dictionary<string, List<AgentModelCatalogEvaluationRow>> evalByAlias = evaluations
            .GroupBy(row => row.AliasId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.Select(MapEvaluation).ToList(),
                StringComparer.OrdinalIgnoreCase);

        return entries
            .Select(entry => MapEntry(entry, evalByAlias.GetValueOrDefault(entry.AliasId) ?? []))
            .ToList();
    }

    public async Task<AgentModelCatalogRow?> TryGetAsync(string aliasId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(aliasId))
        {
            return null;
        }

        IReadOnlyList<AgentModelCatalogRow> rows = await ListAllAsync(cancellationToken).ConfigureAwait(false);

        return rows.FirstOrDefault(row => string.Equals(row.AliasId, aliasId.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    public async Task UpsertAsync(AgentModelCatalogRow row, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(row);
        ArgumentException.ThrowIfNullOrWhiteSpace(row.AliasId);

        const string upsertEntrySql = """
                                      MERGE dbo.AgentModelCatalogEntry AS target
                                      USING (SELECT @AliasId AS AliasId) AS source
                                      ON target.AliasId = source.AliasId
                                      WHEN MATCHED THEN
                                          UPDATE SET
                                              ProviderConnectionKind = @ProviderConnectionKind,
                                              DeploymentName = @DeploymentName,
                                              TierBinding = @TierBinding,
                                              CapabilityTagsJson = @CapabilityTagsJson,
                                              ApprovedTaskTypesJson = @ApprovedTaskTypesJson,
                                              StructuredOutputLevel = @StructuredOutputLevel,
                                              DataBoundary = @DataBoundary,
                                              LifecycleStatus = @LifecycleStatus,
                                              StructuredOutputProbeUtc = @StructuredOutputProbeUtc,
                                              UpdatedUtc = SYSUTCDATETIME()
                                      WHEN NOT MATCHED THEN
                                          INSERT (
                                              AliasId,
                                              ProviderConnectionKind,
                                              DeploymentName,
                                              TierBinding,
                                              CapabilityTagsJson,
                                              ApprovedTaskTypesJson,
                                              StructuredOutputLevel,
                                              DataBoundary,
                                              LifecycleStatus,
                                              StructuredOutputProbeUtc)
                                          VALUES (
                                              @AliasId,
                                              @ProviderConnectionKind,
                                              @DeploymentName,
                                              @TierBinding,
                                              @CapabilityTagsJson,
                                              @ApprovedTaskTypesJson,
                                              @StructuredOutputLevel,
                                              @DataBoundary,
                                              @LifecycleStatus,
                                              @StructuredOutputProbeUtc);
                                      """;

        const string deleteEvalSql = """
                                     DELETE FROM dbo.AgentModelCatalogEvaluation
                                     WHERE AliasId = @AliasId;
                                     """;

        const string insertEvalSql = """
                                     INSERT INTO dbo.AgentModelCatalogEvaluation (
                                         AgentModelCatalogEvaluationId,
                                         AliasId,
                                         TaskType,
                                         EvaluationState,
                                         EvidenceJson,
                                         EvaluatedUtc)
                                     VALUES (
                                         @AgentModelCatalogEvaluationId,
                                         @AliasId,
                                         @TaskType,
                                         @EvaluationState,
                                         @EvidenceJson,
                                         @EvaluatedUtc);
                                     """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                upsertEntrySql,
                new
                {
                    row.AliasId,
                    row.ProviderConnectionKind,
                    row.DeploymentName,
                    row.TierBinding,
                    CapabilityTagsJson = JsonSerializer.Serialize(row.CapabilityTags, JsonOptions),
                    ApprovedTaskTypesJson = JsonSerializer.Serialize(row.ApprovedTaskTypes, JsonOptions),
                    StructuredOutputLevel = row.StructuredOutputLevel.ToString(),
                    DataBoundary = row.DataBoundary.ToString(),
                    LifecycleStatus = row.LifecycleStatus.ToString(),
                    row.StructuredOutputProbeUtc
                },
                cancellationToken: cancellationToken));

        await connection.ExecuteAsync(
            new CommandDefinition(deleteEvalSql, new { row.AliasId }, cancellationToken: cancellationToken));

        foreach (AgentModelCatalogEvaluationRow evaluation in row.Evaluations)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertEvalSql,
                    new
                    {
                        AgentModelCatalogEvaluationId = Guid.NewGuid(),
                        row.AliasId,
                        evaluation.TaskType,
                        EvaluationState = evaluation.EvaluationState.ToString(),
                        evaluation.EvidenceJson,
                        evaluation.EvaluatedUtc
                    },
                    cancellationToken: cancellationToken));
        }
    }

    private static AgentModelCatalogRow MapEntry(EntryDbRow entry, IReadOnlyList<AgentModelCatalogEvaluationRow> evaluations)
    {
        return new AgentModelCatalogRow
        {
            AliasId = entry.AliasId,
            ProviderConnectionKind = entry.ProviderConnectionKind,
            DeploymentName = entry.DeploymentName,
            TierBinding = entry.TierBinding,
            CapabilityTags = DeserializeList(entry.CapabilityTagsJson),
            ApprovedTaskTypes = DeserializeList(entry.ApprovedTaskTypesJson),
            StructuredOutputLevel = Enum.TryParse(entry.StructuredOutputLevel, true, out AgentModelStructuredOutputLevel level)
                ? level
                : AgentModelStructuredOutputLevel.StrictJsonSchema,
            DataBoundary = Enum.TryParse(entry.DataBoundary, true, out AgentModelDataBoundaryKind boundary)
                ? boundary
                : AgentModelDataBoundaryKind.AzureBoundary,
            LifecycleStatus = Enum.TryParse(entry.LifecycleStatus, true, out AgentModelCatalogLifecycleStatus lifecycle)
                ? lifecycle
                : AgentModelCatalogLifecycleStatus.Available,
            StructuredOutputProbeUtc = entry.StructuredOutputProbeUtc,
            Evaluations = evaluations
        };
    }

    private static AgentModelCatalogEvaluationRow MapEvaluation(EvalDbRow row) =>
        new()
        {
            TaskType = row.TaskType,
            EvaluationState = Enum.TryParse(row.EvaluationState, true, out AgentModelEvaluationStateKind state)
                ? state
                : AgentModelEvaluationStateKind.NotEvaluated,
            EvidenceJson = row.EvidenceJson,
            EvaluatedUtc = row.EvaluatedUtc
        };

    private static IReadOnlyList<string> DeserializeList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private sealed class EntryDbRow
    {
        public string AliasId { get; set; } = string.Empty;

        public string ProviderConnectionKind { get; set; } = string.Empty;

        public string? DeploymentName { get; set; }

        public string? TierBinding { get; set; }

        public string CapabilityTagsJson { get; set; } = "[]";

        public string ApprovedTaskTypesJson { get; set; } = "[]";

        public string StructuredOutputLevel { get; set; } = nameof(AgentModelStructuredOutputLevel.StrictJsonSchema);

        public string DataBoundary { get; set; } = nameof(AgentModelDataBoundaryKind.AzureBoundary);

        public string LifecycleStatus { get; set; } = nameof(AgentModelCatalogLifecycleStatus.Available);

        public DateTime? StructuredOutputProbeUtc { get; set; }
    }

    private sealed class EvalDbRow
    {
        public string AliasId { get; set; } = string.Empty;

        public string TaskType { get; set; } = string.Empty;

        public string EvaluationState { get; set; } = nameof(AgentModelEvaluationStateKind.NotEvaluated);

        public string? EvidenceJson { get; set; }

        public DateTime? EvaluatedUtc { get; set; }
    }
}
