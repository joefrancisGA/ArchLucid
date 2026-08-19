namespace ArchLucid.Core.Marketing;

/// <summary>Normalized first-touch UTM capture for signup attribution (TB-019).</summary>
public sealed class MarketingAttributionSnapshot
{
    public string? UtmSource { get; init; }

    public string? UtmMedium { get; init; }

    public string? UtmCampaign { get; init; }

    public string? UtmContent { get; init; }

    public DateTimeOffset CapturedUtc { get; init; }
}
