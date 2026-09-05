using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>
///     Shared inclusion rules for whether a policy pack participates in run evaluation (preview, execute, commit).
/// </summary>
public static class PolicyPackRunEvaluationScope
{
    /// <summary>
    ///     Returns whether the pack is included in run evaluation for the given focused-review and assignment state.
    /// </summary>
    public static bool IsPackIncludedInRunEvaluation(
        string? packDisplayName,
        PolicyPackAssignment? assignment,
        bool focusedPilotModeEnabled,
        CloudProvider cloudProvider)
    {
        if (!focusedPilotModeEnabled)
        {
            if (assignment is null)
                return false;

            return assignment.IsEnabled;
        }

        bool isOrganizationRequired = PolicyPackAssignmentOrganizationRequired.IsOrganizationRequired(assignment);
        bool isOverlay = PlatformOverlayPolicyPacks.IsOverlayDisplayName(packDisplayName, cloudProvider);

        return FocusedPilotModePolicyPacks.IsPackAllowedInFocusedReview(
            packDisplayName,
            isOrganizationRequired,
            isOverlay);
    }
}
