using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
/// Demo-only bridge: after <see cref="ArchLucid.Persistence.Interfaces.IRunRepository"/> seeds <c>dbo.Runs</c>,
/// coordinator tables (tasks, results, traces, governance, export history) still FK <c>dbo.ArchitectureRuns</c>.
/// This type is the single concentrated call site for obsolete <c>IArchitectureRunRepository</c> writes used by
/// <see cref="DemoSeedService"/> until those FKs converge. See docs/adr/0012-runs-authority-convergence-write-freeze.md.
/// </summary>
public interface IDemoLegacyArchitectureRunSynchronizer
{
    /// <summary>Inserts the legacy row required for coordinator FK chains.</summary>
    Task CreateLegacyRowAsync(ArchitectureRun run, CancellationToken cancellationToken = default);

    /// <summary>Transitions the legacy row to <see cref="ArchitectureRunStatus.Committed"/> from <see cref="ArchitectureRunStatus.Created"/>.</summary>
    Task CommitLegacyRowAsync(
        string runId,
        string manifestVersion,
        DateTime completedUtc,
        CancellationToken cancellationToken = default);
}
