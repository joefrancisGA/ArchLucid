using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using ArchLucid.Application.Runs;

namespace ArchLucid.Application.Operations;

/// <summary>Persists cooperative cancel as a terminal run failure with <c>failureClass=canceled</c> (TB-2076).</summary>
public sealed class OperationRunCancellationMarker(IRunRepository runRepository)
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    public async Task<bool> TryMarkRunCanceledAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (header is null)
            return false;

        if (string.Equals(
                header.LegacyRunStatus,
                nameof(ArchitectureRunStatus.Committed),
                StringComparison.OrdinalIgnoreCase))
            return false;

        if (IsAlreadyCanceled(header))
            return true;

        header.LegacyRunStatus = ArchitectureRunStatus.Failed.ToString();
        header.CompletedUtc = TimeProvider.System.UtcNowDateTime();
        header.LastFailureReason = AgentExecutionFailureSummaryJson.Serialize(
            new AgentExecutionFailureSummary
            {
                FailureClass = AgentExecutionFailureClasses.Canceled,
                ReasonCode = "user_requested"
            });

        await _runRepository.UpdateAsync(header, cancellationToken);

        return true;
    }

    internal static bool IsAlreadyCanceled(RunRecord run) =>
        AgentExecutionFailureSummaryJson.TryDeserialize(run.LastFailureReason)?.FailureClass
        == AgentExecutionFailureClasses.Canceled;
}
