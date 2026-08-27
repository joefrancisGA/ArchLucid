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
    IComparisonReplayCostEstimator comparisonReplayCostEstimator,
    IDriftReportFormatter driftReportFormatter,
    DriftReportDocxExport driftReportDocxExport) : IComparisonsApplicationService
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

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
        if (await _runDetailQueryService.GetRunDetailAsync(runId, ct) is null)
            return null;

        return await _comparisonRecordRepository.GetByRunIdAsync(runId, ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ComparisonRecord>?> TryListByExportRecordIdAsync(
        string exportRecordId,
        CancellationToken ct)
    {
        if (await LoadScopedExportRecordAsync(exportRecordId, ct) is null)
            return null;

        return await _comparisonRecordRepository.GetByExportRecordIdAsync(exportRecordId, ct);
    }

    /// <inheritdoc />
    public Task<ComparisonRecord?> TryGetScopedRecordAsync(string comparisonRecordId, CancellationToken ct) =>
        LoadScopedComparisonRecordAsync(comparisonRecordId, ct);

    /// <inheritdoc />
    public async Task<ComparisonHistorySearchResult> SearchAsync(
        ComparisonHistorySearchCriteria criteria,
        CancellationToken ct)
    {
        string? normalizedType = string.IsNullOrWhiteSpace(criteria.ComparisonType)
            ? null
            : criteria.ComparisonType.Trim();

        int limit = criteria.Limit <= 0 ? Core.Pagination.PaginationDefaults.DefaultPageSize : criteria.Limit;

        IReadOnlyList<ComparisonRecord> records;

        if (criteria.UseCursorPaging)
        {
            records = await _comparisonRecordRepository.SearchByCursorAsync(
                normalizedType,
                criteria.LeftRunId,
                criteria.RightRunId,
                criteria.CreatedFromUtc,
                criteria.CreatedToUtc,
                criteria.LeftExportRecordId,
                criteria.RightExportRecordId,
                criteria.Label,
                criteria.Tags.ToList(),
                criteria.SortBy,
                criteria.SortDir,
                criteria.CursorCreatedUtc,
                criteria.CursorId,
                limit,
                ct);
        }
        else
        {
            records = await _comparisonRecordRepository.SearchAsync(
                normalizedType,
                criteria.LeftRunId,
                criteria.RightRunId,
                criteria.CreatedFromUtc,
                criteria.CreatedToUtc,
                criteria.LeftExportRecordId,
                criteria.RightExportRecordId,
                criteria.Label,
                criteria.Tags.ToList(),
                criteria.SortBy,
                criteria.SortDir,
                criteria.Skip,
                limit,
                ct);
        }

        string? nextCursor =
            records.Count > 0 && string.Equals(criteria.SortBy, "createdUtc", StringComparison.OrdinalIgnoreCase)
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
        if (await LoadScopedComparisonRecordAsync(comparisonRecordId, ct) is null)
            return null;

        bool updated = await _comparisonRecordRepository.UpdateLabelAndTagsAsync(
            comparisonRecordId,
            label,
            tags,
            ct);

        if (!updated)
            return null;

        return await LoadScopedComparisonRecordAsync(comparisonRecordId, ct);
    }

    private async Task<RunExportRecord?> LoadScopedExportRecordAsync(
        string exportRecordId,
        CancellationToken cancellationToken)
    {
        RunExportRecord? export = await _runExportRecordRepository.GetByIdAsync(exportRecordId, cancellationToken);

        if (export is null)
            return null;

        if (await _runDetailQueryService.GetRunDetailAsync(export.RunId, cancellationToken) is null)
            return null;

        return export;
    }

    private async Task<ComparisonRecord?> LoadScopedComparisonRecordAsync(
        string comparisonRecordId,
        CancellationToken cancellationToken)
    {
        ComparisonRecord? record =
            await _comparisonRecordRepository.GetByIdAsync(comparisonRecordId, cancellationToken);

        if (record is null)
            return null;

        if (!await IsComparisonRecordInScopeAsync(record, cancellationToken))
            return null;

        return record;
    }

    private async Task<bool> IsComparisonRecordInScopeAsync(
        ComparisonRecord record,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(record.LeftRunId)
            && await _runDetailQueryService.GetRunDetailAsync(record.LeftRunId, cancellationToken) is not null)
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(record.RightRunId)
            && await _runDetailQueryService.GetRunDetailAsync(record.RightRunId, cancellationToken) is not null)
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(record.LeftExportRecordId)
            && await LoadScopedExportRecordAsync(record.LeftExportRecordId, cancellationToken) is not null)
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(record.RightExportRecordId)
            && await LoadScopedExportRecordAsync(record.RightExportRecordId, cancellationToken) is not null)
        {
            return true;
        }

        return false;
    }
}
