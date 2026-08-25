using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Async;

/// <summary>
///     Detects admitted async creates that never finished coordination so same-key retry can re-enqueue.
/// </summary>
internal static class ArchitectureRunAsyncCreateCompleteness
{
    /// <summary>
    ///     True when the stub is still waiting on the worker, or create failed before authority snapshots existed.
    /// </summary>
    public static bool IsIncomplete(RunRecord? header)
    {
        if (header is null)
            return true;

        if (string.Equals(
                header.LegacyRunStatus,
                nameof(ArchitectureRunStatus.Created),
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Failed with no context snapshot means coordination never landed; retry should re-enqueue.
        if (string.Equals(
                header.LegacyRunStatus,
                nameof(ArchitectureRunStatus.Failed),
                StringComparison.OrdinalIgnoreCase)
            && header.ContextSnapshotId is null)
        {
            return true;
        }

        return false;
    }
}
