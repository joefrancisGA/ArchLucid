namespace ArchLucid.Core.Configuration;

/// <summary>Chunking strategy for default retrieval corpora (TB-686).</summary>
public sealed class RetrievalChunkingOptions
{
    public const string SectionPath = "Retrieval:Chunking";

    /// <summary>
    ///     Default <see cref="RetrievalChunkingStrategy.Simple" /> until TB-595 ablation shows lift.
    ///     Policy-pack and prior-manifest corpora keep dedicated chunkers regardless.
    /// </summary>
    public RetrievalChunkingStrategy Strategy
    {
        get;
        set;
    } = RetrievalChunkingStrategy.Simple;
}
