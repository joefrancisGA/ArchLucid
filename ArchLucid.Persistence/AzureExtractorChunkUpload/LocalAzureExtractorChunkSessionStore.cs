using System.Text.Json;

using ArchLucid.Core.Scoping;

using ArchLucid.Persistence.BlobStore;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.AzureExtractorChunkUpload;

/// <summary>Filesystem-backed staging for chunked extractor uploads (development and CI).</summary>
public sealed class LocalAzureExtractorChunkSessionStore(
    string stagingRootPath,
    IScopeContextProvider scopeProvider,
    IOptions<AzureExtractorChunkUploadOptions> chunkOptions) : IAzureExtractorChunkSessionStore
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly string _stagingRootPath =
        string.IsNullOrWhiteSpace(stagingRootPath)
            ? throw new ArgumentException("Staging root path is required.", nameof(stagingRootPath))
            : Path.GetFullPath(stagingRootPath);

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

        string sessionDir = GetSessionDirectory(sessionId);

        Directory.CreateDirectory(Path.Combine(sessionDir, "chunks"));

        await File.WriteAllTextAsync(
            Path.Combine(sessionDir, "meta.json"),
            JsonSerializer.Serialize(meta, SerializerOptions),
            ct);

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

        string partPath = GetChunkPartPath(sessionId, chunkIndex);

        await using FileStream file = new(partPath, FileMode.Create, FileAccess.Write, FileShare.None);

        await CopyStreamWithCapAsync(chunkBody, file, _options.MaxChunkUploadBytes, ct);
    }

    public async Task<(AzureExtractorChunkSessionMetadata Meta, byte[] Zip)> FinalizeAndReadAssemblyAsync(
        Guid sessionId,
        CancellationToken ct)
    {
        AzureExtractorChunkSessionMetadata meta = await LoadMetadataAsync(sessionId, ct);

        meta.EnsureMatchesScope(_scopeProvider.GetCurrentScope());

        string chunksDir = Path.Combine(GetSessionDirectory(sessionId), "chunks");

        using MemoryStream assembled = new();

        long totalLength = 0;

        for (int i = 0; i < meta.TotalChunks; i++)
        {
            string partPath = Path.Combine(chunksDir, ChunkFileName(i));

            if (!File.Exists(partPath))

                throw new InvalidOperationException($"Missing chunk index {i}; upload all chunks before completing.");

            byte[] bytes = await File.ReadAllBytesAsync(partPath, ct);

            totalLength += bytes.Length;

            if (totalLength > _options.MaxAssembledZipBytes)

                throw new InvalidOperationException(
                    $"Assembled ZIP exceeds configured maximum of {_options.MaxAssembledZipBytes} bytes.");

            await assembled.WriteAsync(bytes, ct);
        }

        if (meta.DeclaredTotalBytes is long declared && declared != totalLength)

            throw new InvalidOperationException(
                $"Assembled ZIP size {totalLength} bytes does not match declared total {declared}.");

        return (meta, assembled.ToArray());
    }

    public Task DeleteSessionAsync(Guid sessionId, CancellationToken ct)
    {
        string sessionDir = GetSessionDirectory(sessionId);

        if (Directory.Exists(sessionDir))

            Directory.Delete(sessionDir, recursive: true);

        return Task.CompletedTask;
    }

    private string GetSessionDirectory(Guid sessionId)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        string tenantSegment = scope.TenantId.ToString("D");

        ArtifactBlobTenantPaths.ThrowIfBlobRelativePathUnsafe(tenantSegment);

        ArtifactBlobTenantPaths.ThrowIfBlobRelativePathUnsafe(sessionId.ToString("D"));

        return Path.Combine(_stagingRootPath, tenantSegment, "sessions", sessionId.ToString("D"));
    }

    private static string ChunkFileName(int chunkIndex) => $"{chunkIndex:D8}.part";

    private string GetChunkPartPath(Guid sessionId, int chunkIndex)

        => Path.Combine(GetSessionDirectory(sessionId), "chunks", ChunkFileName(chunkIndex));

    private async Task<AzureExtractorChunkSessionMetadata> LoadMetadataAsync(Guid sessionId, CancellationToken ct)
    {
        string path = Path.Combine(GetSessionDirectory(sessionId), "meta.json");

        if (!File.Exists(path))

            throw new InvalidOperationException("Chunk upload session was not found or has expired.");

        string json = await File.ReadAllTextAsync(path, ct);

        AzureExtractorChunkSessionMetadata? meta =
            JsonSerializer.Deserialize<AzureExtractorChunkSessionMetadata>(json, SerializerOptions);

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

    private static async Task CopyStreamWithCapAsync(Stream source, Stream destination, long maxBytes, CancellationToken ct)
    {
        byte[] buffer = new byte[8192];

        long total = 0;

        while (true)
        {
            int read = await source.ReadAsync(buffer.AsMemory(0, buffer.Length), ct);

            if (read == 0)

                break;

            total += read;

            if (total > maxBytes)

                throw new InvalidOperationException($"Chunk exceeds maximum of {maxBytes} bytes.");

            await destination.WriteAsync(buffer.AsMemory(0, read), ct);
        }
    }
}
