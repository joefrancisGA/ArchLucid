using ArchLucid.Core.Billing;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

/// <summary>
///     Computes marketplace tier labels and seat/workspace headroom from tenant rows, billing subscriptions, and workspace
///     inventory.
/// </summary>
public sealed class TenantUsageStatusService(
    ITenantRepository tenantRepository,
    IBillingLedger billingLedger) : ITenantUsageStatusService
{
    private readonly IBillingLedger _billingLedger =
        billingLedger ?? throw new ArgumentNullException(nameof(billingLedger));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    public async Task<TenantUsageStatusSnapshot?> BuildAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            return null;

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return null;

        bool isTrial = string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal);
        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await _tenantRepository.ListWorkspacesAsync(tenantId, cancellationToken);
        int workspacesUsed = workspaces.Count;
        int seatsUsed = ResolveSeatsUsed(tenant);
        BillingSubscriptionSnapshot? subscription =
            await _billingLedger.TryGetSubscriptionAsync(tenantId, cancellationToken);
        string? commercialTier = isTrial
            ? null
            : CommercialPackagingTierResolver.ResolveCommercialTierLabel(
                tenant,
                subscription,
                workspacesUsed,
                seatsUsed);
        int? seatsLimit = ResolveSeatsLimit(tenant, commercialTier);
        int? workspacesLimit = ResolveWorkspacesLimit(commercialTier);

        return new TenantUsageStatusSnapshot(
            isTrial,
            commercialTier,
            seatsUsed,
            seatsLimit,
            workspacesUsed,
            workspacesLimit);
    }

    private static int ResolveSeatsUsed(TenantRecord tenant)
    {
        if (tenant.Tier == TenantTier.Enterprise)
            return tenant.EnterpriseSeatsUsed;

        return tenant.TrialSeatsUsed;
    }

    private static int? ResolveSeatsLimit(TenantRecord tenant, string? commercialTier)
    {
        if (commercialTier is null)
            return null;

        if (string.Equals(commercialTier, CommercialPackagingTierLabels.Enterprise, StringComparison.Ordinal))
        {
            return tenant.EnterpriseSeatsLimit;
        }

        if (string.Equals(commercialTier, CommercialPackagingTierLabels.Team, StringComparison.Ordinal))
            return CommercialPackagingLimits.TeamSeatsIncluded;

        if (string.Equals(commercialTier, CommercialPackagingTierLabels.Professional, StringComparison.Ordinal))
            return CommercialPackagingLimits.ProfessionalSeatsIncluded;

        return null;
    }

    private static int? ResolveWorkspacesLimit(string? commercialTier)
    {
        if (commercialTier is null)
            return null;

        if (string.Equals(commercialTier, CommercialPackagingTierLabels.Enterprise, StringComparison.Ordinal))
            return null;

        if (string.Equals(commercialTier, CommercialPackagingTierLabels.Team, StringComparison.Ordinal))
            return CommercialPackagingLimits.TeamWorkspacesIncluded;

        if (string.Equals(commercialTier, CommercialPackagingTierLabels.Professional, StringComparison.Ordinal))
            return CommercialPackagingLimits.ProfessionalWorkspacesIncluded;

        return null;
    }
}
