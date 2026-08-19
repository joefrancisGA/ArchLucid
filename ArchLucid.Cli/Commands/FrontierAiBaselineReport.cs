namespace ArchLucid.Cli.Commands;

internal sealed class FrontierAiBaselineReport
{
    public required string RepositoryRoot { get; init; }

    public required string ScoreboardPath { get; init; }

    public required DateTime GeneratedUtc { get; init; }

    public required FrontierAiBaselineVerdict OverallVerdict { get; init; }

    public required IReadOnlyList<FrontierAiBaselineCheckResult> Checks { get; init; }

    public required IReadOnlyList<FrontierAiScoreboardSessionRow> Sessions { get; init; }

    public FrontierAiBaselineCohortMetrics? CohortMetrics { get; init; }

    public bool AnyFail => Checks.Any(static check => check.Verdict == FrontierAiBaselineVerdict.Fail);

    public string? JsonArtifactPath { get; init; }

    public string? MarkdownArtifactPath { get; init; }

    internal FrontierAiBaselineReport WithOutputMetadata(
        string? jsonArtifactPath,
        string? markdownArtifactPath) =>
        new()
        {
            RepositoryRoot = RepositoryRoot,
            ScoreboardPath = ScoreboardPath,
            GeneratedUtc = GeneratedUtc,
            OverallVerdict = OverallVerdict,
            Checks = Checks,
            Sessions = Sessions,
            CohortMetrics = CohortMetrics,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
        };
}
