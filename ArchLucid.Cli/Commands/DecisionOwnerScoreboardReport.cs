namespace ArchLucid.Cli.Commands;

internal sealed class DecisionOwnerScoreboardReport
{
    public string RepositoryRoot { get; init; } = string.Empty;

    public string LedgerDirectory { get; init; } = string.Empty;

    public DateTime GeneratedUtc { get; init; }

    public DecisionOwnerScoreboardVerdict OverallVerdict { get; init; }

    public IReadOnlyList<DecisionOwnerScoreboardCheckResult> Checks { get; init; } = [];

    public IReadOnlyList<DecisionOwnerScoreboardRow> Rows { get; init; } = [];

    public string OperatorMarkdown { get; init; } = string.Empty;

    public string SponsorMarkdown { get; init; } = string.Empty;

    public bool AnyFail => OverallVerdict == DecisionOwnerScoreboardVerdict.Fail;

    public string? JsonArtifactPath { get; init; }

    public string? MarkdownArtifactPath { get; init; }

    public string? SponsorMarkdownArtifactPath { get; init; }

    internal DecisionOwnerScoreboardReport WithOutputMetadata(
        string? jsonArtifactPath,
        string? markdownArtifactPath,
        string? sponsorMarkdownArtifactPath) =>
        new()
        {
            RepositoryRoot = RepositoryRoot,
            LedgerDirectory = LedgerDirectory,
            GeneratedUtc = GeneratedUtc,
            OverallVerdict = OverallVerdict,
            Checks = Checks,
            Rows = Rows,
            OperatorMarkdown = OperatorMarkdown,
            SponsorMarkdown = SponsorMarkdown,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
            SponsorMarkdownArtifactPath = sponsorMarkdownArtifactPath,
        };
}
