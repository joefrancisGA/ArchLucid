using System.Text.Json;

namespace ArchLucid.Core.Billing.AzureMarketplace;

/// <summary>
///     Extracts Marketplace SaaS webhook fields used for <c>ChangePlan</c> / <c>ChangeQuantity</c> (payload shape
///     varies slightly by action).
/// </summary>
public static class MarketplaceWebhookPayloadParser
{
    /// <inheritdoc cref="MarketplacePlanIdMapper.TierStorageCodeFromPlanId" />
    public static string TierStorageCodeFromPlanId(string? planId) =>
        MarketplacePlanIdMapper.TierStorageCodeFromPlanId(planId);

    /// <inheritdoc cref="MarketplaceChangePlanReader.TryGetPlanId" />
    public static bool TryGetPlanId(JsonElement root, out string? planId) =>
        MarketplaceChangePlanReader.TryGetPlanId(root, out planId);

    /// <inheritdoc cref="MarketplaceQuantityReader.TryReadQuantity" />
    public static bool TryReadQuantity(JsonElement root, out int quantity) =>
        MarketplaceQuantityReader.TryReadQuantity(root, out quantity);

    /// <inheritdoc cref="MarketplaceQuantityReader.ReadQuantity" />
    public static int ReadQuantity(JsonElement root, int fallback = 1) =>
        MarketplaceQuantityReader.ReadQuantity(root, fallback);
}
