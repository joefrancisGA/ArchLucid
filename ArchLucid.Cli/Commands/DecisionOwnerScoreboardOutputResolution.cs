namespace ArchLucid.Cli.Commands;

internal sealed class DecisionOwnerScoreboardOutputResolution
{
    public string? JsonPath
    {
        get;
        init;
    }

    public string? MarkdownPath
    {
        get;
        init;
    }

    public string? SponsorMarkdownPath
    {
        get;
        init;
    }

    public bool WillWriteJson => !string.IsNullOrWhiteSpace(JsonPath);

    public bool WillWriteMarkdown => !string.IsNullOrWhiteSpace(MarkdownPath);

    public bool WillWriteSponsorMarkdown => !string.IsNullOrWhiteSpace(SponsorMarkdownPath);
}
