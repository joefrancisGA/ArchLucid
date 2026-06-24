using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Marks <c>dbo.Runs</c> terminal when deferred authority pipeline work dead-letters.
/// </summary>
public static class AuthorityPipelineDeadLetterRunMarker
{
    /// <summary>
    ///     Persists <see cref="ArchitectureRunStatus.Failed" /> with a schema-versioned failure summary when the run row exists.
    /// </summary>
    public static async Task TryMarkRunDeadLetteredAsync(
        IRunRepository runRepository,
        ScopeContext scope,
        Guid runId,
        string deadLetterSummary,
        DateTime completedUtc,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(scope);

        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return;

        if (string.Equals(run.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;

        run.LegacyRunStatus = nameof(ArchitectureRunStatus.Failed);
        run.CompletedUtc = completedUtc;
        run.LastFailureReason = BuildFailureReasonJson(deadLetterSummary);
        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }

    internal static string BuildFailureReasonJson(string deadLetterSummary)
    {
        AgentExecutionFailureSummary summary = new()
        {
            FailureClass = AgentExecutionFailureClasses.PipelineDeadLetter,
            ReasonCode = "authorityPipelineWorkDeadLettered",
        };

        return AgentExecutionFailureSummaryJson.Serialize(summary);
    }
}
