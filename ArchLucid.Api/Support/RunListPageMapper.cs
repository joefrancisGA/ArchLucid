using ArchLucid.Api.Models;
using ArchLucid.Application.Http;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Pagination;

namespace ArchLucid.Api.Support;

/// <summary>
///     Maps run summary pages (offset or keyset) to the cursor-paged list contract and derives the page ETag.
/// </summary>
public static class RunListPageMapper
{
    /// <summary>
    ///     Derives a strong ETag from the visible rows, request shape and continuation metadata.
    /// </summary>
    public static string BuildEtag(
        IReadOnlyList<RunSummary> summaries,
        string requestFingerprint,
        bool hasMore,
        string? nextCursor)
    {
        ArgumentNullException.ThrowIfNull(summaries);
        ArgumentException.ThrowIfNullOrWhiteSpace(requestFingerprint);

        RunSummaryRowVersionSlice[] slices = summaries
            .Select(static summary => new RunSummaryRowVersionSlice(ParseRunId(summary.RunId), summary.RowVersion))
            .ToArray();

        string pageFingerprint = $"more={hasMore}|next={nextCursor}|{requestFingerprint}";
        return ConditionalGetNegotiation.ComputeRunListEtag(slices, pageFingerprint);
    }

    /// <summary>Projects run summaries into the wire contract, preserving keyset continuation metadata.</summary>
    public static CursorPagedResponse<RunListItemResponse> MapPage(
        IReadOnlyList<RunSummary> summaries,
        bool hasMore,
        string? nextCursor,
        int requestedTake)
    {
        ArgumentNullException.ThrowIfNull(summaries);

        List<RunListItemResponse> mapped = summaries
            .Select(static summary => new RunListItemResponse
            {
                RunId = summary.RunId,
                RequestId = summary.RequestId,
                Status = summary.Status,
                CreatedUtc = summary.CreatedUtc,
                CompletedUtc = summary.CompletedUtc,
                CurrentManifestVersion = summary.CurrentManifestVersion,
                SystemName = summary.SystemName,
                PackageOrigin = summary.PackageOrigin,
                GoldenManifestId = summary.GoldenManifestId,
                HasGoldenManifest = summary.GoldenManifestId.HasValue,
                AuthorityLifecyclePhase = summary.AuthorityLifecyclePhase
            })
            .ToList();

        return new CursorPagedResponse<RunListItemResponse>
        {
            Items = mapped,
            NextCursor = nextCursor,
            HasMore = hasMore,
            RequestedTake = requestedTake
        };
    }

    // Persisted run ids arrive in compact ("N") form from the query service but hyphenated ids remain valid inputs.
    private static Guid ParseRunId(string runId)
    {
        return Guid.TryParseExact(runId, "N", out Guid compact) ? compact : Guid.Parse(runId);
    }
}
