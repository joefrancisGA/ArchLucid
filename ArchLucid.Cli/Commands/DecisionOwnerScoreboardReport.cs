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
}
