namespace ArchLucid.Cli.Commands;

internal sealed class ItsmPullForwardReport
{
    public required string RepositoryRoot { get; init; }

    public required string LedgerDirectory { get; init; }

    public string? BaseUrl { get; init; }

    public required DateTime GeneratedUtc { get; init; }

    public required ItsmPullForwardVerdict Recommendation { get; init; }

    public required IReadOnlyList<ItsmPullForwardCheckResult> Checks { get; init; }

    public required ItsmPullForwardTriggerCounts Triggers { get; init; }

    public required int LedgerFilesScanned { get; init; }

    public string? JsonArtifactPath { get; init; }

    public string? MarkdownArtifactPath { get; init; }

    public bool RequiresOwnerAction => Recommendation == ItsmPullForwardVerdict.PullForward;

    internal ItsmPullForwardReport WithOutputMetadata(
        string? jsonArtifactPath,
        string? markdownArtifactPath) =>
        new()
        {
            RepositoryRoot = RepositoryRoot,
            LedgerDirectory = LedgerDirectory,
            BaseUrl = BaseUrl,
            GeneratedUtc = GeneratedUtc,
            Recommendation = Recommendation,
            Checks = Checks,
            Triggers = Triggers,
            LedgerFilesScanned = LedgerFilesScanned,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
        };
}
