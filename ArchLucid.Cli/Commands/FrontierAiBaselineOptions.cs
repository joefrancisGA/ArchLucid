namespace ArchLucid.Cli.Commands;

internal sealed class FrontierAiBaselineOptions
{
    public string? ScoreboardPath { get; init; }

    public string? JsonOutPath { get; init; }

    public string? MarkdownOutPath { get; init; }

    public bool InitScoreboard { get; init; }

    public bool SuppressDefaultArtifacts { get; init; }

    public static FrontierAiBaselineOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        return new FrontierAiBaselineOptions
        {
            ScoreboardPath = CliCommandShared.TryGetOptionValue(args, "--scoreboard"),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            InitScoreboard = args.Any(static arg => string.Equals(arg, "--init-scoreboard", StringComparison.Ordinal)),
            SuppressDefaultArtifacts = args.Any(static arg =>
                string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }
}
