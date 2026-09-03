using ArchLucid.Application.Http;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Runs.Query.Stages;

internal static class RunFindingsLifecycleGuard
{
    internal static async Task<RunFindingsQueryOutcome?> TryBlockWhenLifecycleIncompleteAsync(
        string runId,
        IRunRepository authorityRunRepository,
        IScopeContextProvider scopeContextProvider,
        CancellationToken cancellationToken)
    {
        if (!AuthorityRunIdentifier.TryParse(runId, out Guid runGuid))
            return RunFindingsQueryOutcome.NotFound;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Persistence.Models.RunRecord? run =
            await authorityRunRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run is null)
            return RunFindingsQueryOutcome.NotFound;

        try
        {
            AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(
                AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(run),
                runId);
        }
        catch (ConflictException)
        {
            return RunFindingsQueryOutcome.Conflict;
        }

        return null;
    }
}
