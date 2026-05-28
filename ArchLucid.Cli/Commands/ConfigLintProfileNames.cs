namespace ArchLucid.Cli.Commands;

/// <summary>Named config lint profiles mapped to first-pilot and hosted-pilot readiness checks.</summary>
internal static class ConfigLintProfileNames
{
    /// <summary>
    ///     Production-like hosted pilot: simulate Production, strict production validation, and full hosting advisor
    ///     output (auth traps, SQL-related fail-fast keys, telemetry export, LLM redaction, Azure OpenAI connectivity).
    /// </summary>
    public const string ProductionLikeHostedPilot = "production-like-hosted-pilot";
}
