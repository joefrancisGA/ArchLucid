namespace ArchLucid.Cli.Commands;

internal sealed class ItsmPullForwardCheckResult
{
    public required string Name { get; init; }

    public required ItsmPullForwardVerdict Verdict { get; init; }

    public required string Evidence { get; init; }

    public string? Resolution { get; init; }
}
