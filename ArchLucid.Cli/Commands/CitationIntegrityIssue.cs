namespace ArchLucid.Cli.Commands;

internal sealed class CitationIntegrityIssue
{
    public string RunId { get; init; } = string.Empty;

    public string ClaimCategory { get; init; } = string.Empty;

    public string AgentType { get; init; } = string.Empty;

    public string? FindingId { get; init; }

    public CitationIntegrityVerdict Verdict { get; init; }

    public string Reason { get; init; } = string.Empty;

    public string EvidencePointer { get; init; } = string.Empty;
}
