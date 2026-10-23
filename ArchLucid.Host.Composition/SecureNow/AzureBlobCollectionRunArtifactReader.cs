using System.Text.Json;

using ArchLucid.Application.SecureNow;

using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.SecureNow;

public sealed class AzureBlobCollectionRunArtifactReader(
    BlobServiceClient blobServiceClient,
    IOptions<CollectionRunStorageOptions> options) : ICollectionRunArtifactReader
{
    private readonly BlobServiceClient _blobServiceClient =
        blobServiceClient ?? throw new ArgumentNullException(nameof(blobServiceClient));

    private readonly CollectionRunStorageOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    public async Task<IReadOnlyList<CollectionRunManifest>> ListManifestsAsync(
        CancellationToken cancellationToken = default)
    {
        BlobContainerClient container = Container();
        List<CollectionRunManifest> manifests = [];

        try
        {
            await foreach (BlobItem blob in container.GetBlobsAsync(
                               traits: BlobTraits.None,
                               states: BlobStates.None,
                               prefix: ManifestPrefix(),
                               cancellationToken: cancellationToken))
            {
                if (!blob.Name.EndsWith("/run-manifest.json", StringComparison.OrdinalIgnoreCase))
                    continue;

                CollectionRunManifest? manifest = await ReadManifestAsync(container, blob.Name, cancellationToken);
                if (manifest is not null)
                    manifests.Add(manifest);
            }
        }
        catch (RequestFailedException)
        {
            return manifests;
        }

        return manifests;
    }

    public async Task<CollectionRunArtifact?> ReadArtifactAsync(
        CollectionRunManifest manifest,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        if (string.IsNullOrWhiteSpace(manifest.ZipPath))
            return null;

        BlobClient package = Container().GetBlobClient(manifest.ZipPath);
        MemoryStream bytes = new();

        try
        {
            await package.DownloadToAsync(bytes, cancellationToken);
        }
        catch (RequestFailedException)
        {
            return null;
        }

        return new CollectionRunArtifact
        {
            Manifest = manifest,
            ZipBytes = bytes.ToArray(),
        };
    }

    private BlobContainerClient Container()
    {
        string containerName = string.IsNullOrWhiteSpace(_options.ContainerName)
            ? "securenow-collection"
            : _options.ContainerName;

        return _blobServiceClient.GetBlobContainerClient(containerName);
    }

    private string ManifestPrefix()
    {
        string prefix = string.IsNullOrWhiteSpace(_options.Prefix) ? "runs/" : _options.Prefix;

        return prefix.TrimEnd('/') + "/";
    }

    private static async Task<CollectionRunManifest?> ReadManifestAsync(
        BlobContainerClient container,
        string blobName,
        CancellationToken cancellationToken)
    {
        BlobClient blob = container.GetBlobClient(blobName);

        BinaryData content;

        try
        {
            content = (await blob.DownloadContentAsync(cancellationToken)).Value.Content;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return null;
        }

        using JsonDocument document = JsonDocument.Parse(content);
        JsonElement root = document.RootElement;

        if (!Guid.TryParse(GetString(root, "runId"), out Guid runId))
            return null;

        if (!DateTime.TryParse(GetString(root, "startedUtc"), out DateTime startedUtc))
            return null;

        string[] subscriptions = root.TryGetProperty("subscriptions", out JsonElement subscriptionElement) &&
                                  subscriptionElement.ValueKind == JsonValueKind.Array
            ? subscriptionElement.EnumerateArray()
                .Where(static item => item.ValueKind == JsonValueKind.String)
                .Select(static item => item.GetString()!)
                .ToArray()
            : [];

        return new CollectionRunManifest
        {
            RunId = runId,
            TenantId = Guid.TryParse(GetString(root, "tenantId"), out Guid tenantId) ? tenantId : null,
            AgentVersion = GetString(root, "agentVersion") ?? "unknown",
            StartedUtc = startedUtc.ToUniversalTime(),
            FinishedUtc = DateTime.TryParse(GetString(root, "finishedUtc"), out DateTime finishedUtc)
                ? finishedUtc.ToUniversalTime()
                : null,
            Status = GetString(root, "status") ?? "Failed",
            SubscriptionsCovered = subscriptions,
            ErrorSummary = GetString(root, "errorSummary"),
            ZipPath = GetString(root, "packageBlobPath"),
            ZipSha256 = GetString(root, "packageSha256"),
            SchemaVersion = GetInt(root, "schemaVersion"),
        };
    }

    private static string? GetString(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out JsonElement property))
            return null;

        return property.ValueKind == JsonValueKind.String ? property.GetString() : property.ToString();
    }

    private static int GetInt(JsonElement root, string propertyName)
    {
        string? value = GetString(root, propertyName);
        return int.TryParse(value, out int result) ? result : 0;
    }
}
