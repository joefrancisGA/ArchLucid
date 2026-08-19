namespace ArchLucid.Cli.Commands;

internal sealed class DecisionOwnerScoreboardOptions
{
    public string? LedgerDirectory { get; init; }

    public string? RulesPath { get; init; }

    public string? JsonOutPath { get; init; }

    public string? MarkdownOutPath { get; init; }

    public string? SponsorMarkdownOutPath { get; init; }

    public bool SuppressDefaultArtifacts { get; init; }

    public static DecisionOwnerScoreboardOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        return new DecisionOwnerScoreboardOptions
        {
            LedgerDirectory = CliCommandShared.TryGetOptionValue(args, "--ledger-dir"),
            RulesPath = CliCommandShared.TryGetOptionValue(args, "--rules"),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            SponsorMarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--sponsor-markdown-out"),
            SuppressDefaultArtifacts = args.Any(static arg =>
                string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }
}
