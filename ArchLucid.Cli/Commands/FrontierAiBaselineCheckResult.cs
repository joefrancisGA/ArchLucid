namespace ArchLucid.Cli.Commands;

internal sealed class FrontierAiBaselineCheckResult
{
    public required string Name { get; init; }

    public required FrontierAiBaselineVerdict Verdict { get; init; }

    public required string Evidence { get; init; }

    public string? Resolution { get; init; }
}
