using System.Diagnostics;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Polls architecture run status until the run is ready to commit against a hosted API.
/// </summary>
internal static class ArchitectureRunCommitPoller
{
    /// <summary>
    ///     Polls the supplied status probe until the run is <see cref="ArchitectureRunStatus.ReadyForCommit" /> or
    ///     <see cref="ArchitectureRunStatus.Committed" />, the status is <see cref="ArchitectureRunStatus.Failed" />,
    ///     the <paramref name="deadline" /> elapses, or cancellation is requested.
    /// </summary>
    /// <remarks>
    ///     Pulled out as an internal static so unit tests can verify the timeout path with a deterministic
    ///     probe (no live API). The probe is allowed to return null when the run is not yet visible.
    /// </remarks>
    internal static async Task<ArchitectureRunStatus> PollForCommittableStatusAsync(
        Func<CancellationToken, Task<ArchitectureRunStatus?>> probe,
        TimeSpan deadline,
        TimeSpan pollInterval,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(probe);

        if (deadline <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(deadline));
        if (pollInterval <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(pollInterval));

        // Stopwatch is monotonic and immune to wall-clock changes — important when this command runs inside
        // a freshly-booted devcontainer whose clock may step shortly after start.
        Stopwatch stopwatch = Stopwatch.StartNew();
        ArchitectureRunStatus last = ArchitectureRunStatus.Created;

        while (stopwatch.Elapsed < deadline && !cancellationToken.IsCancellationRequested)
        {
            ArchitectureRunStatus? observed = await probe(cancellationToken);

            if (observed.HasValue)
            {
                last = observed.Value;

                if (last == ArchitectureRunStatus.Failed || last is ArchitectureRunStatus.ReadyForCommit or ArchitectureRunStatus.Committed)
                    return last;
            }

            try
            {
                await Task.Delay(pollInterval, cancellationToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }

        return last;
    }
}
