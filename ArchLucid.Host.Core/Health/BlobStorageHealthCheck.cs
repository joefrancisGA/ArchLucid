using ArchLucid.Persistence.BlobStore;

using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Health;

/// <summary>
/// When <see cref="ArtifactLargePayloadOptions"/> uses Azure Blob, probes the storage account via
/// a single-page container list (data-plane read compatible with <c>Storage Blob Data Contributor</c>).
/// Otherwise reports healthy (degraded scope).
/// </summary>
public sealed class BlobStorageHealthCheck(
    IOptionsMonitor<ArtifactLargePayloadOptions> payloadOptions,
    IServiceProvider services) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        ArtifactLargePayloadOptions o = payloadOptions.CurrentValue;

        if (!o.Enabled || !string.Equals(o.BlobProvider, "AzureBlob", StringComparison.OrdinalIgnoreCase))

            return HealthCheckResult.Healthy(
                "Large artifact offload is not enabled for Azure Blob (readiness scope not applicable).");

        BlobServiceClient? client = services.GetService(typeof(BlobServiceClient)) as BlobServiceClient;

        if (client is null)

            return HealthCheckResult.Unhealthy(
                "ArtifactLargePayload:BlobProvider is AzureBlob but BlobServiceClient is not registered.");

        try
        {
            // GetProperties requires blob service metadata read; Storage Blob Data Contributor does not include it.
            await foreach (Page<BlobContainerItem> _ in client
                               .GetBlobContainersAsync(cancellationToken: cancellationToken)
                               .AsPages(pageSizeHint: 1)
                               .ConfigureAwait(false))
            {
                break;
            }

            return HealthCheckResult.Healthy("Azure Blob data plane responded (container list).");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Azure Blob service probe failed.", ex);
        }
    }
}
