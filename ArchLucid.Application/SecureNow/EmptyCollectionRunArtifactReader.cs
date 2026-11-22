namespace ArchLucid.Application.SecureNow;

public sealed class EmptyCollectionRunArtifactReader : ICollectionRunArtifactReader
{
    public Task<IReadOnlyList<CollectionRunManifest>> ListManifestsAsync(
        CancellationToken cancellationToken = default) =>
        cancellationToken.IsCancellationRequested
            ? Task.FromCanceled<IReadOnlyList<CollectionRunManifest>>(cancellationToken)
            : Task.FromResult<IReadOnlyList<CollectionRunManifest>>([]);

    public Task<CollectionRunArtifact?> ReadArtifactAsync(
        CollectionRunManifest manifest,
        CancellationToken cancellationToken = default) =>
        cancellationToken.IsCancellationRequested
            ? Task.FromCanceled<CollectionRunArtifact?>(cancellationToken)
            : Task.FromResult<CollectionRunArtifact?>(null);
}
