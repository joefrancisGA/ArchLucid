namespace ArchLucid.Cli.Commands;

internal sealed class ReturnTriggerTelemetryOptions
{
    public string? LedgerDirectory { get; init; }

    public string? RulesPath { get; init; }

    public string? JsonOutPath { get; init; }

    public string? MarkdownOutPath { get; init; }

    public bool SuppressDefaultArtifacts { get; init; }

    public static ReturnTriggerTelemetryOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        return new ReturnTriggerTelemetryOptions
        {
            LedgerDirectory = CliCommandShared.TryGetOptionValue(args, "--ledger-dir"),
            RulesPath = CliCommandShared.TryGetOptionValue(args, "--rules"),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            SuppressDefaultArtifacts = args.Any(static arg =>
                string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }
}
