using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Copies review-board whitelabel hints from a prior export on the same run when the caller omits them
///     (demo seeds and consultant replay flows).
/// </summary>
public static class ConsultingDocxExportWhitelabelPrefill
{
    public static async Task ApplyMissingFromPriorExportsAsync(
        string runId,
        ConsultingDocxWhitelabelHints hints,
        IRunExportRecordRepository repository,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(hints);
        ArgumentNullException.ThrowIfNull(repository);

        if (!string.IsNullOrWhiteSpace(hints.FirmDisplayName))
        {
            return;
        }

        IReadOnlyList<RunExportRecord> records = await repository.GetByRunIdAsync(runId, cancellationToken);

        foreach (RunExportRecord record in records)
        {
            PersistedAnalysisExportRequest? prior = AnalysisExportRequestRehydrator.Rehydrate(record);
            string? firm = prior?.ReviewBoardWhitelabelFirmDisplayName?.Trim();

            if (string.IsNullOrWhiteSpace(firm))
            {
                continue;
            }

            hints.FirmDisplayName = firm;
            hints.ClientEngagementTitle ??= prior?.ReviewBoardWhitelabelClientEngagementTitle?.Trim();

            return;
        }
    }
}
