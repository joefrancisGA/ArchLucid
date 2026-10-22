using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Azure.Storage.Blobs;

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
        Dictionary<string, List<string>> filesByRunPrefix =
            AgentTraceOrphanBlobEnumerator.EnumerateLocalBlobsByRunPrefix(blobOpts, cutoff, cancellationToken);

        return await DeleteOrphanedRunPrefixesAsync(filesByRunPrefix, cancellationToken).ConfigureAwait(false);
    }

    private async Task<int> DeleteOrphanedAzureBlobsAsync(
        ArtifactLargePayloadOptions blobOpts,
        DateTimeOffset cutoff,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<BlobServiceClient> clients =
            AgentTraceOrphanBlobEnumerator.ResolveAzureClients(blobOpts, _blobServiceClient);

        if (clients.Count == 0)
            return 0;

        int deleted = 0;

        foreach (BlobServiceClient client in clients)
        {
            BlobContainerClient container = client.GetBlobContainerClient(AgentTraceOrphanBlobPathParser.AgentTracesContainer);

            if (!await container.ExistsAsync(cancellationToken).ConfigureAwait(false))
                continue;

            Dictionary<string, List<string>> blobsByRunPrefix =
                await AgentTraceOrphanBlobEnumerator.EnumerateAzureBlobsByRunPrefixAsync(container, cutoff, cancellationToken)
                    .ConfigureAwait(false);

            foreach ((string runPrefix, List<string> blobNames) in blobsByRunPrefix)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!await AgentTraceOrphanBlobOrphanMatcher.IsOrphanedRunAsync(_runRepository, runPrefix, cancellationToken)
                        .ConfigureAwait(false))
                    continue;

                deleted += await AgentTraceOrphanBlobDeleter.DeleteAzureOrphanBlobsAsync(container, blobNames, cancellationToken)
                    .ConfigureAwait(false);
            }
        }

        AgentTraceOrphanBlobDeleter.LogAzureDeletion(_logger, deleted, cutoff);

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

            if (!await AgentTraceOrphanBlobOrphanMatcher.IsOrphanedRunAsync(_runRepository, runPrefix, cancellationToken)
                    .ConfigureAwait(false))
                continue;

            deleted += AgentTraceOrphanBlobDeleter.DeleteLocalOrphanFiles(filePaths);
        }

        AgentTraceOrphanBlobDeleter.LogLocalDeletion(_logger, deleted);

        return deleted;
    }

    internal static bool TryParseRunPrefixFromBlobName(string blobName, out string runPrefix) =>
        AgentTraceOrphanBlobPathParser.TryParseRunPrefixFromBlobName(blobName, out runPrefix);

    internal static bool TryParseRunIdFromRunPrefix(string runPrefix, out Guid runId) =>
        AgentTraceOrphanBlobPathParser.TryParseRunIdFromRunPrefix(runPrefix, out runId);
}
