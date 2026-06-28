namespace ArchLucid.Cli.Commands;

internal sealed class PilotReadinessBundleOptions
{
    public string? RunId { get; init; }

    public string? JsonOutPath { get; init; }

    public string? MarkdownOutPath { get; init; }

    public string? UiBaseUrl { get; init; }

    public bool IncludeApi { get; init; }

    public bool SuppressDefaultArtifacts { get; init; }

    public static PilotReadinessBundleOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        return new PilotReadinessBundleOptions
        {
            RunId = CliCommandShared.TryGetOptionValue(args, "--run-id"),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            UiBaseUrl = CliCommandShared.TryGetOptionValue(args, "--ui-base-url"),
            IncludeApi = args.Any(static arg => string.Equals(arg, "--include-api", StringComparison.Ordinal)),
            SuppressDefaultArtifacts = args.Any(static arg =>
                string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }
}
