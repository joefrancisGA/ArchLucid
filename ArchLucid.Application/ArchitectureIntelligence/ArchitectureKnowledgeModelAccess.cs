using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureKnowledgeModelAccess(
    IArchitectureIntelligencePersistence? persistence,
    IRunRepository? runRepository = null,
    IArchitectureIdentityRepository? architectureIdentityRepository = null,
    IKnowledgeModelGraphReprojector? knowledgeModelGraphReprojector = null) : IArchitectureKnowledgeModelAccess
{
    private readonly IArchitectureIntelligencePersistence? _persistence = persistence;

    private readonly IRunRepository? _runRepository = runRepository;

    private readonly IArchitectureIdentityRepository? _architectureIdentityRepository =
        architectureIdentityRepository;

    private readonly IKnowledgeModelGraphReprojector? _knowledgeModelGraphReprojector =
        knowledgeModelGraphReprojector;

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
                    return pinned;
            }
        }

        ArchitectureKnowledgeModel? runScoped = await LoadByRunIdFallbackAsync(tenantId, runId, cancellationToken)
            .ConfigureAwait(false);

        if (runScoped is not null)
            return runScoped;

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

        if (run.GraphSnapshotId.HasValue)
            run.GraphSnapshotId = null;

        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        if (run.ArchitectureId is not Guid architectureId
            || _architectureIdentityRepository is null)
            return;

        Guid? architectureHeadRunId = await _runRepository
            .GetLatestRunIdForArchitectureAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        if (architectureHeadRunId == runId)
        {
            await _runRepository
                .ClearGraphSnapshotForArchitectureAsync(scope, architectureId, cancellationToken)
                .ConfigureAwait(false);

            await _architectureIdentityRepository
                .UpdateCurrentModelAsync(scope, architectureId, nextModelId, cancellationToken)
                .ConfigureAwait(false);
        }

        if (_knowledgeModelGraphReprojector is not null)
        {
            await _knowledgeModelGraphReprojector
                .TryReprojectForRunAsync(scope, runId, model, cancellationToken)
                .ConfigureAwait(false);
        }
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
            .ConfigureAwait(false);
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
}
