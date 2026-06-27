namespace ArchLucid.Cli.Commands;

internal sealed class FrontierAiScoreboardSessionRow
{
    public required string SessionLabel { get; init; }

    public required string DateUtc { get; init; }

    public required string Packet { get; init; }

    public required string ExecutionMode { get; init; }

    public required string ArchLucidMinutes { get; init; }

    public required string ManualMinutes { get; init; }

    public required string TimingBasis { get; init; }

    public required int DecisionChangeCount { get; init; }

    public required string DecisionDeltaOutcome { get; init; }

    public required int RepeatUseIntent { get; init; }

    public required string LossMode { get; init; }

    public required string ArchLucidWin { get; init; }

    public required bool AntiClaimsOk { get; init; }
}
