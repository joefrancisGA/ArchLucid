namespace ArchLucid.Cli.Commands;

internal sealed class ReturnTriggerTelemetryCohortMetrics
{
    public int SessionCount { get; init; }

    public int PositiveReuseIntentCount { get; init; }

    public int DismissalObservedCount { get; init; }

    public int ExplicitReturnTriggerCount { get; init; }

    public double PositiveReuseFraction { get; init; }

    public string TopReturnTriggerCode { get; init; } = "none";

    public string TopDismissalTriggerCode { get; init; } = "none";

    public bool MessagingReady { get; init; }
}
