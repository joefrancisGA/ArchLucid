namespace ArchLucid.Persistence.Coordination.Replay;

/// <summary>
///     String tokens for <see cref="ReplayRequest.Mode" /> / API replay requests (matched case-insensitively in
///     <see cref="AuthorityReplayService" />).
/// </summary>
public static class ReplayMode
{
    /// <summary>Load run detail and validate only; no decision engine or persistence writes.</summary>
    public const string ReconstructOnly = "ReconstructOnly";

    /// <summary>Re-run decisioning from stored context/graph/findings; persist new trace and manifest.</summary>
    public const string RebuildManifest = "RebuildManifest";

    /// <summary><see cref="RebuildManifest" /> plus artifact synthesis and bundle persistence.</summary>
    public const string RebuildArtifacts = "RebuildArtifacts";

    /// <summary>
    ///     Returns whether <paramref name="mode" /> is one of the supported replay mode tokens (case-insensitive).
    /// </summary>
    public static bool IsKnown(string mode)
    {
        if (string.IsNullOrWhiteSpace(mode))
            return true;

        return string.Equals(mode, ReconstructOnly, StringComparison.OrdinalIgnoreCase)
            || string.Equals(mode, RebuildManifest, StringComparison.OrdinalIgnoreCase)
            || string.Equals(mode, RebuildArtifacts, StringComparison.OrdinalIgnoreCase);
    }
}
