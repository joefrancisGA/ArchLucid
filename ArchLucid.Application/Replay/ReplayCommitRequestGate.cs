namespace ArchLucid.Application.Replay;

/// <summary>
///     Interprets the caller-requested replay commit flag after the authority pipeline has already run.
/// </summary>
public static class ReplayCommitRequestGate
{
    /// <summary>
    ///     Returns <see langword="true" /> when the caller asked not to persist a replay commit.
    /// </summary>
    /// <remarks>
    ///     <paramref name="commitReplayRequested" /> selects the outcome of an already-authorized pipeline run.
    ///     It is not an authentication or tenant-isolation bypass.
    /// </remarks>
    public static bool ShouldSkipCommit(bool commitReplayRequested)
    {
        // codeql[cs/user-controlled-bypass]
        return !commitReplayRequested;
    }
}
