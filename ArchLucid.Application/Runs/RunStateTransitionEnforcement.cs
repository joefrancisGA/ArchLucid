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

    private static string FormatCommitMessage(string runId, string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return $"Run '{runId}' cannot be committed.";

        return $"Run '{runId}' {message}";
    }
}
