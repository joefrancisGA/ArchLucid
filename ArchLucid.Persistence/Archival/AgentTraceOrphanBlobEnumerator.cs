using ArchLucid.Persistence.BlobStore;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ArchLucid.Persistence.Archival;

internal static class AgentTraceOrphanBlobEnumerator
{
    internal static Dictionary<string, List<string>> EnumerateLocalBlobsByRunPrefix(
        ArtifactLargePayloadOptions blobOpts,
        DateTimeOffset cutoff,
        CancellationToken cancellationToken)
    {
        string root = string.IsNullOrWhiteSpace(blobOpts.LocalRootPath)
            ? Path.Combine(AppContext.BaseDirectory, "blob-store")
            : blobOpts.LocalRootPath;

        root = Path.GetFullPath(root);
        string containerDir = Path.Combine(root, AgentTraceOrphanBlobPathParser.SanitizeFileToken(AgentTraceOrphanBlobPathParser.AgentTracesContainer));

        Dictionary<string, List<string>> filesByRunPrefix = new(StringComparer.OrdinalIgnoreCase);

        if (!Directory.Exists(containerDir))
            return filesByRunPrefix;

        foreach (string filePath in Directory.EnumerateFiles(containerDir, "*", SearchOption.AllDirectories))
        {
            cancellationToken.ThrowIfCancellationRequested();

            DateTime lastWriteUtc = File.GetLastWriteTimeUtc(filePath);

            if (lastWriteUtc > cutoff.UtcDateTime)
                continue;

            if (!AgentTraceOrphanBlobPathParser.TryParseRunPrefixFromLocalPath(containerDir, filePath, out string runPrefix))
                continue;

            if (!filesByRunPrefix.TryGetValue(runPrefix, out List<string>? list))
            {
                list = [];
                filesByRunPrefix[runPrefix] = list;
            }

            list.Add(filePath);
        }

        return filesByRunPrefix;
    }

    internal static async Task<Dictionary<string, List<string>>> EnumerateAzureBlobsByRunPrefixAsync(
        BlobContainerClient container,
        DateTimeOffset cutoff,
        CancellationToken cancellationToken)
    {
        Dictionary<string, List<string>> blobsByRunPrefix = new(StringComparer.OrdinalIgnoreCase);

        await foreach (BlobItem item in container
                           .GetBlobsAsync(BlobTraits.None, BlobStates.All, prefix: string.Empty, cancellationToken: cancellationToken)
                           .ConfigureAwait(false))
        {
            if (item.Properties.LastModified.HasValue && item.Properties.LastModified.Value > cutoff)
                continue;

            if (!AgentTraceOrphanBlobPathParser.TryParseRunPrefixFromBlobName(item.Name, out string runPrefix))
                continue;

            if (!blobsByRunPrefix.TryGetValue(runPrefix, out List<string>? list))
            {
                list = [];
                blobsByRunPrefix[runPrefix] = list;
            }

            list.Add(item.Name);
        }

        return blobsByRunPrefix;
    }

    internal static IReadOnlyList<BlobServiceClient> ResolveAzureClients(
        ArtifactLargePayloadOptions blobOpts,
        BlobServiceClient? blobServiceClient)
    {
        HashSet<string> uris = new(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(blobOpts.AzureBlobServiceUri))
            uris.Add(blobOpts.AzureBlobServiceUri.Trim());

        if (blobOpts.AzureBlobServiceUriByRegion is not null)
        {
            foreach (string uri in blobOpts.AzureBlobServiceUriByRegion.Values)
            {
                if (!string.IsNullOrWhiteSpace(uri))
                    uris.Add(uri.Trim());
            }
        }

        List<BlobServiceClient> clients = [];

        if (blobServiceClient is not null && uris.Contains(blobServiceClient.Uri.ToString(), StringComparer.OrdinalIgnoreCase))
            clients.Add(blobServiceClient);

        foreach (string uri in uris)
        {
            if (blobServiceClient is not null &&
                string.Equals(blobServiceClient.Uri.ToString(), uri, StringComparison.OrdinalIgnoreCase))
                continue;

            clients.Add(new BlobServiceClient(new Uri(uri)));
        }

        if (clients.Count == 0 && blobServiceClient is not null)
            clients.Add(blobServiceClient);

        return clients;
    }
}
