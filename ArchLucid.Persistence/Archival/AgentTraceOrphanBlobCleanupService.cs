using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Archival;

/// <inheritdoc cref="IAgentTraceOrphanBlobCleanupService" />
public sealed class AgentTraceOrphanBlobCleanupService(
    IRunRepository runRepository,
    IOptionsMonitor<ArtifactLargePayloadOptions> payloadOptions,
    ITenantRegionalArtifactBlobClients? regionalClients,
    BlobServiceClient? blobServiceClient,
    ILogger<AgentTraceOrphanBlobCleanupService> logger) : IAgentTraceOrphanBlobCleanupService
{
    private const string AgentTracesContainer = "agent-traces";

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IOptionsMonitor<ArtifactLargePayloadOptions> _payloadOptions =
        payloadOptions ?? throw new ArgumentNullException(nameof(payloadOptions));

    private readonly ITenantRegionalArtifactBlobClients? _regionalClients = regionalClients;

    private readonly BlobServiceClient? _blobServiceClient = blobServiceClient;

    private readonly ILogger<AgentTraceOrphanBlobCleanupService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<int> DeleteOrphanedBlobsAsync(
        DataArchivalBlobCleanupOptions options,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!options.Enabled)
            return 0;

        ArtifactLargePayloadOptions blobOpts = _payloadOptions.CurrentValue;

        if (string.Equals(blobOpts.BlobProvider, "None", StringComparison.OrdinalIgnoreCase))
            return 0;

        int minAgeDays = Math.Clamp(options.MinAgeDays, 1, 3650);
        DateTimeOffset cutoff = TimeProvider.System.GetUtcNow().AddDays(-minAgeDays);

        if (string.Equals(blobOpts.BlobProvider, "Local", StringComparison.OrdinalIgnoreCase))
            return await DeleteOrphanedLocalBlobsAsync(blobOpts, cutoff, cancellationToken).ConfigureAwait(false);

        if (string.Equals(blobOpts.BlobProvider, "AzureBlob", StringComparison.OrdinalIgnoreCase))
            return await DeleteOrphanedAzureBlobsAsync(blobOpts, cutoff, cancellationToken).ConfigureAwait(false);

        return 0;
    }

    private async Task<int> DeleteOrphanedLocalBlobsAsync(
        ArtifactLargePayloadOptions blobOpts,
        DateTimeOffset cutoff,
        CancellationToken cancellationToken)
    {
        string root = string.IsNullOrWhiteSpace(blobOpts.LocalRootPath)
            ? Path.Combine(AppContext.BaseDirectory, "blob-store")
            : blobOpts.LocalRootPath;

        root = Path.GetFullPath(root);
        string containerDir = Path.Combine(root, SanitizeFileToken(AgentTracesContainer));

        if (!Directory.Exists(containerDir))
            return 0;

        Dictionary<string, List<string>> filesByRunPrefix = new(StringComparer.OrdinalIgnoreCase);

        foreach (string filePath in Directory.EnumerateFiles(containerDir, "*", SearchOption.AllDirectories))
        {
            cancellationToken.ThrowIfCancellationRequested();

            DateTime lastWriteUtc = File.GetLastWriteTimeUtc(filePath);

            if (lastWriteUtc > cutoff.UtcDateTime)
                continue;

            if (!TryParseRunPrefixFromLocalPath(containerDir, filePath, out string runPrefix))
                continue;

            if (!filesByRunPrefix.TryGetValue(runPrefix, out List<string>? list))
            {
                list = [];
                filesByRunPrefix[runPrefix] = list;
            }

            list.Add(filePath);
        }

        return await DeleteOrphanedRunPrefixesAsync(filesByRunPrefix, cancellationToken).ConfigureAwait(false);
    }

    private async Task<int> DeleteOrphanedAzureBlobsAsync(
        ArtifactLargePayloadOptions blobOpts,
        DateTimeOffset cutoff,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<BlobServiceClient> clients = ResolveAzureClients(blobOpts);

        if (clients.Count == 0)
            return 0;

        int deleted = 0;

        foreach (BlobServiceClient client in clients)
        {
            BlobContainerClient container = client.GetBlobContainerClient(AgentTracesContainer);

            if (!await container.ExistsAsync(cancellationToken).ConfigureAwait(false))
                continue;

            Dictionary<string, List<string>> blobsByRunPrefix = new(StringComparer.OrdinalIgnoreCase);

            await foreach (BlobItem item in container
                               .GetBlobsAsync(BlobTraits.None, BlobStates.All, cancellationToken: cancellationToken)
                               .ConfigureAwait(false))
            {
                if (item.Properties.LastModified.HasValue && item.Properties.LastModified.Value > cutoff)
                    continue;

                if (!TryParseRunPrefixFromBlobName(item.Name, out string runPrefix))
                    continue;

                if (!blobsByRunPrefix.TryGetValue(runPrefix, out List<string>? list))
                {
                    list = [];
                    blobsByRunPrefix[runPrefix] = list;
                }

                list.Add(item.Name);
            }

            foreach ((string runPrefix, List<string> blobNames) in blobsByRunPrefix)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!TryParseRunIdFromRunPrefix(runPrefix, out Guid runId))
                    continue;

                RunRecord? run = await _runRepository.GetByRunIdAdminAsync(runId, cancellationToken).ConfigureAwait(false);

                if (run is not null)
                    continue;

                foreach (string blobName in blobNames)
                {
                    await container.DeleteBlobIfExistsAsync(
                            blobName,
                            DeleteSnapshotsOption.IncludeSnapshots,
                            cancellationToken: cancellationToken)
                        .ConfigureAwait(false);

                    deleted++;
                    ArchLucidInstrumentation.DataArchivalBlobsDeletedTotal.Add(1);
                }
            }
        }

        if (deleted > 0)
        {
            _logger.LogInformation(
                "Agent trace blob cleanup: deleted {Count} orphaned Azure blob(s) older than cutoff {Cutoff:O}.",
                deleted,
                cutoff);
        }

        return deleted;
    }

    private async Task<int> DeleteOrphanedRunPrefixesAsync(
        Dictionary<string, List<string>> filesByRunPrefix,
        CancellationToken cancellationToken)
    {
        int deleted = 0;

        foreach ((string runPrefix, List<string> filePaths) in filesByRunPrefix)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!TryParseRunIdFromRunPrefix(runPrefix, out Guid runId))
                continue;

            RunRecord? run = await _runRepository.GetByRunIdAdminAsync(runId, cancellationToken).ConfigureAwait(false);

            if (run is not null)
                continue;

            foreach (string filePath in filePaths)
            {
                File.Delete(filePath);
                deleted++;
                ArchLucidInstrumentation.DataArchivalBlobsDeletedTotal.Add(1);
            }

            TryDeleteEmptyRunDirectories(filePaths);
        }

        if (deleted > 0)
        {
            _logger.LogInformation("Agent trace blob cleanup: deleted {Count} orphaned local blob file(s).", deleted);
        }

        return deleted;
    }

    private static void TryDeleteEmptyRunDirectories(IReadOnlyList<string> filePaths)
    {
        foreach (string filePath in filePaths)
        {
            string? directory = Path.GetDirectoryName(filePath);

            while (!string.IsNullOrEmpty(directory))
            {
                if (Directory.Exists(directory) && !Directory.EnumerateFileSystemEntries(directory).Any())
                    Directory.Delete(directory);
                else
                    break;

                directory = Path.GetDirectoryName(directory);
            }
        }
    }

    private IReadOnlyList<BlobServiceClient> ResolveAzureClients(ArtifactLargePayloadOptions blobOpts)
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

        if (_blobServiceClient is not null && uris.Contains(_blobServiceClient.Uri.ToString(), StringComparer.OrdinalIgnoreCase))
            clients.Add(_blobServiceClient);

        foreach (string uri in uris)
        {
            if (_blobServiceClient is not null &&
                string.Equals(_blobServiceClient.Uri.ToString(), uri, StringComparison.OrdinalIgnoreCase))
                continue;

            clients.Add(new BlobServiceClient(new Uri(uri)));
        }

        if (clients.Count == 0 && _blobServiceClient is not null)
            clients.Add(_blobServiceClient);

        return clients;
    }

    internal static bool TryParseRunPrefixFromBlobName(string blobName, out string runPrefix)
    {
        runPrefix = string.Empty;

        if (string.IsNullOrWhiteSpace(blobName))
            return false;

        string normalized = blobName.Replace("\\", "/", StringComparison.Ordinal).Trim('/');
        string[] segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length < 2)
            return false;

        if (!Guid.TryParse(segments[0], out _))
            return false;

        if (!Guid.TryParse(segments[1], out _))
            return false;

        runPrefix = $"{segments[0]}/{segments[1]}";

        return true;
    }

    internal static bool TryParseRunIdFromRunPrefix(string runPrefix, out Guid runId)
    {
        runId = Guid.Empty;

        if (string.IsNullOrWhiteSpace(runPrefix))
            return false;

        string[] segments = runPrefix.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length < 2)
            return false;

        return Guid.TryParse(segments[1], out runId);
    }

    private static bool TryParseRunPrefixFromLocalPath(string containerDir, string filePath, out string runPrefix)
    {
        runPrefix = string.Empty;

        string relative = Path.GetRelativePath(containerDir, filePath);
        string normalized = relative.Replace("\\", "/", StringComparison.Ordinal);
        string[] segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length < 3)
            return false;

        if (!Guid.TryParse(segments[0], out _))
            return false;

        if (!Guid.TryParse(segments[1], out _))
            return false;

        runPrefix = $"{segments[0]}/{segments[1]}";

        return true;
    }

    private static string SanitizeFileToken(string segment)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(segment);

        return segment.Replace("/", "_").Replace("\\", "_");
    }
}
