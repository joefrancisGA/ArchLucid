using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Graph;

/// <inheritdoc cref="IGraphCommunitySummarizationService" />
public sealed class GraphCommunitySummarizationService(
    IGraphCommunityDetector communityDetector,
    IGraphCommunitySummaryCompletionClient summaryCompletionClient,
    IOptionsMonitor<AdvancedRetrievalOptions> advancedOptions,
    ILogger<GraphCommunitySummarizationService> logger) : IGraphCommunitySummarizationService
{
    private readonly IGraphCommunityDetector _communityDetector =
        communityDetector ?? throw new ArgumentNullException(nameof(communityDetector));

    private readonly IGraphCommunitySummaryCompletionClient _summaryCompletionClient =
        summaryCompletionClient ?? throw new ArgumentNullException(nameof(summaryCompletionClient));

    private readonly IOptionsMonitor<AdvancedRetrievalOptions> _advancedOptions =
        advancedOptions ?? throw new ArgumentNullException(nameof(advancedOptions));

    private readonly ILogger<GraphCommunitySummarizationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalDocument>> BuildCommunityDocumentsAsync(
        GraphSnapshot snapshot,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        AdvancedRetrievalOptions options = _advancedOptions.CurrentValue;

        if (!options.Enabled || !options.EnableCommunitySummarization)
            return [];

        IReadOnlyList<GraphCommunity> communities = _communityDetector.DetectCommunities(snapshot);

        if (communities.Count == 0)
            return [];

        Dictionary<string, GraphNode> nodesById = snapshot.Nodes
            .Where(static node => !string.IsNullOrWhiteSpace(node.NodeId))
            .GroupBy(static node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.Ordinal);

        List<GraphCommunitySummary> summaries = [];

        foreach (GraphCommunity community in communities)
        {
            cancellationToken.ThrowIfCancellationRequested();

            string summary = await SummarizeCommunityAsync(community, nodesById, cancellationToken).ConfigureAwait(false);

            if (string.IsNullOrWhiteSpace(summary))
                continue;

            summaries.Add(new GraphCommunitySummary
            {
                CommunityId = community.CommunityId,
                MemberNodeIds = community.MemberNodeIds,
                Summary = summary,
            });
        }

        return KnowledgeGraphCommunityRetrievalDocumentBuilder.BuildFromCommunities(
            snapshot,
            tenantId,
            workspaceId,
            projectId,
            summaries);
    }

    private async Task<string> SummarizeCommunityAsync(
        GraphCommunity community,
        IReadOnlyDictionary<string, GraphNode> nodesById,
        CancellationToken cancellationToken)
    {
        List<GraphNode> memberNodes = community.MemberNodeIds
            .Where(nodesById.ContainsKey)
            .Select(nodeId => nodesById[nodeId])
            .ToList();

        if (memberNodes.Count == 0)
            return string.Empty;

        if (memberNodes.Count == 1)
            return KnowledgeGraphNodeEmbeddingTextComposer.Compose(memberNodes[0]);

        string context = string.Join(
            "\n",
            memberNodes.Select(static node => KnowledgeGraphNodeEmbeddingTextComposer.Compose(node)));

        try
        {
            return await _summaryCompletionClient
                .SummarizeCommunityAsync(context, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Graph community summarization failed for {CommunityId}; using deterministic member join.",
                    community.CommunityId);
            }

            return context.Length <= 2_000 ? context : context[..2_000];
        }
    }
}
