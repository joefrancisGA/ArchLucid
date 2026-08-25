using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureKnowledgeModelAccess(
    IArchitectureIntelligencePersistence? persistence,
    IRunRepository runRepository,
    IArchitectureIdentityRepository architectureIdentityRepository) : IArchitectureKnowledgeModelAccess
{
    private readonly IArchitectureIntelligencePersistence? _persistence = persistence;

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    public async Task<ArchitectureKnowledgeModel?> GetForRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (_persistence is null || runId == Guid.Empty)
            return null;

        string tenantId = scope.TenantId.ToString("D");
        ArchitectureKnowledgeModel? runScoped = await LoadByRunIdFallbackAsync(tenantId, runId, cancellationToken)
            .ConfigureAwait(false);

        if (runScoped is not null)
            return runScoped;

        return await TryLoadViaArchitectureIdentityAsync(scope, runId, tenantId, cancellationToken)
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

        model.ModelId = nextModelId;
        model.RunId = runId.ToString("D");

        if (model.CreatedUtc == default)
            model.CreatedUtc = utcNow;

        model.UpdatedUtc = utcNow;

        await _persistence.SaveModelAsync(model, cancellationToken).ConfigureAwait(false);

        ArchLucid.Persistence.Models.RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            return;

        if (run.GraphSnapshotId.HasValue)
        {
            run.GraphSnapshotId = null;
            await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
        }

        if (run.ArchitectureId is not Guid architectureId)
            return;

        await _architectureIdentityRepository
            .UpdateCurrentModelAsync(scope, architectureId, nextModelId, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<ArchitectureKnowledgeModel?> TryLoadViaArchitectureIdentityAsync(
        ScopeContext scope,
        Guid runId,
        string tenantId,
        CancellationToken cancellationToken)
    {
        ArchLucid.Persistence.Models.RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (run?.ArchitectureId is not Guid architectureId)
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
