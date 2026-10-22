namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Buyer-facing Azure subscription labels for inventory snapshot pickers.
/// </summary>
public static class AzureExtractorSubscriptionDisplayName
{
    /// <summary>
    ///     Matches <c>dbo.AzureInventorySnapshots.SubscriptionName</c> (<c>NVARCHAR(256)</c>).
    /// </summary>
    public const int MaxStoredLength = 256;

    /// <summary>
    ///     Returns a trimmed ARM <c>displayName</c> when it is not a GUID.
    ///     Inventory diagrams hide UUID-like labels, so a GUID stored as the name never appears in the dropdown.
    /// </summary>
    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        string trimmed = value.Trim();

        if (Guid.TryParse(trimmed, out _))
            return null;

        if (trimmed.Length > MaxStoredLength)
            return trimmed[..MaxStoredLength];

        return trimmed;
    }
}
