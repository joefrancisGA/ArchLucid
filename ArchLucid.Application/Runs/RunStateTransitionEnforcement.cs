using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Runs;

namespace ArchLucid.Application.Runs;

/// <summary>Throws <see cref="ConflictException"/> when shared lifecycle preconditions fail.</summary>
public static class RunStateTransitionEnforcement
{
    public static void EnsureCommitAllowed(IRunStateTransitionService transitions, ArchitectureRun run, string runId)
    {
        ArgumentNullException.ThrowIfNull(transitions);
        ArgumentNullException.ThrowIfNull(run);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        RunStateTransitionCheck check = transitions.ValidateCommitAllowed(run.Status);

        if (!check.IsAllowed)
            throw new ConflictException(FormatCommitMessage(runId, check.Message));
    }

    public static void EnsureCommitAllowedLegacy(IRunStateTransitionService transitions, Guid runId, string? legacyRunStatus)
    {
        ArgumentNullException.ThrowIfNull(transitions);

        RunStateTransitionCheck check = transitions.ValidateCommitAllowedLegacy(legacyRunStatus);

        if (!check.IsAllowed)
            throw new ConflictException($"Run '{runId:D}' {check.Message}");
    }

    /// <summary>Blocks commit when required agents are missing, degraded, or empty (TB-937).</summary>
    public static void EnsureCommitReadyAgentResults(
        IRunStateTransitionService transitions,
        string runId,
        IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(transitions);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(results);

        if (transitions.HasCommitReadyAgentResults(results))
            return;

        IReadOnlyList<AgentExecutionOutcome> outcomes = RequiredAgentExecutionOutcomes.Project(results);
        string incomplete = string.Join(
            ", ",
            outcomes
                .Where(o => o.Outcome != AgentExecutionOutcomeKind.Succeeded)
                .Select(o => FormatIncompleteOutcome(o)));

        throw new ConflictException(
            FormatCommitMessage(
                runId,
                $"cannot be committed until all required agents succeed. Incomplete: {incomplete}."));
    }

    private static string FormatIncompleteOutcome(AgentExecutionOutcome outcome)
    {
        if (outcome.Outcome == AgentExecutionOutcomeKind.Stale && outcome.AgentType == AgentType.Critic)
        {
            return $"{outcome.AgentType}:Stale (Critic out of date — re-run required)";
        }

        return $"{outcome.AgentType}:{outcome.Outcome}";
    }

    private static string FormatCommitMessage(string runId, string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return $"Run '{runId}' cannot be committed.";

        return $"Run '{runId}' {message}";
    }
}
