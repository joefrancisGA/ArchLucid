using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application;

public sealed partial class ReplayRunService
{
    private async Task<bool> SourceRunHasAuthorityStageProgressAsync(
        string originalRunId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParseExact(originalRunId, "N", out Guid runGuid) && !Guid.TryParse(originalRunId, out runGuid))
            return false;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<StageTimelineSummary> stages =
            await _runStageOutcomesRepository.ListByRunIdAsync(runGuid, cancellationToken).ConfigureAwait(false);

        return stages.Count > 0;
    }
}
