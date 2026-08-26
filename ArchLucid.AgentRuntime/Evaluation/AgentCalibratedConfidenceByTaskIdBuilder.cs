using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Builds task-id lookups for <see cref="AgentResult.CalibratedConfidence" /> used by quality gates.
/// </summary>
internal static class AgentCalibratedConfidenceByTaskIdBuilder
{
    internal static Dictionary<string, double?> Build(IReadOnlyList<AgentResult> agentResults)
    {
        ArgumentNullException.ThrowIfNull(agentResults);

        Dictionary<string, double?> map = new(StringComparer.Ordinal);

        foreach (AgentResult result in agentResults)
        {

            if (result.CalibratedConfidence is { } calibrated)
                map[result.TaskId] = calibrated;
        }

        return map;
    }
}
