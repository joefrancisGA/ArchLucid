using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Scoping;

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

        return await MapAsync(tenantId, rows, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Loads only tracking rows bound to the caller's previously authorized run.</summary>
    public async Task<IReadOnlyDictionary<string, RunFindingExternalTrackingProjection>> LoadForAuthorizedRunFindingsAsync(
        ScopeContext scope, Guid runId, IReadOnlyList<string> findingIds, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(findingIds);
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty ||
            scope.ProjectId == Guid.Empty || runId == Guid.Empty)
            throw new ArgumentException("Complete scope and run identity are required.");

        IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow> rows =
            await _readRepository.ListForAuthorizedRunFindingsAsync(
                scope, runId, findingIds, cancellationToken).ConfigureAwait(false);
        return await MapAsync(scope.TenantId, rows, cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyDictionary<string, RunFindingExternalTrackingProjection>> MapAsync(
        Guid tenantId, IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow> rows,
        CancellationToken cancellationToken)
    {
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
