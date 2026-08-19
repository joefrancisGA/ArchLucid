namespace ArchLucid.Cli.Commands;

internal sealed class PilotReadinessBundleSlotResult
{
    public required string SlotKey
    {
        get;
        init;
    }

    public required string DisplayName
    {
        get;
        init;
    }

    public required PilotReadinessBundleSlotVerdict Verdict
    {
        get;
        init;
    }

    public required string Evidence
    {
        get;
        init;
    }

    public string? JsonArtifactPath
    {
        get;
        init;
    }

    public string? MarkdownArtifactPath
    {
        get;
        init;
    }

    public string? SponsorMarkdownArtifactPath
    {
        get;
        init;
    }
}
