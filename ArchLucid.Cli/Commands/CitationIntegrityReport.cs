namespace ArchLucid.Cli.Commands;

internal sealed class CitationIntegrityReport
{
    public string RepositoryRoot { get; init; } = string.Empty;

    public string? BaseUrl { get; init; }

    public DateTime GeneratedUtc { get; init; }

    public CitationIntegrityVerdict OverallVerdict { get; init; }

    public int SampleSize { get; init; }

    public int CommittedRunsConsidered { get; init; }

    public int RunsWithFailIssues { get; init; }

    public int FailThreshold { get; init; }

    public bool FailThresholdExceeded => RunsWithFailIssues >= FailThreshold;

    public IReadOnlyList<CitationIntegrityRunResult> Runs { get; init; } = [];

    public string? JsonArtifactPath { get; init; }

    public string? MarkdownArtifactPath { get; init; }

    internal CitationIntegrityReport WithOutputMetadata(
        string? jsonArtifactPath,
        string? markdownArtifactPath) =>
        new()
        {
            RepositoryRoot = RepositoryRoot,
            BaseUrl = BaseUrl,
            GeneratedUtc = GeneratedUtc,
            OverallVerdict = OverallVerdict,
            SampleSize = SampleSize,
            CommittedRunsConsidered = CommittedRunsConsidered,
            RunsWithFailIssues = RunsWithFailIssues,
            FailThreshold = FailThreshold,
            Runs = Runs,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
        };
}
