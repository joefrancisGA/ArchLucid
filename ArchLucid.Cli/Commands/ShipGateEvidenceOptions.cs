namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateEvidenceOptions
{
    public required string RunId
    {
        get;
        init;
    }

    public string? JsonOutPath
    {
        get;
        init;
    }

    public string? MarkdownOutPath
    {
        get;
        init;
    }

    public string? UiBaseUrl
    {
        get;
        init;
    }

    public static ShipGateEvidenceOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        string? runId = CliCommandShared.TryGetOptionValue(args, "--run-id");

        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Missing required --run-id <guid> option.", nameof(args));

        return new ShipGateEvidenceOptions
        {
            RunId = runId.Trim(),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            UiBaseUrl = CliCommandShared.TryGetOptionValue(args, "--ui-base-url"),
        };
    }
}
