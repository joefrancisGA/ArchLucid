using System.Data;
using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Inserts many agent results with one multi-row <c>VALUES</c> statement per chunk. Chunking is required because each
///     row contributes twelve parameters, which would otherwise breach the SQL Server parameter ceiling on large runs.
/// </summary>
internal static class AgentResultInsertBatch
{
    /// <summary>Rough per-row command-text cost, used only to pre-size the builder.</summary>
    private const int EstimatedCharsPerRow = 120;

    public static async Task ExecuteAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(results);

        List<(AgentResult Result, string ResultJson)> serialized = results
            .Select(static result => (result, AgentResultInsertParameters.Serialize(result)))
            .ToList();

        await SqlChunkedDapperBatch.ExecuteChunksAsync(
            connection,
            transaction,
            serialized.Count,
            SqlChunkedDapperBatch.DefaultMaxRowsPerCommand,
            (offset, rowCount) => BuildChunk(serialized, offset, rowCount),
            cancellationToken).ConfigureAwait(false);
    }

    private static SqlChunkedBatchCommand BuildChunk(
        IReadOnlyList<(AgentResult Result, string ResultJson)> serialized,
        int offset,
        int rowCount)
    {
        StringBuilder commandText =
            new(AgentResultWriteSql.InsertHeader.Length + rowCount * EstimatedCharsPerRow);
        commandText.Append(AgentResultWriteSql.InsertHeader);
        DynamicParameters parameters = new();

        for (int i = 0; i < rowCount; i++)
        {
            (AgentResult result, string resultJson) = serialized[offset + i];

            if (i > 0)
                commandText.Append(',');

            commandText.Append(
                $"(@ResultId{i},@TaskId{i},@RunId{i},@AgentType{i},@Confidence{i},@CalibratedConfidence{i},@ProposedEvidenceJson{i},@PromptVariantKey{i},@TaskStructuralExecutionMode{i},@CacheServed{i},@ResultJson{i},@CreatedUtc{i})");

            AddRowParameters(parameters, i, result, resultJson);
        }

        commandText.Append(';');
        return new SqlChunkedBatchCommand(commandText.ToString(), parameters);
    }

    private static void AddRowParameters(
        DynamicParameters parameters,
        int rowIndex,
        AgentResult result,
        string resultJson)
    {
        parameters.Add($"ResultId{rowIndex}", result.ResultId);
        parameters.Add($"TaskId{rowIndex}", result.TaskId);
        parameters.Add($"RunId{rowIndex}", SqlRunIdMapping.ToSqlRunId(result.RunId));
        parameters.Add($"AgentType{rowIndex}", result.AgentType.ToString());
        parameters.Add($"Confidence{rowIndex}", result.Confidence);
        parameters.Add($"CalibratedConfidence{rowIndex}", result.CalibratedConfidence);
        parameters.Add($"ProposedEvidenceJson{rowIndex}", result.ProposedEvidenceJson);
        parameters.Add($"PromptVariantKey{rowIndex}", result.PromptVariantKey);
        parameters.Add($"TaskStructuralExecutionMode{rowIndex}", (byte?)result.TaskStructuralExecutionMode);
        parameters.Add($"CacheServed{rowIndex}", result.CacheServed);
        parameters.Add($"ResultJson{rowIndex}", resultJson);
        parameters.Add($"CreatedUtc{rowIndex}", result.CreatedUtc);
    }
}
