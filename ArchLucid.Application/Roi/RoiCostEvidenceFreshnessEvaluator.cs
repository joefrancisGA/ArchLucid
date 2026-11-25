using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Roi;

/// <summary>Evaluates uploaded Azure/AWS/GCP extractor cost evidence freshness for sponsor ROI labeling.</summary>
public sealed class RoiCostEvidenceFreshnessEvaluator(
    IAzureExtractorPackageRepository azureExtractorPackageRepository,
    ICloudInventoryExtractorPackageRepository cloudInventoryExtractorPackageRepository,
    IScopeContextProvider scopeContextProvider,
    TimeProvider clock,
    IOptions<RoiCostEvidenceFreshnessOptions> options)
{
    private readonly IAzureExtractorPackageRepository _azureExtractorPackageRepository =
        azureExtractorPackageRepository ?? throw new ArgumentNullException(nameof(azureExtractorPackageRepository));

    private readonly ICloudInventoryExtractorPackageRepository _cloudInventoryExtractorPackageRepository =
        cloudInventoryExtractorPackageRepository
        ?? throw new ArgumentNullException(nameof(cloudInventoryExtractorPackageRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly RoiCostEvidenceFreshnessOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    public async Task<RoiCostEvidenceFreshnessSnapshot> EvaluateAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime? azureCollectionUtc = await _azureExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        DateTime? awsCollectionUtc = await _cloudInventoryExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Aws, cancellationToken)
            .ConfigureAwait(false);

        DateTime? gcpCollectionUtc = await _cloudInventoryExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Gcp, cancellationToken)
            .ConfigureAwait(false);

        DateTime utcNow = _clock.GetUtcNow().UtcDateTime;
        DateTime? collectionUtc = LatestAtOrBeforeUtc(utcNow, azureCollectionUtc, awsCollectionUtc, gcpCollectionUtc);
        int staleAfterDays = _options.StaleAfterDays <= 0 ? 90 : _options.StaleAfterDays;

        string status = collectionUtc is null
            ? RoiCostEvidenceFreshness.Missing
            : (utcNow - collectionUtc.Value).TotalDays > staleAfterDays
                ? RoiCostEvidenceFreshness.Stale
                : RoiCostEvidenceFreshness.Fresh;

        return new RoiCostEvidenceFreshnessSnapshot
        {
            Status = status,
            LatestCollectionTimestampUtc = collectionUtc,
            StaleAfterDays = staleAfterDays,
        };
    }

    private static DateTime? LatestAtOrBeforeUtc(DateTime utcNow, params DateTime?[] timestamps)
    {
        DateTime? latest = null;

        foreach (DateTime? timestamp in timestamps)
        {
            if (timestamp is null)
                continue;

            DateTime normalizedUtc = RoiCostEvidenceUtcNormalizer.Normalize(timestamp.Value);

            if (normalizedUtc <= utcNow && (latest is null || normalizedUtc > latest.Value))
                latest = normalizedUtc;
        }

        return latest;
    }
}
