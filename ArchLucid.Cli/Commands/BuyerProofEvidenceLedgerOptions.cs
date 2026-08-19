namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofEvidenceLedgerOptions
{
    public string? ProofDirectory { get; init; }

    public string? RulesPath { get; init; }

    public string? JsonOutPath { get; init; }

    public string? MarkdownOutPath { get; init; }

    public bool SuppressDefaultArtifacts { get; init; }

    public static BuyerProofEvidenceLedgerOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        return new BuyerProofEvidenceLedgerOptions
        {
            ProofDirectory = CliCommandShared.TryGetOptionValue(args, "--proof-dir"),
            RulesPath = CliCommandShared.TryGetOptionValue(args, "--rules"),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            SuppressDefaultArtifacts = args.Any(static arg =>
                string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }
}
