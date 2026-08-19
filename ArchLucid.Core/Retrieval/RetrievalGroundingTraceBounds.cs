namespace ArchLucid.Core.Retrieval;

/// <summary>Bounded storage limits for forensic retrieval grounding traces (RAG-V1-006 / TB-038).</summary>
public static class RetrievalGroundingTraceBounds
{
    public const int MaxQueryTextLength = 4096;

    public const int MaxScoresJsonLength = 8192;

    public const int MaxDocumentIdsJsonLength = 4096;
}
