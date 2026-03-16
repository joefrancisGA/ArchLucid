using ArchiForge.Contracts.Metadata;

namespace ArchiForge.Application.Analysis;

public interface IComparisonAuditService
{
    Task<string> RecordEndToEndAsync(
        EndToEndReplayComparisonReport report,
        string summaryMarkdown,
        CancellationToken cancellationToken = default);

    Task<string> RecordExportDiffAsync(
        ExportRecordDiffResult diff,
        string summaryMarkdown,
        CancellationToken cancellationToken = default);

    /// <summary>Persist a replay of an existing comparison record as a new record (same payload, new id and timestamp).</summary>
    Task<string> RecordReplayOfAsync(
        ComparisonRecord sourceRecord,
        string? notes = null,
        CancellationToken cancellationToken = default);
}

