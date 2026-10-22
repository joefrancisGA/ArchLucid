namespace ArchLucid.Application.SecureNow;

public sealed class EmptyCollectionRunArtifactReader : ICollectionRunArtifactReader
{
    public Task<IReadOnlyList<CollectionRunManifest>> ListManifestsAsync(
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<CollectionRunManifest>>([]);

    public Task<CollectionRunArtifact?> ReadArtifactAsync(
        CollectionRunManifest manifest,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<CollectionRunArtifact?>(null);
}
