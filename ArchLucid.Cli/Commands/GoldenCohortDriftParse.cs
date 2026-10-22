using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Agent-result deserialization and real-LLM environment helpers for golden-cohort drift.
/// </summary>
internal static class GoldenCohortDriftParse
{
    internal static List<AgentResult>? TryParseAgentResults(
        List<object> raw,
        string itemId,
        out string? error)
    {
        error = null;

        List<AgentResult> list = [];
        int i = 0;

        foreach (AgentResult? ar in raw.Select(o => JsonSerializer.Serialize(o, ContractJson.Default))
                     .Select(j => JsonSerializer.Deserialize<AgentResult>(j, ContractJson.Default)))
        {
            if (ar is null)
            {
                error =
                    $"[{itemId}] could not deserialize agent result at index {i.ToString(CultureInfo.InvariantCulture)}.";

                return null;
            }

            list.Add(ar);
            i++;
        }

        if (list.Count != 0)
            return list;

        error = $"[{itemId}] no agent results returned for drift analysis.";

        return null;
    }

    internal static bool IsRealLlmContext() =>
        IsTruthyEnvironment("ARCHLUCID_GOLDEN_COHORT_REAL_LLM")
        || string.Equals(
            Environment.GetEnvironmentVariable("ARCHLUCID_AGENT_EXECUTION_MODE")?.Trim() ?? string.Empty,
            "Real",
            StringComparison.OrdinalIgnoreCase)
        || string.Equals(
            Environment.GetEnvironmentVariable("AgentExecution__Mode")?.Trim() ?? string.Empty,
            "Real",
            StringComparison.OrdinalIgnoreCase);

    internal static bool IsTruthyEnvironment(string name)
    {
        string? raw = Environment.GetEnvironmentVariable(name);

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        string v = raw.Trim();

        return string.Equals(v, "1", StringComparison.Ordinal)
               || string.Equals(v, "true", StringComparison.OrdinalIgnoreCase)
               || string.Equals(v, "yes", StringComparison.OrdinalIgnoreCase);
    }
}
