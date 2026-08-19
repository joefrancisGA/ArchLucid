namespace ArchLucid.Cli.Commands;

internal sealed class TenantIsolationNegativeTestProbeResult
{
    public string Name { get; init; } = string.Empty;

    public string Path { get; init; } = string.Empty;

    public string ExpectedOutcome { get; init; } = string.Empty;

    public string ObservedOutcome { get; init; } = string.Empty;

    public int? ObservedStatusCode { get; init; }

    public string? CorrelationId { get; init; }

    public TenantIsolationNegativeTestVerdict Verdict { get; init; }

    public string Evidence { get; init; } = string.Empty;
}
