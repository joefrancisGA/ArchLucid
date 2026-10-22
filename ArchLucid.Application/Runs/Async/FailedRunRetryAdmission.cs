using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Async;

/// <inheritdoc cref="IFailedRunRetryAdmission" />
public sealed class FailedRunRetryAdmission(IRunRepository runRepository) : IFailedRunRetryAdmission
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    /// <inheritdoc />
    public async Task TryMarkRetryingAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunRecord? header = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (header is null)
            return;

        if (!string.Equals(
                header.LegacyRunStatus,
                nameof(ArchitectureRunStatus.Failed),
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        ArchitectureRunStatusTransitionTable.AssertLegal(
            ArchitectureRunStatus.Failed,
            ArchitectureRunStatusLifecycleEvent.RetryRequested,
            ArchitectureRunStatus.Retrying);

        header.LegacyRunStatus = nameof(ArchitectureRunStatus.Retrying);
        header.RetryCount += 1;
        header.CompletedUtc = null;
        await _runRepository.UpdateAsync(header, cancellationToken);
    }
}
