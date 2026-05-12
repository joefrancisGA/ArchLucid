using System.Buffers.Binary;
using System.Linq;
using System.Text.Json;

using ArchLucid.Core.Scoping;

using ArchLucid.Persistence.BlobStore;

using Azure;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.AzureExtractorChunkUpload;

/// <summary>Stages chunked uploads into Azure Block Blob storage before ingest reads the assembled ZIP.</summary>
public sealed class AzureBlobAzureExtractorChunkSessionStore(
    BlobServiceClient blobServiceClient,
    IScopeContextProvider scopeProvider,
    IOptions<AzureExtractorChunkUploadOptions> chunkOptions) : IAzureExtractorChunkSessionStore
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly BlobServiceClient _blobServiceClient =
        blobServiceClient ?? throw new ArgumentNullException(nameof(blobServiceClient));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly AzureExtractorChunkUploadOptions _options =
        chunkOptions?.Value ?? throw new ArgumentNullException(nameof(chunkOptions));

    public bool IsAvailable => true;

    public async Task<Guid> CreateSessionAsync(AzureExtractorChunkSessionDescriptor descriptor, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(descriptor);

        ValidateDescriptorAgainstCaps(descriptor);

        Guid sessionId = Guid.NewGuid();

        AzureExtractorChunkSessionMetadata meta =
            AzureExtractorChunkSessionMetadata.FromDescriptor(descriptor, TimeProvider.System.GetUtcNow());

        BlobContainerClient container = GetContainer();

        await container.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: ct);

        BlobClient metaBlob = container.GetBlobClient(BuildMetaBlobPath(sessionId));

        await metaBlob.UploadAsync(
            new BinaryData(JsonSerializer.Serialize(meta, SerializerOptions)),
            overwrite: true,
            cancellationToken: ct);

        return sessionId;
    }

    public async Task StageChunkAsync(Guid sessionId, int chunkIndex, Stream chunkBody, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(chunkBody);

        AzureExtractorChunkSessionMetadata meta = await LoadMetadataAsync(sessionId, ct);

        meta.EnsureMatchesScope(_scopeProvider.GetCurrentScope());

        if (chunkIndex < 0 || chunkIndex >= meta.TotalChunks)

            throw new InvalidOperationException(
                $"Chunk index {chunkIndex} is out of range for this session (totalChunks={meta.TotalChunks}).");

        BlockBlobClient zipBlob = GetZipBlob(sessionId);

        await zipBlob.StageBlockAsync(
            ToBlockId(chunkIndex),
            chunkBody,
            cancellationToken: ct);
    }

    public async Task<(AzureExtractorChunkSessionMetadata Meta, byte[] Zip)> FinalizeAndReadAssemblyAsync(
        Guid sessionId,
        CancellationToken ct)
    {
        AzureExtractorChunkSessionMetadata meta = await LoadMetadataAsync(sessionId, ct);

        meta.EnsureMatchesScope(_scopeProvider.GetCurrentScope());

        BlockBlobClient zipBlob = GetZipBlob(sessionId);

        Response<BlockList> blocks = await zipBlob.GetBlockListAsync(
            BlockListTypes.Uncommitted,
            cancellationToken: ct);

        int uncommittedCount = blocks.Value.UncommittedBlocks.Count();

        if (uncommittedCount != meta.TotalChunks)

            throw new InvalidOperationException(
                $"Expected {meta.TotalChunks} staged blocks before finalize; found {uncommittedCount}.");

        List<string> orderedIds = new(meta.TotalChunks);

        for (int i = 0; i < meta.TotalChunks; i++)

            orderedIds.Add(ToBlockId(i));

        await zipBlob.CommitBlockListAsync(orderedIds, cancellationToken: ct);

        Response<BlobProperties> props = await zipBlob.GetPropertiesAsync(cancellationToken: ct);

        long length = props.Value.ContentLength;

        if (meta.DeclaredTotalBytes is long declared && declared != length)

            throw new InvalidOperationException(
                $"Assembled ZIP size {length} bytes does not match declared total {declared}.");

        if (length > _options.MaxAssembledZipBytes)

            throw new InvalidOperationException(
                $"Assembled ZIP exceeds configured maximum of {_options.MaxAssembledZipBytes} bytes.");

        Response<BlobDownloadResult> downloaded = await zipBlob.DownloadContentAsync(cancellationToken: ct);

        ReadOnlyMemory<byte> content = downloaded.Value.Content;

        if (content.Length != length)

            throw new InvalidOperationException("Downloaded blob content length mismatch.");

        return (meta, content.ToArray());
    }

    public async Task DeleteSessionAsync(Guid sessionId, CancellationToken ct)
    {
        BlobContainerClient container = GetContainer();

        BlobClient metaBlob = container.GetBlobClient(BuildMetaBlobPath(sessionId));

        BlobClient zipBlob = container.GetBlobClient(BuildZipBlobPath(sessionId));

        await metaBlob.DeleteIfExistsAsync(cancellationToken: ct);

        await zipBlob.DeleteIfExistsAsync(cancellationToken: ct);
    }

    private BlobContainerClient GetContainer()

        => _blobServiceClient.GetBlobContainerClient(_options.AzureContainerName.ToLowerInvariant());

    private BlockBlobClient GetZipBlob(Guid sessionId)

        => GetContainer().GetBlockBlobClient(BuildZipBlobPath(sessionId));

    private string BuildMetaBlobPath(Guid sessionId)

        => ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, $"sessions/{sessionId:D}/meta.json");

    private string BuildZipBlobPath(Guid sessionId)

        => ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, $"sessions/{sessionId:D}/zip.blob");

    private async Task<AzureExtractorChunkSessionMetadata> LoadMetadataAsync(Guid sessionId, CancellationToken ct)
    {
        BlobContainerClient container = GetContainer();

        BlobClient metaBlob = container.GetBlobClient(BuildMetaBlobPath(sessionId));

        if (!await metaBlob.ExistsAsync(cancellationToken: ct))

            throw new InvalidOperationException("Chunk upload session was not found or has expired.");

        Response<BlobDownloadResult> downloaded = await metaBlob.DownloadContentAsync(cancellationToken: ct);

        ReadOnlyMemory<byte> metaUtf8 = downloaded.Value.Content.ToMemory();

        AzureExtractorChunkSessionMetadata? meta =
            JsonSerializer.Deserialize<AzureExtractorChunkSessionMetadata>(metaUtf8.Span, SerializerOptions);

        if (meta is null)

            throw new InvalidOperationException("Chunk upload session metadata could not be read.");

        return meta;
    }

    private void ValidateDescriptorAgainstCaps(AzureExtractorChunkSessionDescriptor descriptor)
    {
        if (descriptor.DeclaredTotalBytes is long declared && declared > _options.MaxAssembledZipBytes)

            throw new InvalidOperationException(
                $"Declared ZIP size exceeds configured maximum of {_options.MaxAssembledZipBytes} bytes.");

        if (descriptor.TotalChunks > _options.MaxChunksPerSession)

            throw new InvalidOperationException(
                $"Total chunks {descriptor.TotalChunks} exceeds MaxChunksPerSession ({_options.MaxChunksPerSession}).");
    }

    internal static string ToBlockId(int chunkIndex)
    {
        if (chunkIndex < 0)

            throw new ArgumentOutOfRangeException(nameof(chunkIndex));

        Span<byte> bytes = stackalloc byte[8];

        BinaryPrimitives.WriteInt64BigEndian(bytes, chunkIndex);

        return Convert.ToBase64String(bytes);
    }
}
