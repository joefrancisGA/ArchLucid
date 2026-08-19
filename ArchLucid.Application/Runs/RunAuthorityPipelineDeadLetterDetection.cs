using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Derives operator-facing dead-letter state from persisted <c>dbo.Runs.LastFailureReason</c> JSON.
/// </summary>
public static class RunAuthorityPipelineDeadLetterDetection
{
    /// <summary>
    ///     <see langword="true" /> when <paramref name="record" /> carries a pipeline dead-letter failure summary.
    /// </summary>
    public static bool IsDeadLettered(RunRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return IsDeadLettered(record.LastFailureReason);
    }

    /// <summary>
    ///     <see langword="true" /> when <paramref name="lastFailureReason" /> JSON uses
    ///     <see cref="AgentExecutionFailureClasses.PipelineDeadLetter" />.
    /// </summary>
    public static bool IsDeadLettered(string? lastFailureReason)
    {
        AgentExecutionFailureSummary? summary = AgentExecutionFailureSummaryJson.TryDeserialize(lastFailureReason);

        if (summary is null)
            return false;

        return string.Equals(
            summary.FailureClass,
            AgentExecutionFailureClasses.PipelineDeadLetter,
            StringComparison.Ordinal);
    }
}
