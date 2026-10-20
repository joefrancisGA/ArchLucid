using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureKnowledgeModelAccess(
    IArchitectureIntelligencePersistence? persistence,
    IRunRepository? runRepository = null,
    IArchitectureIdentityRepository? architectureIdentityRepository = null,
    IKnowledgeModelGraphReprojector? knowledgeModelGraphReprojector = null,
    IArchitectureVersionKnowledgeModelPinSync? architectureVersionKnowledgeModelPinSync = null) : IArchitectureKnowledgeModelAccess
{
    private readonly IArchitectureIntelligencePersistence? _persistence = persistence;

    private readonly IRunRepository? _runRepository = runRepository;

    private readonly IArchitectureIdentityRepository? _architectureIdentityRepository =
        architectureIdentityRepository;

    private readonly IKnowledgeModelGraphReprojector? _knowledgeModelGraphReprojector =
        knowledgeModelGraphReprojector;

    private readonly IArchitectureVersionKnowledgeModelPinSync? _architectureVersionKnowledgeModelPinSync =
        architectureVersionKnowledgeModelPinSync;

    public async Task<ArchitectureKnowledgeModel?> GetForRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (_persistence is null || runId == Guid.Empty)
            return null;

        string tenantId = scope.TenantId.ToString("D");

        ArchLucid.Persistence.Models.RunRecord? run = null;

        if (_runRepository is not null)
        {
            run = await _runRepository
                .GetByIdAsync(scope, runId, cancellationToken)
                .ConfigureAwait(false);

            if (run is not null && !string.IsNullOrWhiteSpace(run.KnowledgeModelId))
            {
                ArchitectureKnowledgeModel? pinned = await _persistence
                    .GetModelAsync(tenantId, run.KnowledgeModelId, cancellationToken)
                    .ConfigureAwait(false);

                if (pinned is not null)
                {
                    EnsurePinnedKnowledgeModelContentHashOrThrow(run, pinned);
                    return ArchitectureKnowledgeModelCloner.Clone(pinned);
                }
            }
        }

        ArchitectureKnowledgeModel? runScoped = await LoadByRunIdFallbackAsync(tenantId, runId, cancellationToken)
            .ConfigureAwait(false);

        if (runScoped is not null)
        {
            EnsurePinnedKnowledgeModelContentHashOrThrow(run, runScoped);
            return ArchitectureKnowledgeModelCloner.Clone(runScoped);
        }

        if (_runRepository is not null
            && run is not null
            && run.ArchitectureId is Guid architectureId)
        {
            Guid? architectureHeadRunId = await _runRepository
                .GetLatestRunIdForArchitectureAsync(scope, architectureId, cancellationToken)
                .ConfigureAwait(false);

            if (architectureHeadRunId.HasValue && architectureHeadRunId.Value != runId)
                return null;
        }

        return await TryLoadViaArchitectureIdentityAsync(scope, run, tenantId, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task SaveForRunAsync(
        ScopeContext scope,
        Guid runId,
        ArchitectureKnowledgeModel model,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(model);

        if (_persistence is null || runId == Guid.Empty)
            return;

        DateTime utcNow = TimeProvider.System.GetUtcNow().UtcDateTime;
        string nextModelId = Guid.NewGuid().ToString("D");

        ArchitectureKnowledgeModel modelToSave = ArchitectureKnowledgeModelCloner.Clone(model);
        modelToSave.ModelId = nextModelId;
        modelToSave.RunId = runId.ToString("D");

        if (modelToSave.CreatedUtc == default)
            modelToSave.CreatedUtc = utcNow;

        modelToSave.UpdatedUtc = utcNow;

        await _persistence.SaveModelAsync(modelToSave, cancellationToken).ConfigureAwait(false);

        if (_runRepository is null)
            return;

        ArchLucid.Persistence.Models.RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            return;

        run.KnowledgeModelId = nextModelId;
        RunHeaderKnowledgeModelContentPin.ApplyToHeader(run, modelToSave, nextModelId);

        // Closed-loop publish runs during decisioning, after graph+findings. Nulling the
        // in-flight graph pointer then sealing GoldenManifestId 409s first finalize
        // (golden-cohort nightly: pipeline snapshot ids incomplete).
        Guid? graphSnapshotToPreserve = ShouldPreserveInFlightPipelineGraph(run)
            ? run.GraphSnapshotId
            : null;

        if (run.GraphSnapshotId.HasValue && graphSnapshotToPreserve is null)
            run.GraphSnapshotId = null;

        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        IArchitectureIdentityRepository? identityRepository = _architectureIdentityRepository;
        bool architectureIdentityAvailable = false;

        if (run.ArchitectureId is Guid architectureIdToAdvance
            && architectureIdToAdvance != Guid.Empty
            && identityRepository is not null)
        {
            architectureIdentityAvailable = true;
            Guid? architectureHeadRunId = await _runRepository
                .GetLatestRunIdForArchitectureAsync(scope, architectureIdToAdvance, cancellationToken)
                .ConfigureAwait(false);

            if (architectureHeadRunId == runId)
            {
                await _runRepository
                    .ClearGraphSnapshotForArchitectureAsync(scope, architectureIdToAdvance, cancellationToken)
                    .ConfigureAwait(false);

                await RestorePreservedPipelineGraphPointerAsync(
                        run,
                        graphSnapshotToPreserve,
                        cancellationToken)
                    .ConfigureAwait(false);

                await identityRepository
                    .UpdateCurrentModelAsync(scope, architectureIdToAdvance, nextModelId, cancellationToken)
                    .ConfigureAwait(false);
            }
        }

        // Create-time pin hashes intake only. Closed-loop persist writes κ afterward; re-pin so
        // finalize does not 409 (golden-cohort nightly: pinned ArchitectureVersionId κ drift).

        if (_architectureVersionKnowledgeModelPinSync is not null)
        {
            await _architectureVersionKnowledgeModelPinSync
                .SyncPinnedVersionToSavedModelAsync(scope, run, modelToSave, cancellationToken)
                .ConfigureAwait(false);
        }

        if (architectureIdentityAvailable && _knowledgeModelGraphReprojector is not null)
        {
            await _knowledgeModelGraphReprojector
                .TryReprojectForRunAsync(scope, runId, model, cancellationToken)
                .ConfigureAwait(false);
        }
    }

    private static bool ShouldPreserveInFlightPipelineGraph(ArchLucid.Persistence.Models.RunRecord run)
    {
        return run.GoldenManifestId.HasValue || run.FindingsSnapshotId.HasValue;
    }

    private async Task RestorePreservedPipelineGraphPointerAsync(
        ArchLucid.Persistence.Models.RunRecord run,
        Guid? graphSnapshotToPreserve,
        CancellationToken cancellationToken)
    {
        if (!graphSnapshotToPreserve.HasValue || _runRepository is null)
            return;

        run.GraphSnapshotId = graphSnapshotToPreserve;
        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }

    private async Task<ArchitectureKnowledgeModel?> TryLoadViaArchitectureIdentityAsync(
        ScopeContext scope,
        ArchLucid.Persistence.Models.RunRecord? run,
        string tenantId,
        CancellationToken cancellationToken)
    {
        if (_architectureIdentityRepository is null || run?.ArchitectureId is not Guid architectureId)
            return null;

        ArchitectureIdentityRecord? identity = await _architectureIdentityRepository
            .GetByIdAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        if (identity is null || string.IsNullOrWhiteSpace(identity.CurrentModelId))
            return null;

        return await _persistence!
            .GetModelAsync(tenantId, identity.CurrentModelId, cancellationToken)
            .ConfigureAwait(false) is ArchitectureKnowledgeModel loaded
            ? VerifyAndCloneForRun(run, loaded)
            : null;
    }

    private static ArchitectureKnowledgeModel VerifyAndCloneForRun(
        ArchLucid.Persistence.Models.RunRecord? run,
        ArchitectureKnowledgeModel model)
    {
        EnsurePinnedKnowledgeModelContentHashOrThrow(run, model);
        return ArchitectureKnowledgeModelCloner.Clone(model);
    }

    private async Task<ArchitectureKnowledgeModel?> LoadByRunIdFallbackAsync(
        string tenantId,
        Guid runId,
        CancellationToken cancellationToken)
    {
        ArchitectureKnowledgeModel? model = await _persistence!
            .GetModelByRunIdAsync(tenantId, runId.ToString("D"), cancellationToken)
            .ConfigureAwait(false);

        if (model is not null)
            return model;

        return await _persistence
            .GetModelByRunIdAsync(tenantId, runId.ToString("N"), cancellationToken)
            .ConfigureAwait(false);
    }

    private static void EnsurePinnedKnowledgeModelContentHashOrThrow(
        ArchLucid.Persistence.Models.RunRecord? run,
        ArchitectureKnowledgeModel model)
    {
        if (run is null || string.IsNullOrWhiteSpace(run.KnowledgeModelId))
        {
            if (run?.PinnedKnowledgeModelContentHashSha256 is { Length: > 0 })
            {
                throw new ConflictException(
                    "Knowledge model load blocked: run has a knowledge model content hash pin but no knowledge model id.");
            }

            return;
        }

        if (run.PinnedKnowledgeModelContentHashSha256 is not { Length: > 0 })
        {
            throw new ConflictException(
                "Knowledge model load blocked: run is missing create-time knowledge model content hash pin.");
        }

        byte[]? computed = KnowledgeModelContentFingerprint.TryComputeContentHashSha256(model);

        if (computed is null || !computed.AsSpan().SequenceEqual(run.PinnedKnowledgeModelContentHashSha256))
        {
            throw new ConflictException(
                "Knowledge model load blocked: knowledge model content hash drifted since run create.");
        }
    }
}
