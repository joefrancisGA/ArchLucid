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
}
