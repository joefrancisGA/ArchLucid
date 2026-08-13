using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Reads full <c>ResultJson</c> rows. Commit and detail orchestration act on these results, so a corrupt or
///     schema-incompatible row fails the whole read instead of silently shrinking the result set.
/// </summary>
internal static class AgentResultJsonRowReader
{
    public static List<AgentResult> ReadAll(IEnumerable<string> resultJsonRows, string runId)
    {
        ArgumentNullException.ThrowIfNull(resultJsonRows);

        List<AgentResult> results = [];

        foreach (string json in resultJsonRows)
            results.Add(Read(json, runId));

        return results;
    }

    private static AgentResult Read(string json, string runId)
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
                "The stored JSON may be corrupt or written by an incompatible schema version.",
                ex);
        }

        return result ?? throw new InvalidOperationException(
            $"An AgentResult row for run '{runId}' deserialized to null. The stored JSON may be empty or corrupt.");
    }
}
