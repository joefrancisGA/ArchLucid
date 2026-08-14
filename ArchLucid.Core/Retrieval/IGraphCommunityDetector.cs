using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Retrieval;

/// <summary>Partitions a bounded <see cref="GraphSnapshot" /> into communities for Graph-RAG summarization (TB-877).</summary>
public interface IGraphCommunityDetector
{
    IReadOnlyList<GraphCommunity> DetectCommunities(GraphSnapshot snapshot);
}
