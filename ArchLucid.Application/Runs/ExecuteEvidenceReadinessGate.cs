using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

public interface IExecuteEvidenceReadinessGate
{
    Task EnsureReadyAsync(string runId, CancellationToken cancellationToken = default);
}

/// <inheritdoc />
public sealed class ExecuteEvidenceReadinessGate(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IArchitectureRequestRepository requestRepository,
    IAgentTaskRepository taskRepository,
    IEvidenceBundleRepository evidenceBundleRepository) : IExecuteEvidenceReadinessGate
{
    public async Task EnsureReadyAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new InvalidOperationException($"Run '{runId}' is not a valid identifier.");

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? run = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run is null)
            throw new InvalidOperationException($"Run '{runId}' was not found.");

        if (string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            throw new InvalidOperationException($"Run '{runId}' is missing ArchitectureRequestId.");

        ArchitectureRequest? request =
            await requestRepository.GetByIdAsync(run.ArchitectureRequestId, cancellationToken);

        if (request is null)
            throw new InvalidOperationException($"Request '{run.ArchitectureRequestId}' not found for run '{runId}'.");

        IReadOnlyList<AgentTask> tasks = await taskRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        EvidenceBundle? bundle = null;
        string? bundleRef = tasks.FirstOrDefault()?.EvidenceBundleRef;

        if (!string.IsNullOrWhiteSpace(bundleRef))
            bundle = await evidenceBundleRepository.GetByIdAsync(bundleRef, cancellationToken);

        if (ExecuteEvidenceReadinessEvaluator.IsReadyForExecute(request, bundle))
            return;

        throw new ConflictException(ExecuteEvidenceReadinessEvaluator.ProblemDetail);
    }
}
