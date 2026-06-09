using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports;

/// <summary>Builds <see cref="DecisionReceiptDocument" /> payloads for draft and run export surfaces.</summary>
public static class DecisionReceiptComposer
{
    public static bool IsExportableVerdict(FeasibilityVerdictKind kind) =>
        kind is FeasibilityVerdictKind.SoftInfeasible or FeasibilityVerdictKind.HardInfeasible;

    public static DecisionReceiptDocument BuildForDraft(DraftRequestResponse draft, FeasibilityVerdict verdict)
    {
        ArgumentNullException.ThrowIfNull(draft);
        ArgumentNullException.ThrowIfNull(verdict);

        return new DecisionReceiptDocument
        {
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            Source = DecisionReceiptSource.DraftAdmission,
            DraftId = draft.DraftId,
            RedirectReason = draft.RedirectReason,
            Intake = BuildIntakeContext(draft.Document),
            Verdict = verdict,
            CostStory = BuildCostStory(),
        };
    }

    public static DecisionReceiptDocument BuildForRun(Guid runId, FeasibilityVerdict verdict)
    {
        ArgumentNullException.ThrowIfNull(verdict);

        return new DecisionReceiptDocument
        {
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            Source = DecisionReceiptSource.CommittedRun,
            RunId = runId,
            Verdict = verdict,
            CostStory = BuildCostStory(),
        };
    }

    public static string BuildFilename(Guid? draftId, Guid? runId)
    {
        string stamp = TimeProvider.System.UtcNowDateTime().ToString("yyyy-MM-dd");
        string id = runId?.ToString() ?? draftId?.ToString() ?? "decision";

        return $"archlucid-decision-receipt-{id}-{stamp}.json";
    }

    private static DecisionReceiptIntakeContext? BuildIntakeContext(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (string.IsNullOrWhiteSpace(document.FreeTextIntent)
            && string.IsNullOrWhiteSpace(document.BusinessOutcome)
            && string.IsNullOrWhiteSpace(document.SystemName))
        {
            return null;
        }

        return new DecisionReceiptIntakeContext
        {
            FreeTextIntent = string.IsNullOrWhiteSpace(document.FreeTextIntent) ? null : document.FreeTextIntent.Trim(),
            BusinessOutcome = string.IsNullOrWhiteSpace(document.BusinessOutcome) ? null : document.BusinessOutcome.Trim(),
            SystemName = string.IsNullOrWhiteSpace(document.SystemName) ? null : document.SystemName.Trim(),
        };
    }

    private static DecisionReceiptCostStory BuildCostStory() => new();
}
