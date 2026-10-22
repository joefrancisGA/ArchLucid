namespace ArchLucid.Contracts.Agents;

using ArchLucid.Contracts.Common;

/// <summary>Projects required-agent outcomes from persisted <see cref="AgentResult"/> rows (TB-937).</summary>
public static class RequiredAgentExecutionOutcomes
{
    private static readonly AgentType[] RequiredInOrder =
    [
        AgentType.Topology,
        AgentType.Cost,
        AgentType.Compliance,
        AgentType.Critic,
    ];

    public static IReadOnlyList<AgentType> RequiredAgentTypes => RequiredInOrder;

    public static IReadOnlyList<AgentExecutionOutcome> Project(IReadOnlyList<AgentResult>? results)
    {
        IReadOnlyList<AgentResult> safeResults = results ?? [];

        return RequiredInOrder
            .Select(agentType => ProjectOne(agentType, safeResults))
            .ToList();
    }

    public static bool HasCommitReadyOutcomes(IReadOnlyList<AgentExecutionOutcome> outcomes)
    {
        ArgumentNullException.ThrowIfNull(outcomes);

        return outcomes.Count == RequiredInOrder.Length
               && outcomes.All(o => o.Outcome == AgentExecutionOutcomeKind.Succeeded);
    }

    public static bool HasAnySucceededRequiredAgent(IReadOnlyList<AgentExecutionOutcome> outcomes)
    {
        ArgumentNullException.ThrowIfNull(outcomes);

        return outcomes.Any(o => o.Outcome == AgentExecutionOutcomeKind.Succeeded);
    }

    /// <summary>
    ///     Buyer-summary markers omit ResultJson / degradation (TB-930). Presence maps to Succeeded;
    ///     Missing is still honest. Operator detail uses <see cref="Project"/> for full fidelity.
    /// </summary>
    public static IReadOnlyList<AgentExecutionOutcome> ProjectPresenceMarkers(IReadOnlyList<AgentResult>? markers)
    {
        IReadOnlyList<AgentResult> safeMarkers = markers ?? [];

        return RequiredInOrder
            .Select(agentType =>
            {
                AgentResult? match = safeMarkers
                    .Where(r => r.AgentType == agentType)
                    .OrderByDescending(r => r.CreatedUtc)
                    .FirstOrDefault();

                if (match is null)
                {
                    return new AgentExecutionOutcome
                    {
                        AgentType = agentType,
                        Outcome = AgentExecutionOutcomeKind.Missing,
                    };
                }

                return new AgentExecutionOutcome
                {
                    AgentType = agentType,
                    Outcome = AgentExecutionOutcomeKind.Succeeded,
                    TaskId = match.TaskId,
                };
            })
            .ToList();
    }

    private static AgentExecutionOutcome ProjectOne(AgentType agentType, IReadOnlyList<AgentResult> results)
    {
        List<AgentResult> matches = results.Where(r => r.AgentType == agentType).ToList();

        if (matches.Count == 0)
        {
            return new AgentExecutionOutcome
            {
                AgentType = agentType,
                Outcome = AgentExecutionOutcomeKind.Missing,
            };
        }

        // Prefer the most recent row when duplicates exist (defensive; commit still requires exactly one).
        AgentResult chosen = matches.OrderByDescending(r => r.CreatedUtc).First();

        if (!string.IsNullOrWhiteSpace(chosen.DegradationReasonCode))
        {
            return new AgentExecutionOutcome
            {
                AgentType = agentType,
                Outcome = AgentExecutionOutcomeKind.Degraded,
                TaskId = chosen.TaskId,
                DegradationReasonCode = chosen.DegradationReasonCode,
            };
        }

        if (AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(chosen, out _))
        {
            if (agentType == AgentType.Critic && AgentDownstreamConsistency.IsCriticStale(chosen, results))
            {
                return new AgentExecutionOutcome
                {
                    AgentType = agentType,
                    Outcome = AgentExecutionOutcomeKind.Stale,
                    TaskId = chosen.TaskId,
                };
            }

            return new AgentExecutionOutcome
            {
                AgentType = agentType,
                Outcome = AgentExecutionOutcomeKind.Succeeded,
                TaskId = chosen.TaskId,
            };
        }

        return new AgentExecutionOutcome
        {
            AgentType = agentType,
            Outcome = AgentExecutionOutcomeKind.Failed,
            TaskId = chosen.TaskId,
        };
    }
}
