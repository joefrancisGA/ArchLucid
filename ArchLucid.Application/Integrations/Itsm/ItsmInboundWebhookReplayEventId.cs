namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>
///     Builds ITSM inbound replay keys: prefer vendor/ArchLucid delivery id headers; else provider + external key + status (TB-968).
/// </summary>
public static class ItsmInboundWebhookReplayEventId
{
    public const string DeliveryIdHeaderName = "X-ArchLucid-Webhook-Delivery-Id";

    public const string AtlassianWebhookIdentifierHeaderName = "X-Atlassian-Webhook-Identifier";

    /// <summary>
    ///     Prefer explicit delivery id, then Atlassian webhook identifier, else a synthetic content key.
    /// </summary>
    public static string Resolve(string? deliveryIdOrNull, string providerName, string externalKey, string statusOrState)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(externalKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(statusOrState);

        if (!string.IsNullOrWhiteSpace(deliveryIdOrNull))
            return deliveryIdOrNull.Trim();

        return BuildSynthetic(providerName, externalKey, statusOrState);
    }

    public static string BuildSynthetic(string providerName, string externalKey, string statusOrState) =>
        string.Create(
            System.Globalization.CultureInfo.InvariantCulture,
            $"{providerName.Trim()}:{externalKey.Trim()}:{statusOrState.Trim()}");
}
