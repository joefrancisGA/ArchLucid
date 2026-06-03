namespace ArchLucid.Contracts.Admin;

public sealed class AdminRagHealthResponse
{
    public string EmbeddingModelId
    {
        get;
        set;
    } = "";

    public IReadOnlyList<AdminRagCorpusHealthItem> Corpora
    {
        get;
        set;
    } = [];
}
