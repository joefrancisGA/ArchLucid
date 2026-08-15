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
        DateTime? collectionUtc = await ResolveLatestCollectionTimestampUtcAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        int staleAfterDays = _options.StaleAfterDays <= 0 ? 90 : _options.StaleAfterDays;

        if (collectionUtc is null)
        {
            return new RoiCostEvidenceFreshnessSnapshot
            {
                Status = RoiCostEvidenceFreshness.Missing,
                LatestCollectionTimestampUtc = null,
                StaleAfterDays = staleAfterDays,
            };
        }

        DateTime normalizedUtc = collectionUtc.Value.Kind == DateTimeKind.Utc
            ? collectionUtc.Value
            : collectionUtc.Value.ToUniversalTime();

        double ageDays = (_clock.GetUtcNow().UtcDateTime - normalizedUtc).TotalDays;
        string status = ageDays > staleAfterDays ? RoiCostEvidenceFreshness.Stale : RoiCostEvidenceFreshness.Fresh;

        return new RoiCostEvidenceFreshnessSnapshot
        {
            Status = status,
            LatestCollectionTimestampUtc = normalizedUtc,
            StaleAfterDays = staleAfterDays,
        };
    }

    private async Task<DateTime?> ResolveLatestCollectionTimestampUtcAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        DateTime? azureCollectionUtc = await _azureExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        DateTime? awsCollectionUtc = await _cloudInventoryExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Aws, cancellationToken)
            .ConfigureAwait(false);

        DateTime? gcpCollectionUtc = await _cloudInventoryExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Gcp, cancellationToken)
            .ConfigureAwait(false);

        return MaxUtc(azureCollectionUtc, awsCollectionUtc, gcpCollectionUtc);
    }

    private static DateTime? MaxUtc(params DateTime?[] timestamps)
    {
        DateTime? latest = null;

        foreach (DateTime? timestamp in timestamps)
        {
            if (timestamp is null)
                continue;

            DateTime normalizedUtc = timestamp.Value.Kind == DateTimeKind.Utc
                ? timestamp.Value
                : timestamp.Value.ToUniversalTime();

            if (latest is null || normalizedUtc > latest.Value)
                latest = normalizedUtc;
        }

        return latest;
    }
}
