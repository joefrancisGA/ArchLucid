using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>Maps batch ITSM + disposition SQL rows into API/export projections (TB-386).</summary>
public sealed class RunFindingExternalTrackingEnrichmentService(
    IRunFindingExternalTrackingReadRepository readRepository,
    ItsmExternalTicketUrlBuilder urlBuilder)
{
    private readonly IRunFindingExternalTrackingReadRepository _readRepository =
        readRepository ?? throw new ArgumentNullException(nameof(readRepository));

    private readonly ItsmExternalTicketUrlBuilder _urlBuilder =
        urlBuilder ?? throw new ArgumentNullException(nameof(urlBuilder));

    public async Task<IReadOnlyDictionary<string, RunFindingExternalTrackingProjection>> LoadForFindingsAsync(
        Guid tenantId,
        Guid? findingsSnapshotId,
        IReadOnlyList<string> findingIds,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        ArgumentNullException.ThrowIfNull(findingIds);

        IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow> rows =
            await _readRepository.ListForFindingsAsync(
                tenantId,
                findingsSnapshotId,
                findingIds,
                cancellationToken).ConfigureAwait(false);

        Dictionary<string, RunFindingExternalTrackingProjection> result =
            new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, RunFindingExternalTrackingReadRow> entry in rows)
        {
            RunFindingExternalTrackingReadRow row = entry.Value;

            result[entry.Key] = new RunFindingExternalTrackingProjection
            {
                HumanReviewStatus = RunFindingExternalTrackingFieldMapper.ParseHumanReview(row.HumanReviewStatus),
                LatestDisposition = RunFindingExternalTrackingFieldMapper.ParseDisposition(row.Disposition),
                RevisitDueUtc = RunFindingExternalTrackingFieldMapper.ToUtcOffset(row.RevisitDueUtc),
                Provider = row.Provider,
                ExternalKey = row.ExternalKey,
                ExternalUrl = await _urlBuilder.TryBuildBrowseUrlAsync(
                    tenantId,
                    row.Provider ?? string.Empty,
                    row.ExternalKey ?? string.Empty,
                    row.ExternalSysId,
                    cancellationToken).ConfigureAwait(false),
                ItsmLinkedTicketsSummary = row.ItsmLinkedTicketsSummary,
                TrackedExternally = RunFindingExternalTrackingDerivedFields.IsTrackedExternally(row),
                ExternalTrackingSummary = RunFindingExternalTrackingDerivedFields.ResolveExternalTrackingSummary(row)
            };
        }

        return result;
    }
}
