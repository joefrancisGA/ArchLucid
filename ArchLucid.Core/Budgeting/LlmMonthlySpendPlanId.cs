using ArchLucid.Core.Billing;

namespace ArchLucid.Core.Budgeting;

/// <summary>
///     Keys for <c>LlmMonthlyTenantDollarBudget:ByPlan</c>. Distinct from marketplace tier labels because Architect is a
///     Stripe SKU, not a <see cref="CommercialPackagingTierLabels" /> value.
/// </summary>
public static class LlmMonthlySpendPlanId
{
    public const string Architect = "architect";

    public const string Team = "team";

    public const string Professional = "professional";

    /// <summary>
    ///     Team Stripe always bills the 5-seat bundle, so a 1-seat / 1-workspace subscription is the Architect SKU.
    /// </summary>
    public static string? FromCommercialPackaging(
        string? commercialTierLabel,
        BillingSubscriptionSnapshot? subscription)
    {
        if (subscription is not null
            && subscription.SeatsPurchased <= 1
            && subscription.WorkspacesPurchased <= CommercialPackagingLimits.TeamWorkspacesIncluded)
        {
            return Architect;
        }

        if (string.Equals(commercialTierLabel, CommercialPackagingTierLabels.Team, StringComparison.Ordinal))
        {
            return Team;
        }

        if (string.Equals(
                commercialTierLabel,
                CommercialPackagingTierLabels.Professional,
                StringComparison.Ordinal))
        {
            return Professional;
        }

        return null;
    }
}
