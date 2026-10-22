namespace ArchLucid.Cli.Commands;

internal sealed class ConfigLintReportFinding
{
    public string RuleName { get; init; } = string.Empty;

    public string Message { get; init; } = string.Empty;

    public string Severity { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public string WhyItMatters { get; init; } = string.Empty;

    public string ConfigKeys { get; init; } = string.Empty;

    public string RemediationHint { get; init; } = string.Empty;

    public string ExpectedProofArtifact { get; init; } = string.Empty;
}
