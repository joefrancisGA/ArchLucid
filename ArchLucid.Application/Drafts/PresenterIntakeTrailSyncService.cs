using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Drafts;

/// <summary>Syncs draft transparency trail updates onto spawned architecture requests (PC-09).</summary>
public interface IPresenterIntakeTrailSyncService
{
    Task TrySyncDraftTransparencyTrailToSpawnedRunAsync(
        ScopeContext scope,
        string? spawnedRunId,
        TransparencyTrail draftTrail,
        CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IPresenterIntakeTrailSyncService" />
public sealed class PresenterIntakeTrailSyncService(
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequestRepository) : IPresenterIntakeTrailSyncService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRequestRepository _architectureRequestRepository =
        architectureRequestRepository ?? throw new ArgumentNullException(nameof(architectureRequestRepository));

    public async Task TrySyncDraftTransparencyTrailToSpawnedRunAsync(
        ScopeContext scope,
        string? spawnedRunId,
        TransparencyTrail draftTrail,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(draftTrail);

        if (string.IsNullOrWhiteSpace(spawnedRunId))
            return;

        if (!Guid.TryParse(spawnedRunId.Trim(), out Guid runId))
            return;

        RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null || string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            return;

        ArchitectureRequest? request = await _architectureRequestRepository
            .GetByIdAsync(run.ArchitectureRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (request is null)
            return;

        request.IntakeTransparencyTrail = CloneTransparencyTrail(draftTrail);

        await _architectureRequestRepository
            .ReplaceAsync(request, cancellationToken)
            .ConfigureAwait(false);
    }

    private static TransparencyTrail CloneTransparencyTrail(TransparencyTrail trail)
    {
        string json = System.Text.Json.JsonSerializer.Serialize(trail);
        TransparencyTrail? clone = System.Text.Json.JsonSerializer.Deserialize<TransparencyTrail>(json);

        return clone ?? new TransparencyTrail();
    }
}
