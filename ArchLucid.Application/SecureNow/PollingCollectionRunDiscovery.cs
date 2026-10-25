using ArchLucid.Core.SecureNow;

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
        HashSet<Guid> importedRunIdsThisBatch = new();

        foreach (CollectionRunManifest manifest in manifests)
        {
            if (importedRunIdsThisBatch.Contains(manifest.RunId))
                continue;

            CollectionRunArtifact? artifact;

            try
            {
                artifact = await _artifactReader.ReadArtifactAsync(manifest, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception)
            {
                continue;
            }

            if (artifact is null || artifact.ZipBytes.Length == 0)
                continue;

            try
            {
                CollectionRun run = await _ingestService.IngestAsync(artifact, cancellationToken);

                if (run.Status == CollectionRunStatus.Imported)
                {
                    imported++;
                    importedRunIdsThisBatch.Add(manifest.RunId);
                }
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception)
            {
                continue;
            }
        }

        return imported;
    }
}
