using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Mcp.Tools;

public sealed record RetrievalMcpToolRequest
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ProjectId
    {
        get;
        init;
    }

    public string QueryText
    {
        get;
        init;
    } = string.Empty;

    public int TopK
    {
        get;
        init;
    } = 8;

    public bool IncludePlatformCorpora
    {
        get;
        init;
    }

    public CorpusKind? CorpusKindFilter
    {
        get;
        init;
    }
}
