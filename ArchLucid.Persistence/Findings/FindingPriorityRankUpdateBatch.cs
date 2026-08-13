using System.Text;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Builds the chunked <c>UPDATE ... FROM (VALUES ...)</c> commands that apply priority ranks to
///     <c>dbo.FindingRecords</c>. A single joined VALUES list per chunk avoids one round trip per finding while staying
///     under the SQL Server parameter limit enforced by <see cref="SqlChunkedDapperBatch" />.
/// </summary>
internal static class FindingPriorityRankUpdateBatch
{
    /// <summary>Rough per-row command-text cost, used only to pre-size the builder.</summary>
    private const int EstimatedCharsPerRow = 48;

    /// <summary>Drops blank finding ids and trims the rest so the VALUES join matches persisted keys.</summary>
    public static List<(string FindingId, int PriorityRank)> Normalize(
        IReadOnlyList<(string FindingId, int PriorityRank)> ranks)
    {
        ArgumentNullException.ThrowIfNull(ranks);

        return ranks
            .Where(static rank => !string.IsNullOrWhiteSpace(rank.FindingId))
            .Select(static rank => (rank.FindingId.Trim(), rank.PriorityRank))
            .ToList();
    }

    public static SqlChunkedBatchCommand BuildChunk(
        Guid findingsSnapshotId,
        ScopeContext scope,
        IReadOnlyList<(string FindingId, int PriorityRank)> ranks,
        int offset,
        int rowCount)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(ranks);

        string scopeSql = FindingsSnapshotStatementFactory.BuildPriorityRankScopeFilter(scope);
        string header = FindingsSnapshotWriteSql.PriorityRankUpdateHeader;
        string footer = FindingsSnapshotWriteSql.PriorityRankUpdateFooter;

        StringBuilder commandText =
            new(header.Length + footer.Length + scopeSql.Length + rowCount * EstimatedCharsPerRow);
        commandText.Append(header);

        DynamicParameters parameters = new();
        parameters.Add("FsId", findingsSnapshotId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);

        for (int i = 0; i < rowCount; i++)
        {
            (string findingId, int priorityRank) = ranks[offset + i];

            if (i > 0)
                commandText.Append(',');

            commandText.Append($"(@FindingId{i},@PriorityRank{i})");
            parameters.Add($"FindingId{i}", findingId);
            parameters.Add($"PriorityRank{i}", priorityRank);
        }

        commandText.Append(footer);
        commandText.Append(scopeSql);
        commandText.Append(';');
        return new SqlChunkedBatchCommand(commandText.ToString(), parameters);
    }
}
