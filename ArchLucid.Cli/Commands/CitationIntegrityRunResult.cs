namespace ArchLucid.Cli.Commands;

internal sealed class CitationIntegrityRunResult
{
    public string RunId { get; init; } = string.Empty;

    public CitationIntegrityVerdict Verdict { get; init; }

    public int AgentResultCount { get; init; }

    public IReadOnlyList<CitationIntegrityIssue> Issues { get; init; } = [];
}
