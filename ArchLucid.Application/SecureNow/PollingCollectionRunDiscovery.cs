namespace ArchLucid.Application.SecureNow;

public sealed class PollingCollectionRunDiscovery(
    ICollectionRunArtifactReader artifactReader,
    CollectionRunIngestService ingestService) : ICollectionRunDiscovery
{
    private readonly ICollectionRunArtifactReader _artifactReader =
        artifactReader ?? throw new ArgumentNullException(nameof(artifactReader));

    private readonly CollectionRunIngestService _ingestService =
        ingestService ?? throw new ArgumentNullException(nameof(ingestService));

    public async Task<int> DiscoverAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<CollectionRunManifest> manifests =
            await _artifactReader.ListManifestsAsync(cancellationToken);
        int imported = 0;

        foreach (CollectionRunManifest manifest in manifests)
        {
            CollectionRunArtifact? artifact =
                await _artifactReader.ReadArtifactAsync(manifest, cancellationToken);
            if (artifact is null)
                continue;

            await _ingestService.IngestAsync(artifact, cancellationToken);
            imported++;
        }

        return imported;
    }
}
