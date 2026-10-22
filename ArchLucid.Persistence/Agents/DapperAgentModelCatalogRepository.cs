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
                                    ExternalSubprocessorDisclosureComplete,
                                    LifecycleStatus,
                                    StructuredOutputProbeUtc,
                                    TokenizerProfile,
                                    CharsPerToken,
                                    TokenizerErrorMarginPercent,
                                    InputUsdPerMillionTokens,
                                    OutputUsdPerMillionTokens,
                                    ReasoningUsdPerMillionTokens
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

        IEnumerable<AgentModelCatalogRepositoryCore.EntryDbRow> entries =
            await connection.QueryAsync<AgentModelCatalogRepositoryCore.EntryDbRow>(
            new CommandDefinition(entrySql, cancellationToken: cancellationToken));

        IEnumerable<AgentModelCatalogRepositoryCore.EvalDbRow> evaluations =
            await connection.QueryAsync<AgentModelCatalogRepositoryCore.EvalDbRow>(
            new CommandDefinition(evalSql, cancellationToken: cancellationToken));

        Dictionary<string, List<AgentModelCatalogEvaluationRow>> evalByAlias = evaluations
            .GroupBy(row => row.AliasId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.Select(AgentModelCatalogRepositoryCore.MapEvaluation).ToList(),
                StringComparer.OrdinalIgnoreCase);

        return entries
            .Select(entry => AgentModelCatalogRepositoryCore.MapEntry(entry, evalByAlias.GetValueOrDefault(entry.AliasId) ?? []))
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
                                              ExternalSubprocessorDisclosureComplete = @ExternalSubprocessorDisclosureComplete,
                                              LifecycleStatus = @LifecycleStatus,
                                              StructuredOutputProbeUtc = @StructuredOutputProbeUtc,
                                              TokenizerProfile = @TokenizerProfile,
                                              CharsPerToken = @CharsPerToken,
                                              TokenizerErrorMarginPercent = @TokenizerErrorMarginPercent,
                                              InputUsdPerMillionTokens = @InputUsdPerMillionTokens,
                                              OutputUsdPerMillionTokens = @OutputUsdPerMillionTokens,
                                              ReasoningUsdPerMillionTokens = @ReasoningUsdPerMillionTokens,
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
                                              ExternalSubprocessorDisclosureComplete,
                                              LifecycleStatus,
                                              StructuredOutputProbeUtc,
                                              TokenizerProfile,
                                              CharsPerToken,
                                              TokenizerErrorMarginPercent,
                                              InputUsdPerMillionTokens,
                                              OutputUsdPerMillionTokens,
                                              ReasoningUsdPerMillionTokens)
                                          VALUES (
                                              @AliasId,
                                              @ProviderConnectionKind,
                                              @DeploymentName,
                                              @TierBinding,
                                              @CapabilityTagsJson,
                                              @ApprovedTaskTypesJson,
                                              @StructuredOutputLevel,
                                              @DataBoundary,
                                              @ExternalSubprocessorDisclosureComplete,
                                              @LifecycleStatus,
                                              @StructuredOutputProbeUtc,
                                              @TokenizerProfile,
                                              @CharsPerToken,
                                              @TokenizerErrorMarginPercent,
                                              @InputUsdPerMillionTokens,
                                              @OutputUsdPerMillionTokens,
                                              @ReasoningUsdPerMillionTokens);
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
                    CapabilityTagsJson = JsonSerializer.Serialize(row.CapabilityTags, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
                    ApprovedTaskTypesJson = JsonSerializer.Serialize(row.ApprovedTaskTypes, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
                    StructuredOutputLevel = row.StructuredOutputLevel.ToString(),
                    DataBoundary = row.DataBoundary.ToString(),
                    row.ExternalSubprocessorDisclosureComplete,
                    LifecycleStatus = row.LifecycleStatus.ToString(),
                    row.StructuredOutputProbeUtc,
                    TokenizerProfile = row.TokenizerProfile.ToString(),
                    row.CharsPerToken,
                    row.TokenizerErrorMarginPercent,
                    row.InputUsdPerMillionTokens,
                    row.OutputUsdPerMillionTokens,
                    row.ReasoningUsdPerMillionTokens
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

}
