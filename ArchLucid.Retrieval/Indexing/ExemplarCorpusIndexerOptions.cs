namespace ArchLucid.Retrieval.Indexing;

public sealed class ExemplarCorpusIndexerOptions
{
    public const string SectionPath = "Retrieval:ExemplarCorpus";

    public string ReferenceArchitecturesDirectory
    {
        get;
        init;
    } = "templates/reference-architectures";

    public string StarterProofPacksDirectory
    {
        get;
        init;
    } = "templates/starter-proof-packs";

    public bool IndexOnStartup
    {
        get;
        init;
    } = true;

    public int MaxDocuments
    {
        get;
        init;
    } = 64;
}
