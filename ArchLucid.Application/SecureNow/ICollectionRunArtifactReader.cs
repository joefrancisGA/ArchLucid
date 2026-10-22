namespace ArchLucid.Application.SecureNow;

public interface ICollectionRunArtifactReader
{
    Task<IReadOnlyList<CollectionRunManifest>> ListManifestsAsync(
        CancellationToken cancellationToken = default);

    Task<CollectionRunArtifact?> ReadArtifactAsync(
        CollectionRunManifest manifest,
        CancellationToken cancellationToken = default);
}
