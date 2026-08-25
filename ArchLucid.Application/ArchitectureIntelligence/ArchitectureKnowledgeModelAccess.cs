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
        ArchitectureKnowledgeModel? fromIdentity = await TryLoadViaArchitectureIdentityAsync(
            scope,
            runId,
            tenantId,
            cancellationToken).ConfigureAwait(false);

        if (fromIdentity is not null)
            return fromIdentity;

        return await LoadByRunIdFallbackAsync(tenantId, runId, cancellationToken).ConfigureAwait(false);
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

        await _persistence.SaveModelAsync(model, cancellationToken).ConfigureAwait(false);

        ArchLucid.Persistence.Models.RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (run?.ArchitectureId is not Guid architectureId
            || string.IsNullOrWhiteSpace(model.ModelId))
            return;

        await _architectureIdentityRepository
            .UpdateCurrentModelAsync(scope, architectureId, model.ModelId, cancellationToken)
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
