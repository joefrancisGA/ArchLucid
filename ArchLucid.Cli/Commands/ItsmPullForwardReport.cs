namespace ArchLucid.Cli.Commands;

internal sealed class ItsmPullForwardReport
{
    public required string RepositoryRoot { get; init; }

    public required DateTime GeneratedUtc { get; init; }

    public required ItsmPullForwardVerdict Recommendation { get; init; }

    public required IReadOnlyList<ItsmPullForwardCheckResult> Checks { get; init; }

    public required ItsmPullForwardTriggerCounts Triggers { get; init; }

    public required int LedgerFilesScanned { get; init; }

    public bool RequiresOwnerAction => Recommendation == ItsmPullForwardVerdict.PullForward;
}
