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

        foreach (IGrouping<string, AgentResult> group in agentResults
                     .Select(static result => new
                     {
                         Result = result,
                         TaskIdKey = AgentEvaluationTaskIdKey.Normalize(result.TaskId) ?? result.TaskId
                     })
                     .Where(static x => !string.IsNullOrWhiteSpace(x.TaskIdKey))
                     .GroupBy(static x => x.TaskIdKey, static x => x.Result, StringComparer.OrdinalIgnoreCase))
        {
            List<AgentResult> groupResults = group.ToList();
            AgentResult? latest = AgentResultLatestForTaskSelector.Select(groupResults, group.Key);

            if (latest?.CalibratedConfidence is { } calibrated)
            {
                map[group.Key] = calibrated;
                continue;
            }

            AgentResult? latestWithCalibrated = groupResults
                .Where(static result => result.CalibratedConfidence is not null)
                .OrderByDescending(static result => result.CreatedUtc)
                .ThenByDescending(static result => result.ResultId, StringComparer.Ordinal)
                .FirstOrDefault();

            if (latestWithCalibrated?.CalibratedConfidence is { } fallbackCalibrated)
                map[group.Key] = fallbackCalibrated;
        }

        return map;
    }
}
