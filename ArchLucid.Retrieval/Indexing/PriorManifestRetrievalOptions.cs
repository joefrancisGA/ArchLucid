namespace ArchLucid.Retrieval.Indexing;

/// <summary>Cross-run prior-manifest retrieval indexing limits.</summary>
public sealed class PriorManifestRetrievalOptions
{
    public const string SectionPath = "Retrieval:PriorManifest";

    public int MaxPriorManifestsPerIndex { get; set; } = 5;
}
