using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

public interface IRunExportQueryFacade
{
    Task<RunExportHistoryQueryResult> GetRunExportHistoryAsync(string runId, CancellationToken cancellationToken = default);
    Task<ScopedExportRecordLoadResult> GetExportRecordAsync(string exportRecordId, CancellationToken cancellationToken = default);
    Task<ExportRecordDiffQueryResult> CompareExportRecordsAsync(string leftExportRecordId, string rightExportRecordId, CancellationToken cancellationToken = default);
    Task<ExportRecordDiffSummaryQueryResult> CompareExportRecordsSummaryAsync(string leftExportRecordId, string rightExportRecordId, bool persist, CancellationToken cancellationToken = default);
    Task<ExportReplayQueryResult> ReplayExportAsync(string exportRecordId, ReplayExportRequest request, CancellationToken cancellationToken = default);
}
