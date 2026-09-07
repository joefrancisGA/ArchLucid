using ArchLucid.Core.Configuration;
using ArchLucid.Core.ProductLine;

namespace ArchLucid.Application.Notifications.Email;

/// <summary>Resolves the consumer product label for outbound email templates.</summary>
public static class EmailProductDisplayNameResolver
{
    /// <summary>
    ///     When <paramref name="productLine" /> is set, uses <see cref="ProductLineConsumerNames" /> for that line.
    ///     Otherwise honors legacy <see cref="EmailNotificationOptions.ProductDisplayName" />, then Architecture default.
    /// </summary>
    public static string Resolve(
        EmailNotificationOptions emailOptions,
        ProductLineId? productLine = null,
        ProductLineDisplayNamesOptions? displayNames = null)
    {
        ArgumentNullException.ThrowIfNull(emailOptions);

        if (productLine is not null)
            return ProductLineConsumerNames.DisplayName(productLine.Value, displayNames);

        if (!string.IsNullOrWhiteSpace(emailOptions.ProductDisplayName))
            return emailOptions.ProductDisplayName.Trim();

        return ProductLineConsumerNames.DisplayName(ProductLineId.Architecture, displayNames);
    }
}
