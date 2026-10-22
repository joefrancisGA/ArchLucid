using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Feasibility;

/// <inheritdoc cref="IDecisionIntakeTrailProvider" />
public sealed class ArchitectureRequestIntakeTrailProvider(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequestRepository) : IDecisionIntakeTrailProvider
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRequestRepository _architectureRequestRepository =
        architectureRequestRepository ?? throw new ArgumentNullException(nameof(architectureRequestRepository));

    /// <inheritdoc />
    public async Task<TransparencyTrail?> TryGetTransparencyTrailAsync(Guid runId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (run is null || string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            return null;

        ArchitectureRequest? request =
            await _architectureRequestRepository.GetByIdAsync(run.ArchitectureRequestId, cancellationToken);

        if (request is null)
            return null;

        if (!string.Equals(request.RequestSource, "draft-intake", StringComparison.OrdinalIgnoreCase))
            return null;

        return request.IntakeTransparencyTrail;
    }
}
