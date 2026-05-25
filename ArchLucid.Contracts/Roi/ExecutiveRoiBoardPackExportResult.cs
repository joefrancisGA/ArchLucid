namespace ArchLucid.Contracts.Roi;

/// <summary>HTTP/CLI payload for a board-pack export.</summary>
public sealed class ExecutiveRoiBoardPackExportResult
{
    public ExecutiveRoiBoardPackFormat Format
    {
        get;
        set;
    }

    public string ContentType
    {
        get;
        set;
    } = "text/markdown; charset=utf-8";

    public string FileName
    {
        get;
        set;
    } = "executive-roi-board-pack.md";

    public string? Markdown
    {
        get;
        set;
    }

    public byte[]? FileBytes
    {
        get;
        set;
    }
}
