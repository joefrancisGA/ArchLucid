namespace ArchLucid.Core.Retrieval;

/// <summary>LLM summarization for knowledge-graph communities (TB-877).</summary>
public interface IGraphCommunitySummaryCompletionClient
{
    Task<string> SummarizeCommunityAsync(string communityContext, CancellationToken cancellationToken);
}
