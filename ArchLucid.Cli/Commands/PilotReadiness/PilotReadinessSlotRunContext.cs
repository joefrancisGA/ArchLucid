namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class PilotReadinessSlotRunContext
{
    public required string RepositoryRoot { get; init; }

    public required PilotReadinessBundleOptions Options { get; init; }

    public HttpClient? HttpClient { get; init; }

    public ArchLucidProjectScaffolder.ArchLucidCliConfig? Config { get; init; }

    public required string[] RawArgs { get; init; }

    // Offline CI replay has no live run id and no API. Bundle slots use pass-only
    // fixture packs so the release-train gate can require overall Pass.
    internal bool IsOfflineReplay =>
        string.IsNullOrWhiteSpace(Options.RunId) && !Options.IncludeApi;

    internal string? TryResolveOfflineFixturePath(string relativePath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(relativePath);

        if (!IsOfflineReplay)
            return null;

        return Path.Combine(RepositoryRoot, relativePath);
    }
}
