namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofEvidenceLedgerOutputResolution
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

    public bool WillWriteJson => !string.IsNullOrWhiteSpace(JsonPath);

    public bool WillWriteMarkdown => !string.IsNullOrWhiteSpace(MarkdownPath);
}
