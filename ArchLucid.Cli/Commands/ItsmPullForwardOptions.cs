namespace ArchLucid.Cli.Commands;

internal sealed class ItsmPullForwardOptions
{
    public string? LedgerDirectory { get; init; }

    public string? EvidencePath { get; init; }

    public string? JsonOutPath { get; init; }

    public string? MarkdownOutPath { get; init; }

    public bool IncludeApi { get; init; }

    public bool SuppressDefaultArtifacts { get; init; }

    public static ItsmPullForwardOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        return new ItsmPullForwardOptions
        {
            LedgerDirectory = CliCommandShared.TryGetOptionValue(args, "--ledger-dir"),
            EvidencePath = CliCommandShared.TryGetOptionValue(args, "--evidence"),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            IncludeApi = args.Any(static arg => string.Equals(arg, "--include-api", StringComparison.Ordinal)),
            SuppressDefaultArtifacts = args.Any(static arg =>
                string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }
}
