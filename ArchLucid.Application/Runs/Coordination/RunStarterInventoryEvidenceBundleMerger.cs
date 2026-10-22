using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Coordination;

/// <summary>
///     Merges linked inventory extractor provenance into starter <see cref="EvidenceBundle" /> metadata (TB-2245).
/// </summary>
public static class RunStarterInventoryEvidenceBundleMerger
{
    /// <summary>
    ///     Applies Azure and/or AWS/GCP inventory package provenance when packages are linked to <paramref name="runId" />.
    /// </summary>
    /// <returns><see langword="true" /> when at least one inventory package was merged.</returns>
    public static async Task<bool> MergeLinkedInventoryPackagesAsync(
        EvidenceBundle evidenceBundle,
        ArchitectureRequest request,
        ScopeContext scope,
        Guid runId,
        IAzureExtractorPackageRepository azureExtractorPackageRepository,
        ICloudInventoryExtractorPackageRepository cloudInventoryExtractorPackageRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(azureExtractorPackageRepository);
        ArgumentNullException.ThrowIfNull(cloudInventoryExtractorPackageRepository);

        bool merged = false;

        if (request.CloudProvider is CloudProvider.Azure or CloudProvider.None)
        {
            AzureExtractorPackageProvenance? azureProvenance =
                await azureExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync(scope, runId, cancellationToken);

            if (azureProvenance is not null)
            {
                AzureExtractorEvidenceBundleMerger.Merge(evidenceBundle, azureProvenance);
                merged = true;
            }
        }

        if (request.CloudProvider is CloudProvider.Aws)
        {
            CloudInventoryExtractorPackageProvenance? awsProvenance =
                await cloudInventoryExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync(
                    scope,
                    runId,
                    CloudProvider.Aws,
                    cancellationToken);

            if (awsProvenance is not null)
            {
                CloudInventoryExtractorEvidenceBundleMerger.Merge(evidenceBundle, awsProvenance);
                merged = true;
            }
        }

        if (request.CloudProvider is CloudProvider.Gcp)
        {
            CloudInventoryExtractorPackageProvenance? gcpProvenance =
                await cloudInventoryExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync(
                    scope,
                    runId,
                    CloudProvider.Gcp,
                    cancellationToken);

            if (gcpProvenance is not null)
            {
                CloudInventoryExtractorEvidenceBundleMerger.Merge(evidenceBundle, gcpProvenance);
                merged = true;
            }
        }

        return merged;
    }
}
