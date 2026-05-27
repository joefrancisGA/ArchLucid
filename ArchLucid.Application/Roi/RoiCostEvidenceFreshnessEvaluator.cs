using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Roi;

/// <summary>Evaluates uploaded Azure extractor cost evidence freshness for executive ROI labeling.</summary>
public sealed class RoiCostEvidenceFreshnessEvaluator(
    IAzureExtractorPackageRepository azureExtractorPackageRepository,
    IScopeContextProvider scopeContextProvider,
    TimeProvider clock,
    IOptions<RoiCostEvidenceFreshnessOptions> options)
{
    private readonly IAzureExtractorPackageRepository _azureExtractorPackageRepository =
        azureExtractorPackageRepository ?? throw new ArgumentNullException(nameof(azureExtractorPackageRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly RoiCostEvidenceFreshnessOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    public async Task<RoiCostEvidenceFreshnessSnapshot> EvaluateAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime? collectionUtc = await _azureExtractorPackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, cancellationToken)
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
}
