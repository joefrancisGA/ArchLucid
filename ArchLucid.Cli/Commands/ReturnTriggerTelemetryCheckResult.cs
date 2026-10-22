namespace ArchLucid.Cli.Commands;

internal sealed class ReturnTriggerTelemetryCheckResult
{
    public string Name { get; init; } = string.Empty;

    public ReturnTriggerTelemetryVerdict Verdict { get; init; }

    public string Evidence { get; init; } = string.Empty;

    public string? Resolution { get; init; }
}
