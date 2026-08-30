using System.Globalization;

using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Persistence.Billing.AzureMarketplace;

public sealed partial class AzureMarketplaceBillingProvider
{
    public async Task<BillingCheckoutResult> CreateCheckoutSessionAsync(
        BillingCheckoutRequest request,
        CancellationToken cancellationToken)
    {
        BillingOptions billing = _billingOptions.CurrentValue;
        string? landing = billing.AzureMarketplace.LandingPageUrl?.Trim();

        if (string.IsNullOrWhiteSpace(landing))
            throw new InvalidOperationException("Billing:AzureMarketplace:LandingPageUrl is not configured.");

        string sessionId = $"mkt_sess_{Guid.NewGuid():N}";
        string join = landing.Contains('?', StringComparison.Ordinal) ? "&" : "?";
        string url =
            $"{landing}{join}tenantId={Uri.EscapeDataString(request.TenantId.ToString("D", CultureInfo.InvariantCulture))}"
            + $"&workspaceId={Uri.EscapeDataString(request.WorkspaceId.ToString("D", CultureInfo.InvariantCulture))}"
            + $"&projectId={Uri.EscapeDataString(request.ProjectId.ToString("D", CultureInfo.InvariantCulture))}"
            + $"&tier={Uri.EscapeDataString(BillingTierCode.CheckoutTierLabel(request.TargetTier))}"
            + $"&session={Uri.EscapeDataString(sessionId)}";

        string tierCode = BillingTierCode.FromCheckoutTier(request.TargetTier);

        await _ledger.UpsertPendingCheckoutAsync(
            request.TenantId,
            request.WorkspaceId,
            request.ProjectId,
            ProviderName,
            sessionId,
            tierCode,
            Math.Max(1, request.Seats),
            Math.Max(1, request.Workspaces),
            cancellationToken);

        return new BillingCheckoutResult { CheckoutUrl = url, ProviderSessionId = sessionId, ExpiresUtc = TimeProvider.System.GetUtcNow().AddDays(7) };
    }

    public Task<BillingPortalResult> CreateBillingPortalSessionAsync(
        BillingPortalRequest request,
        CancellationToken cancellationToken)
    {
        throw new InvalidOperationException(
            "Azure Marketplace billing does not support the Stripe Billing Portal. Manage subscription in Azure Portal.");
    }
}
