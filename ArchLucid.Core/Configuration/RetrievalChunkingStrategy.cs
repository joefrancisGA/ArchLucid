namespace ArchLucid.Core.Configuration;

/// <summary>Retrieval document text splitting strategy (TB-686).</summary>
public enum RetrievalChunkingStrategy
{
    /// <summary>Fixed character windows via <c>SimpleTextChunker</c>.</summary>
    Simple = 0,

    /// <summary>Structure-aware splits (headings, fenced blocks, paragraphs) before windowing.</summary>
    Semantic = 1,
}
