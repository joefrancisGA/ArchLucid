using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

// MS.DI treats constructor parameters as required unless they have a default.
// These ports are optional so golden / in-memory composition can omit ledger and scope.
public sealed class ClosedLoopModelPersistenceHelper(
    IArchitectureIntelligencePersistence? persistence = null,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess = null,
    ITechnologyLedgerRepository? technologyLedgerRepository = null,
    IScopeContextProvider? scopeContextProvider = null)
{
    private readonly IArchitectureIntelligencePersistence? _persistence = persistence;
    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;
    private readonly ITechnologyLedgerRepository? _technologyLedgerRepository = technologyLedgerRepository;
    private readonly IScopeContextProvider? _scopeContextProvider = scopeContextProvider;

    public async Task<ArchitectureKnowledgeModel?> TryLoadExistingModelAsync(
        string tenantId,
        string runId,
        CancellationToken cancellationToken)
    {
        if (_knowledgeModelAccess is not null
            && _scopeContextProvider is not null
            && Guid.TryParse(runId, out Guid parsedRunId))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            return await _knowledgeModelAccess
                .GetForRunAsync(scope, parsedRunId, cancellationToken)
                .ConfigureAwait(false);
        }

        if (_persistence is null)
            return null;

        return await _persistence
            .GetModelByRunIdAsync(tenantId, runId, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task SaveModelAsync(
        string? runId,
        ArchitectureKnowledgeModel model,
        CancellationToken cancellationToken)
    {
        if (_knowledgeModelAccess is not null
            && _scopeContextProvider is not null
            && !string.IsNullOrWhiteSpace(runId)
            && Guid.TryParse(runId, out Guid parsedRunId))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            await _knowledgeModelAccess.SaveForRunAsync(scope, parsedRunId, model, cancellationToken)
                .ConfigureAwait(false);

            return;
        }

        if (_persistence is not null)
        {
            ArchitectureKnowledgeModel modelToSave = ArchitectureKnowledgeModelCloner.Clone(model);
            await _persistence.SaveModelAsync(modelToSave, cancellationToken).ConfigureAwait(false);
        }
    }

    public async Task<IReadOnlyList<TechnologyLedgerEntry>?> TryLoadLedgerEntriesAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (_technologyLedgerRepository is null
            || _scopeContextProvider is null
            || string.IsNullOrWhiteSpace(runId))
        {
            return null;
        }

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            return await _technologyLedgerRepository
                .GetByRunIdAsync(scope, runId, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return null;
        }
    }
}
