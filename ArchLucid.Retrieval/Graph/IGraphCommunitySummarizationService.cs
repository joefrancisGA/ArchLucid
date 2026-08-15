using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Graph;

/// <summary>Builds community-summary retrieval documents from a graph snapshot when enabled (TB-877).</summary>
public interface IGraphCommunitySummarizationService
{
    Task<IReadOnlyList<RetrievalDocument>> BuildCommunityDocumentsAsync(
        GraphSnapshot snapshot,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken);
}
