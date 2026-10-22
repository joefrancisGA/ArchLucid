using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Shared rules for when manifest governance belongs in architecture analysis exports.
/// </summary>
internal static class ArchitectureManifestGovernanceExport
{
    private const string DefaultClassification = "Moderate";

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
