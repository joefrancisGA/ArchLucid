using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Shared agent-result validation, clone, and projection helpers for SQL and in-memory repositories.
/// </summary>
internal static class AgentResultRepositoryCore
{
    /// <summary>SQL Server error numbers for unique index / primary key violations.</summary>
    public static readonly int[] UniqueViolationErrorNumbers = [2627, 2601];

    public static bool IsUniqueViolation(SqlException exception) =>
        UniqueViolationErrorNumbers.Contains(exception.Number);

    /// <summary>
    ///     Batch inserts share one <c>(RunId, TaskId)</c> conflict report, so a batch spanning runs would attribute a
    ///     conflict to the wrong run.
    /// </summary>
    public static void RequireSingleRun(IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        List<string> distinctRunIds = results.Select(static r => r.RunId).Distinct().ToList();

        if (distinctRunIds.Count > 1)
        {
            throw new ArgumentException(
                $"All results in a batch must belong to the same run. Found distinct RunIds: {string.Join(", ", distinctRunIds)}.",
                nameof(results));
        }
    }

    public static AgentResult Clone(AgentResult source)
    {
        ArgumentNullException.ThrowIfNull(source);

        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        AgentResult? copy = JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null AgentResult.");
    }

    public static AgentResult ProjectMarker(AgentResult source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new AgentResult
        {
            ResultId = source.ResultId,
            TaskId = source.TaskId,
            RunId = source.RunId,
            AgentType = source.AgentType,
            Confidence = source.Confidence,
            CreatedUtc = source.CreatedUtc,
        };
    }

    public static bool IsEvidencePromoted(AgentResultEnrichmentRecord? enrichment) =>
        enrichment?.EvidenceProposalPromotedUtc is not null;
}
