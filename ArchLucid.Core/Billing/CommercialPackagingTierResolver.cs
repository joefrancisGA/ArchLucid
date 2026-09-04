using ArchLucid.Core.Tenancy;

namespace ArchLucid.Core.Billing;

/// <summary>
///     Maps persisted tenant tier + billing subscription shape to marketplace tier labels. Team and Professional both
///     persist as <see cref="TenantTier.Standard" /> — subscription purchased quantities disambiguate when present.
/// </summary>
public static class CommercialPackagingTierResolver
{
    public static string? ResolveCommercialTierLabel(
        TenantRecord tenant,
        BillingSubscriptionSnapshot? subscription,
        int workspacesUsed,
        int seatsUsed)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        if (tenant.Tier == TenantTier.Enterprise)
            return CommercialPackagingTierLabels.Enterprise;

        if ((int)tenant.Tier < (int)TenantTier.Standard)
            return null;

        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Active))
            return null;

        if (subscription is not null)
        {
            if (subscription.WorkspacesPurchased <= CommercialPackagingLimits.TeamWorkspacesIncluded &&
                subscription.SeatsPurchased <= CommercialPackagingLimits.TeamSeatsIncluded)
            {
                return CommercialPackagingTierLabels.Team;
            }

            return CommercialPackagingTierLabels.Professional;
        }

        // Sales-led Standard tenants without a billing row: infer Team when usage fits Team caps.
        if (workspacesUsed <= CommercialPackagingLimits.TeamWorkspacesIncluded &&
            seatsUsed <= CommercialPackagingLimits.TeamSeatsIncluded)
        {
            return CommercialPackagingTierLabels.Team;
        }

        return CommercialPackagingTierLabels.Professional;
    }
}
