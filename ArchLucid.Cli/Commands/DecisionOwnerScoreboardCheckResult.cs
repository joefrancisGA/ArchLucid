namespace ArchLucid.Cli.Commands;

internal sealed class DecisionOwnerScoreboardCheckResult
{
    public string Name { get; init; } = string.Empty;

    public DecisionOwnerScoreboardVerdict Verdict { get; init; }

    public string Evidence { get; init; } = string.Empty;

    public string? Resolution { get; init; }
}
