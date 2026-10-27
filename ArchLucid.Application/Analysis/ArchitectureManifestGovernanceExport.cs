using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Shared rules for when manifest governance belongs in architecture analysis exports.
/// </summary>
internal static class ArchitectureManifestGovernanceExport
{
    private const string DefaultClassification = "Moderate";

    internal const string RiskClassificationNotStoredLabel = "Risk classification was not stored.";

    internal const string CostClassificationNotStoredLabel = "Cost classification was not stored.";

    internal const string RequiredControlsNotStoredLabel = "Required controls were not stored.";

    internal const string ComplianceTagsNotStoredLabel = "Compliance tags were not stored.";

    internal const string PolicyConstraintsNotStoredLabel = "Policy constraints were not stored.";

    internal static string FormatRequiredControlsForExport(IReadOnlyCollection<string> requiredControls) =>
        requiredControls.Count > 0 ? string.Join(", ", requiredControls) : RequiredControlsNotStoredLabel;

    internal static string FormatComplianceTagsForExport(IReadOnlyCollection<string> complianceTags) =>
        complianceTags.Count > 0 ? string.Join(", ", complianceTags) : ComplianceTagsNotStoredLabel;

    internal static string FormatPolicyConstraintsForExport(IReadOnlyCollection<string> policyConstraints) =>
        policyConstraints.Count > 0 ? string.Join(", ", policyConstraints) : PolicyConstraintsNotStoredLabel;

    internal static string FormatRiskClassificationForExport(ManifestGovernance governance)
    {
        ArgumentNullException.ThrowIfNull(governance);

        return IsUnsetClassification(governance.RiskClassification)
            ? RiskClassificationNotStoredLabel
            : governance.RiskClassification.Trim();
    }

    internal static string FormatCostClassificationForExport(ManifestGovernance governance)
    {
        ArgumentNullException.ThrowIfNull(governance);

        return IsUnsetClassification(governance.CostClassification)
            ? CostClassificationNotStoredLabel
            : governance.CostClassification.Trim();
    }

    private static bool IsUnsetClassification(string? classification) =>
        string.IsNullOrWhiteSpace(classification)
        || string.Equals(classification.Trim(), DefaultClassification, StringComparison.OrdinalIgnoreCase);

    private static bool IsDefaultClassificationOnly(ManifestGovernance governance)
    {
        if (governance.RequiredControls.Count > 0
            || governance.ComplianceTags.Count > 0
            || governance.PolicyConstraints.Count > 0)
        {
            return false;
        }

        return string.Equals(governance.RiskClassification, DefaultClassification, StringComparison.OrdinalIgnoreCase)
            && string.Equals(governance.CostClassification, DefaultClassification, StringComparison.OrdinalIgnoreCase);
    }

    internal static bool ShouldRender(ManifestGovernance governance)
    {
        ArgumentNullException.ThrowIfNull(governance);

        if (governance.RequiredControls.Count > 0
            || governance.ComplianceTags.Count > 0
            || governance.PolicyConstraints.Count > 0)
        {
            return true;
        }

        if (!string.Equals(governance.RiskClassification, DefaultClassification, StringComparison.OrdinalIgnoreCase))
            return true;

        if (!string.Equals(governance.CostClassification, DefaultClassification, StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }
}
