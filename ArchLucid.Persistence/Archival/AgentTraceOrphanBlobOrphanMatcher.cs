using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Archival;

internal static class AgentTraceOrphanBlobOrphanMatcher
{
    internal static async Task<bool> IsOrphanedRunAsync(
        IRunRepository runRepository,
        string runPrefix,
        CancellationToken cancellationToken)
    {
        if (!AgentTraceOrphanBlobPathParser.TryParseRunIdFromRunPrefix(runPrefix, out Guid runId))
            return false;

        RunRecord? run = await runRepository.GetByRunIdAdminAsync(runId, cancellationToken).ConfigureAwait(false);

        return run is null;
    }
}
