namespace ArchLucid.Cli.Commands;

internal sealed class FrontierAiBaselineCohortMetrics
{
    public required int SessionCount { get; init; }

    public required int MeasuredArchLucidTimingRows { get; init; }

    public required int MeasuredManualTimingRows { get; init; }

    public required double DecisionChangeRate { get; init; }

    public required double DecisionDeltaPassRate { get; init; }

    public required double MedianRepeatUseIntent { get; init; }

    public required string TopLossMode { get; init; }

    public required bool MessagingReady { get; init; }
}
