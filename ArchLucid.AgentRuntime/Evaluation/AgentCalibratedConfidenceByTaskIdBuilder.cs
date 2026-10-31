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

        Dictionary<string, double?> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (IGrouping<string, AgentResult> group in agentResults.GroupBy(
                     static result => result.TaskId,
                     StringComparer.OrdinalIgnoreCase))
        {
            AgentResult? latest = AgentResultLatestForTaskSelector.Select(group.ToList(), group.Key);

            if (latest?.CalibratedConfidence is { } calibrated)
                map[group.Key] = calibrated;
        }

        return map;
    }
}
