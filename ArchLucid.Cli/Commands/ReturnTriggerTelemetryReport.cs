namespace ArchLucid.Cli.Commands;

internal sealed class ReturnTriggerTelemetryReport
{
    public string RepositoryRoot { get; init; } = string.Empty;

    public string LedgerDirectory { get; init; } = string.Empty;

    public DateTime GeneratedUtc { get; init; }

    public ReturnTriggerTelemetryVerdict OverallVerdict { get; init; }

    public IReadOnlyList<ReturnTriggerTelemetryCheckResult> Checks { get; init; } = [];

    public ReturnTriggerTelemetryCohortMetrics? CohortMetrics { get; init; }

    public IReadOnlyDictionary<string, int> ReturnTriggerCounts { get; init; } =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    public IReadOnlyDictionary<string, int> DismissalTriggerCounts { get; init; } =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    public bool AnyFail => OverallVerdict == ReturnTriggerTelemetryVerdict.Fail;
}
