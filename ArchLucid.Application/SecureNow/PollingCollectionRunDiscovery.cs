using Azure;

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
        IReadOnlyList<CollectionRunManifest> manifests;

        try
        {
            manifests = await _artifactReader.ListManifestsAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return 0;
        }

        int imported = 0;

        foreach (CollectionRunManifest manifest in manifests)
        {
            CollectionRunArtifact? artifact;

            try
            {
                artifact = await _artifactReader.ReadArtifactAsync(manifest, cancellationToken);
            }
            catch (RequestFailedException)
            {
                continue;
            }

            if (artifact is null)
                continue;

            try
            {
                await _ingestService.IngestAsync(artifact, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception)
            {
                continue;
            }

            imported++;
        }

        return imported;
    }
}
