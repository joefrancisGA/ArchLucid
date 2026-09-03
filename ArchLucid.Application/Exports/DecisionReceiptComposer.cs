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

        DecisionReceiptDocument receipt = new()
        {
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            Source = DecisionReceiptSource.DraftAdmission,
            DraftId = draft.DraftId,
            RedirectReason = draft.RedirectReason,
            Intake = BuildIntakeContext(draft.Document),
            Verdict = verdict,
            CostStory = BuildCostStory(),
        };

        return SealReceiptHash(receipt);
    }

    private static DecisionReceiptDocument SealReceiptHash(DecisionReceiptDocument receipt)
    {
        receipt.ReceiptHashSha256 = DecisionReceiptCanonicalHasher.ComputeSha256Hex(receipt);

        return receipt;
    }

    public static DecisionReceiptDocument BuildForRun(
        Guid runId,
        FeasibilityVerdict verdict,
        string? manifestHashSha256,
        string? manifestVersion)
    {
        ArgumentNullException.ThrowIfNull(verdict);

        if (string.IsNullOrWhiteSpace(manifestHashSha256))
        {
            throw new ArgumentException(
                "Committed-run decision receipts require a manifest hash binding.",
                nameof(manifestHashSha256));
        }

        if (string.IsNullOrWhiteSpace(manifestVersion))
        {
            throw new ArgumentException(
                "Committed-run decision receipts require a manifest version binding.",
                nameof(manifestVersion));
        }

        DecisionReceiptDocument receipt = new()
        {
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            Source = DecisionReceiptSource.CommittedRun,
            RunId = runId,
            Verdict = verdict,
            ManifestHashSha256 = manifestHashSha256,
            ManifestVersion = manifestVersion,
            CostStory = BuildCostStory(),
        };

        return SealReceiptHash(receipt);
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
