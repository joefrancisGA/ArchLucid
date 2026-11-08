using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Shared decision-grade export gate for CSV, JSON ITSM export, and native ticket create (DX-12).
///     Only explicit <see cref="FindingClassification.DecisionGradeFinding" /> rows export as decision-grade.
/// </summary>
public static class DecisionGradeFindingExportFilter
{
    public const string ChecklistCoverageItsmExportBlockedMessage =
        "Checklist coverage findings cannot be exported as ITSM work items. They remain on the review desk checklist band.";

    public const string FindingClassificationNotStoredLabel = "Finding classification was not stored.";

    public const string UnclassifiedClassificationItsmExportBlockedMessage =
        "Findings without a stored classification cannot be exported as decision-grade ITSM work items.";

    public static bool IsDecisionGradeForExport(FindingClassification? classification)
    {
        return classification == FindingClassification.DecisionGradeFinding;
    }

    public static bool IsUnclassifiedForExport(FindingClassification? classification)
    {
        return classification is null;
    }

    public static bool IsChecklistCoverageForExport(FindingClassification? classification)
    {
        return classification == FindingClassification.ChecklistCoverage;
    }

    public static bool IsDecisionGradeForExport(ArchitectureFinding? finding)
    {
        if (finding is null)
        {
            return false;
        }

        return IsDecisionGradeForExport(finding.Classification);
    }

    public static bool IsDecisionGradeForExport(Finding? finding)
    {
        if (finding is null)
        {
            return false;
        }

        return IsDecisionGradeForExport(finding.Classification);
    }
}
