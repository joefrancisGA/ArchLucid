using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Default <see cref="IComparisonsApplicationService"/> consolidating comparison route orchestration previously in
///     <c>ComparisonsController</c>.
/// </summary>
public sealed partial class ComparisonsApplicationService(
    IRunDetailQueryService runDetailQueryService,
    IRunExportRecordRepository runExportRecordRepository,
    IComparisonRecordRepository comparisonRecordRepository,
    IComparisonReplayService comparisonReplayService,
    ICompareRunsApplicationFacade compareRunsFacade,
    IComparisonReplayCostEstimator comparisonReplayCostEstimator,
    IDriftReportFormatter driftReportFormatter,
    DriftReportDocxExport driftReportDocxExport) : IComparisonsApplicationService
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly ICompareRunsApplicationFacade _compareRunsFacade =
        compareRunsFacade ?? throw new ArgumentNullException(nameof(compareRunsFacade));

    private readonly IRunExportRecordRepository _runExportRecordRepository =
        runExportRecordRepository ?? throw new ArgumentNullException(nameof(runExportRecordRepository));

    private readonly IComparisonRecordRepository _comparisonRecordRepository =
        comparisonRecordRepository ?? throw new ArgumentNullException(nameof(comparisonRecordRepository));

    private readonly IComparisonReplayService _comparisonReplayService =
        comparisonReplayService ?? throw new ArgumentNullException(nameof(comparisonReplayService));

    private readonly IComparisonReplayCostEstimator _comparisonReplayCostEstimator =
        comparisonReplayCostEstimator ?? throw new ArgumentNullException(nameof(comparisonReplayCostEstimator));

    private readonly IDriftReportFormatter _driftReportFormatter =
        driftReportFormatter ?? throw new ArgumentNullException(nameof(driftReportFormatter));

    private readonly DriftReportDocxExport _driftReportDocxExport =
        driftReportDocxExport ?? throw new ArgumentNullException(nameof(driftReportDocxExport));

    /// <inheritdoc />
    public async Task<IReadOnlyList<ComparisonRecord>?> TryListByRunIdAsync(string runId, CancellationToken ct)
    {
        string lookupRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);

        if (await _runDetailQueryService.GetRunDetailAsync(lookupRunId, ct) is null)
            return null;

        IReadOnlyList<ComparisonRecord> records =
            await AnalysisRunIdCanonicalization.LoadComparisonRecordsByRunIdAsync(
                _comparisonRecordRepository,
                lookupRunId,
                ct).ConfigureAwait(false);
        ComparisonRecordScopedReadNormalizer.NormalizeListInPlace(records);
        return records;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ComparisonRecord>?> TryListByExportRecordIdAsync(
        string exportRecordId,
        CancellationToken ct)
    {
        string normalizedExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
        if (await LoadScopedExportRecordAsync(normalizedExportRecordId, ct) is null)
            return null;

        IReadOnlyList<ComparisonRecord> records =
            await _comparisonRecordRepository.GetByExportRecordIdAsync(normalizedExportRecordId, ct);
        ComparisonRecordScopedReadNormalizer.NormalizeListInPlace(records);
        return records;
    }

    /// <inheritdoc />
    public Task<ComparisonRecord?> TryGetScopedRecordAsync(string comparisonRecordId, CancellationToken ct) =>
        LoadScopedComparisonRecordAsync(comparisonRecordId, ct);

    /// <inheritdoc />
    public async Task<ComparisonRecord?> TryGetScopedRecordForArtifactReadAsync(string comparisonRecordId, CancellationToken ct)
    {
        ComparisonRecord? record = await LoadScopedComparisonRecordAsync(comparisonRecordId, ct);

        if (record is null)
            return null;

        await _comparisonReplayService.EnsureArtifactReplayAccessAllowedAsync(record, ct);
        return record;
    }

    /// <inheritdoc />
    public async Task<ComparisonHistorySearchResult> SearchAsync(
        ComparisonHistorySearchCriteria criteria,
        CancellationToken ct)
    {
        string? normalizedType =
            ComparisonRecordScopedReadNormalizer.CanonicalizeComparisonTypeSearchFilter(criteria.ComparisonType);

        string? normalizedLabel = string.IsNullOrWhiteSpace(criteria.Label)
            ? null
            : criteria.Label.Trim();

        List<string> normalizedTags = NormalizeSearchTags(criteria.Tags);

        string? normalizedCursorId = NormalizeComparisonRecordIdFilterOrNull(criteria.CursorId);

        int limit = criteria.Limit <= 0 ? Core.Pagination.PaginationDefaults.DefaultPageSize : criteria.Limit;
        string? leftRunIdFilter = AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull(criteria.LeftRunId);
        string? rightRunIdFilter = AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull(criteria.RightRunId);
        string? leftExportRecordIdFilter = NormalizeExportRecordIdFilterOrNull(criteria.LeftExportRecordId);
        string? rightExportRecordIdFilter = NormalizeExportRecordIdFilterOrNull(criteria.RightExportRecordId);

        string sortBy = string.IsNullOrWhiteSpace(criteria.SortBy) ? "createdUtc" : criteria.SortBy.Trim();
        string sortDir = string.IsNullOrWhiteSpace(criteria.SortDir) ? "desc" : criteria.SortDir.Trim();

        IReadOnlyList<ComparisonRecord> records;

        if (criteria.UseCursorPaging)
        {
            records = await _comparisonRecordRepository.SearchByCursorAsync(
                normalizedType,
                leftRunIdFilter,
                rightRunIdFilter,
                criteria.CreatedFromUtc,
                criteria.CreatedToUtc,
                leftExportRecordIdFilter,
                rightExportRecordIdFilter,
                normalizedLabel,
                normalizedTags,
                sortBy,
                sortDir,
                criteria.CursorCreatedUtc,
                normalizedCursorId,
                limit,
                ct);
        }
        else
        {
            records = await _comparisonRecordRepository.SearchAsync(
                normalizedType,
                leftRunIdFilter,
                rightRunIdFilter,
                criteria.CreatedFromUtc,
                criteria.CreatedToUtc,
                leftExportRecordIdFilter,
                rightExportRecordIdFilter,
                normalizedLabel,
                normalizedTags,
                sortBy,
                sortDir,
                criteria.Skip,
                limit,
                ct);
        }

        ComparisonRecordScopedReadNormalizer.NormalizeListInPlace(records);

        string? nextCursor =
            records.Count > 0 && string.Equals(sortBy, "createdUtc", StringComparison.OrdinalIgnoreCase)
                ? $"{records[^1].CreatedUtc.Ticks}:{records[^1].ComparisonRecordId}"
                : null;

        return new ComparisonHistorySearchResult
        {
            Records = records,
            Limit = limit,
            Skip = criteria.Skip,
            NextCursor = nextCursor,
        };
    }

    /// <inheritdoc />
    public async Task<ComparisonRecord?> TryUpdateLabelAndTagsAsync(
        string comparisonRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        CancellationToken ct)
    {
        string normalizedComparisonRecordId =
            ComparisonRecordIdNormalizer.NormalizeRequired(comparisonRecordId);

        if (await LoadScopedComparisonRecordAsync(normalizedComparisonRecordId, ct) is null)
            return null;

        string? normalizedLabel = NormalizeLabelForPersistOrNull(label);
        IReadOnlyList<string>? normalizedTags = tags is null ? null : NormalizeSearchTags(tags);
        if (normalizedTags is { Count: > 0 })
        {
            List<string> tagList = [.. normalizedTags];
            ComparisonPersistedStringListNormalizer.NormalizeInPlace(tagList);
            normalizedTags = tagList;
        }

        bool updated = await _comparisonRecordRepository.UpdateLabelAndTagsAsync(
            normalizedComparisonRecordId,
            normalizedLabel,
            normalizedTags,
            ct);

        if (!updated)
            return null;

        return await LoadScopedComparisonRecordAsync(normalizedComparisonRecordId, ct);
    }

    private async Task<RunExportRecord?> LoadScopedExportRecordAsync(
        string exportRecordId,
        CancellationToken cancellationToken)
    {
        string normalizedExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
        RunExportRecord? export = await _runExportRecordRepository.GetByIdAsync(normalizedExportRecordId, cancellationToken);

        if (export is null)
            return null;

        string lookupRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(export.RunId);
        if (await _runDetailQueryService.GetRunDetailAsync(lookupRunId, cancellationToken) is null)
            return null;

        RunExportRecordScopedReadNormalizer.NormalizeInPlace(export);
        return export;
    }

    private async Task<ComparisonRecord?> LoadScopedComparisonRecordAsync(
        string comparisonRecordId,
        CancellationToken cancellationToken)
    {
        string normalizedComparisonRecordId =
            ComparisonRecordIdNormalizer.NormalizeRequired(comparisonRecordId);

        ComparisonRecord? record =
            await _comparisonRecordRepository.GetByIdAsync(normalizedComparisonRecordId, cancellationToken);

        if (record is null)
            return null;

        if (!await IsComparisonRecordInScopeAsync(record, cancellationToken))
            return null;

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);
        return record;
    }

    private async Task<bool> IsComparisonRecordInScopeAsync(
        ComparisonRecord record,
        CancellationToken cancellationToken)
    {
        string? leftRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull(record.LeftRunId);
        if (leftRunId is not null
            && await _runDetailQueryService.GetRunDetailAsync(leftRunId, cancellationToken) is not null)
        {
            return true;
        }

        string? rightRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull(record.RightRunId);
        if (rightRunId is not null
            && await _runDetailQueryService.GetRunDetailAsync(rightRunId, cancellationToken) is not null)
        {
            return true;
        }

        string? leftExportRecordId = NormalizeExportRecordIdFilterOrNull(record.LeftExportRecordId);
        if (leftExportRecordId is not null
            && await LoadScopedExportRecordAsync(leftExportRecordId, cancellationToken) is not null)
        {
            return true;
        }

        string? rightExportRecordId = NormalizeExportRecordIdFilterOrNull(record.RightExportRecordId);
        if (rightExportRecordId is not null
            && await LoadScopedExportRecordAsync(rightExportRecordId, cancellationToken) is not null)
        {
            return true;
        }

        return false;
    }

    private static string? NormalizeExportRecordIdFilterOrNull(string? exportRecordId) =>
        string.IsNullOrWhiteSpace(exportRecordId)
            ? null
            : RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);

    private static string? NormalizeLabelForPersistOrNull(string? label) =>
        label is null ? null : string.IsNullOrWhiteSpace(label) ? null : label.Trim();

    private static string? NormalizeComparisonRecordIdFilterOrNull(string? comparisonRecordId) =>
        string.IsNullOrWhiteSpace(comparisonRecordId)
            ? null
            : ComparisonRecordIdNormalizer.NormalizeRequired(comparisonRecordId);

    private static List<string> NormalizeSearchTags(IReadOnlyList<string> tags)
    {
        if (tags is not { Count: > 0 })
            return [];

        List<string> normalized = [];
        foreach (string tag in tags)
        {
            if (string.IsNullOrWhiteSpace(tag))
                continue;

            normalized.Add(tag.Trim());
        }

        return normalized;
    }
}
