using Azure.Core;

namespace ArchLucid.Integrations.AzureExtractor;

public interface IEntraAddCredentialGraphReader
{
    Task<EntraAddCredentialGraphReadResult> TryReadSnapshotAsync(
        TokenCredential credential,
        int maxPaginationRequests,
        int maxApplicationOwnerRequests,
        CancellationToken cancellationToken);
}
