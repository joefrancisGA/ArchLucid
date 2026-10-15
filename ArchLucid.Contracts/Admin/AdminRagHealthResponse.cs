using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Admin;

public sealed class AdminRagHealthResponse
{
    public string EmbeddingModelId
    {
        get;
        set;
    } = "";

    private IReadOnlyList<AdminRagCorpusHealthItem> corpora = [];

    public IReadOnlyList<AdminRagCorpusHealthItem> Corpora
    {
        get => corpora;
        set => corpora = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
