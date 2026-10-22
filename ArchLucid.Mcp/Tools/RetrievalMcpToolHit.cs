namespace ArchLucid.Mcp.Tools;

public sealed class RetrievalMcpToolHit
{
    public string DocumentId
    {
        get;
        init;
    } = string.Empty;

    public string CorpusKind
    {
        get;
        init;
    } = string.Empty;

    public string SourceType
    {
        get;
        init;
    } = string.Empty;

    public string SourceId
    {
        get;
        init;
    } = string.Empty;

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string Snippet
    {
        get;
        init;
    } = string.Empty;

    public double Score
    {
        get;
        init;
    }
}
