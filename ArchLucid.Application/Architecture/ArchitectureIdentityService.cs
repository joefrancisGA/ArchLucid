using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureIdentityService
{
    /// <summary>
    ///     Creates a new architecture identity for a Created-origin synthesis run and links the run header.
    /// </summary>
    Task<ArchitectureIdentityRecord?> EnsureCreatedRunIdentityAsync(
        ScopeContext scope,
        Guid runId,
        string? knowledgeModelId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Links a review run to an existing architecture identity (re-review / compare recurrence).
    /// </summary>
    Task<bool> TryLinkRunToArchitectureAsync(
        ScopeContext scope,
        Guid runId,
        Guid architectureId,
        CancellationToken cancellationToken = default);
}

public sealed class ArchitectureIdentityService(
    IArchitectureIdentityRepository architectureIdentityRepository,
    IRunRepository runRepository) : IArchitectureIdentityService
{
    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    public async Task<ArchitectureIdentityRecord?> EnsureCreatedRunIdentityAsync(
        ScopeContext scope,
        Guid runId,
        string? knowledgeModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return null;

        if (run.ArchitectureId.HasValue)
        {
            return await _architectureIdentityRepository
                .GetByIdAsync(scope, run.ArchitectureId.Value, cancellationToken)
                .ConfigureAwait(false);
        }

        ArchitectureIdentityRecord identity = await _architectureIdentityRepository
            .CreateAsync(scope, knowledgeModelId, cancellationToken)
            .ConfigureAwait(false);

        run.ArchitectureId = identity.ArchitectureId;
        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        return identity;
    }

    public async Task<bool> TryLinkRunToArchitectureAsync(
        ScopeContext scope,
        Guid runId,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureIdentityRecord? identity = await _architectureIdentityRepository
            .GetByIdAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        if (identity is null)
            return false;

        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return false;

        run.ArchitectureId = architectureId;
        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        return true;
    }
}
