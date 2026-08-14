using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Tracks upstream agent result versions consumed by dependent agents (TB-942).
/// </summary>
public static class AgentDownstreamConsistency
{
    public static readonly AgentType[] UpstreamOfCritic =
    [
        AgentType.Topology,
        AgentType.Cost,
        AgentType.Compliance,
    ];

    /// <summary>Builds the current upstream ResultId map for Critic consistency checks.</summary>
    public static IReadOnlyDictionary<string, string> BuildUpstreamFingerprints(IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        Dictionary<string, string> fingerprints = new(StringComparer.Ordinal);

        foreach (AgentType upstreamType in UpstreamOfCritic)
        {
            AgentResult? latest = results
                .Where(result => result.AgentType == upstreamType)
                .OrderByDescending(result => result.CreatedUtc)
                .FirstOrDefault();

            if (latest is null || string.IsNullOrWhiteSpace(latest.ResultId))
                continue;

            fingerprints[upstreamType.ToString()] = latest.ResultId.Trim();
        }

        return fingerprints;
    }

    /// <summary>Stamps critic rows with upstream ResultIds from the same execute batch.</summary>
    public static void StampCriticResults(IReadOnlyList<AgentResult> batchResults)
    {
        ArgumentNullException.ThrowIfNull(batchResults);

        if (batchResults.Count == 0)
            return;

        IReadOnlyDictionary<string, string> upstream = BuildUpstreamFingerprints(batchResults);

        if (upstream.Count == 0)
            return;

        Dictionary<string, string> stamp = upstream.ToDictionary(
            static pair => pair.Key,
            static pair => pair.Value,
            StringComparer.Ordinal);

        foreach (AgentResult result in batchResults)
        {
            if (result.AgentType != AgentType.Critic)
                continue;

            if (!string.IsNullOrWhiteSpace(result.DegradationReasonCode))
                continue;

            result.UpstreamResultFingerprints = stamp;
        }
    }

    /// <summary>
    ///     Returns <see langword="true"/> when the critic row is older than or inconsistent with upstream agent results.
    /// </summary>
    public static bool IsCriticStale(AgentResult critic, IReadOnlyList<AgentResult> allResults)
    {
        ArgumentNullException.ThrowIfNull(critic);
        ArgumentNullException.ThrowIfNull(allResults);

        if (critic.AgentType != AgentType.Critic)
            return false;

        IReadOnlyDictionary<string, string> current = BuildUpstreamFingerprints(allResults);

        if (current.Count < UpstreamOfCritic.Length)
            return false;

        if (critic.UpstreamResultFingerprints is null || critic.UpstreamResultFingerprints.Count == 0)
        {
            return HasUpstreamNewerThanCritic(critic, allResults);
        }

        foreach (KeyValuePair<string, string> pair in current)
        {
            if (!critic.UpstreamResultFingerprints.TryGetValue(pair.Key, out string? stamped)
                || !string.Equals(stamped, pair.Value, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private static bool HasUpstreamNewerThanCritic(AgentResult critic, IReadOnlyList<AgentResult> allResults)
    {
        foreach (AgentType upstreamType in UpstreamOfCritic)
        {
            AgentResult? upstream = allResults
                .Where(result => result.AgentType == upstreamType)
                .OrderByDescending(result => result.CreatedUtc)
                .FirstOrDefault();

            if (upstream is null)
                continue;

            if (upstream.CreatedUtc > critic.CreatedUtc)
                return true;
        }

        return false;
    }
}
