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

        runId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);

        if (!string.IsNullOrWhiteSpace(hints.FirmDisplayName))
        {
            return;
        }

        IReadOnlyList<RunExportRecord> records =
            await AnalysisRunIdCanonicalization.LoadRunExportRecordsByRunIdAsync(
                repository,
                runId,
                cancellationToken).ConfigureAwait(false);

        foreach (RunExportRecord record in records)
        {
            PersistedAnalysisExportRequest? prior = AnalysisExportRequestRehydrator.Rehydrate(record);

            if (prior is null || string.IsNullOrWhiteSpace(prior.ReviewBoardWhitelabelFirmDisplayName))
            {
                continue;
            }

            hints.FirmDisplayName = prior.ReviewBoardWhitelabelFirmDisplayName;

            if (string.IsNullOrWhiteSpace(hints.ClientEngagementTitle))
            {
                hints.ClientEngagementTitle = prior.ReviewBoardWhitelabelClientEngagementTitle;
            }

            return;
        }
    }
}
