using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Operator;

/// <summary>
///     Resolves the parent architecture identity for Working operator deep links (ADR 0077 / AO-10).
/// </summary>
public static class WorkingOperatorRunArchitectureIdResolver
{
    public static async Task<Guid?> TryResolveAsync(
        IRunRepository runRepository,
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(scope);

        if (!Guid.TryParse(runId, out Guid runGuid))
        {
            return null;
        }

        RunRecord? run = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (run?.ArchitectureId is Guid architectureId && architectureId != Guid.Empty)
        {
            return architectureId;
        }

        return null;
    }

    public static async Task<Guid?> TryResolveFromScopeProviderAsync(
        IRunRepository runRepository,
        IScopeContextProvider scopeContextProvider,
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        return await TryResolveAsync(runRepository, scope, runId, cancellationToken).ConfigureAwait(false);
    }
}
