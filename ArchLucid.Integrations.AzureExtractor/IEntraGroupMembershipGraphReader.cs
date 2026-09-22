using Azure.Core;

using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

public interface IEntraGroupMembershipGraphReader
{
    Task<EntraGroupMembershipGraphReadResult> TryReadDirectMembershipsAsync(
        TokenCredential credential,
        IReadOnlyList<string> seedGroupIds,
        int maxNestedDepth,
        CancellationToken cancellationToken);
}
