using System.Text;
using System.Text.Json;

using ArchLucid.Core.Marketing;

namespace ArchLucid.Api.Marketing;

/// <summary>Parses <c>x-archlucid-first-touch</c> signup attribution header (TB-019).</summary>
public static class MarketingAttributionHeaderParser
{
    private const int MaxFieldLength = 120;

    public static MarketingAttributionSnapshot? TryParse(string? headerValue)
    {
        if (string.IsNullOrWhiteSpace(headerValue))
            return null;

        string trimmed = headerValue.Trim();

        try
        {
            string json = trimmed.StartsWith('{') ? trimmed : Encoding.UTF8.GetString(Convert.FromBase64String(trimmed));
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;

            MarketingAttributionSnapshot snapshot = new()
            {
                UtmSource = Sanitize(GetString(root, "utm_source")),
                UtmMedium = Sanitize(GetString(root, "utm_medium")),
                UtmCampaign = Sanitize(GetString(root, "utm_campaign")),
                UtmContent = Sanitize(GetString(root, "utm_content")),
                CapturedUtc = ParseCapturedUtc(root),
            };

            if (string.IsNullOrWhiteSpace(snapshot.UtmSource)
                && string.IsNullOrWhiteSpace(snapshot.UtmMedium)
                && string.IsNullOrWhiteSpace(snapshot.UtmCampaign)
                && string.IsNullOrWhiteSpace(snapshot.UtmContent))
                return null;

            return snapshot;
        }
        catch (FormatException)
        {
            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static DateTimeOffset ParseCapturedUtc(JsonElement root)
    {
        if (root.TryGetProperty("capturedUtc", out JsonElement value)
            && value.ValueKind == JsonValueKind.String
            && DateTimeOffset.TryParse(value.GetString(), out DateTimeOffset parsed))
        {
            return parsed.ToUniversalTime();
        }

        return DateTimeOffset.UtcNow;
    }

    private static string? GetString(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out JsonElement value))
            return null;

        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    private static string? Sanitize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        StringBuilder builder = new(raw.Length);

        foreach (char c in raw.Trim())
        {
            if (!char.IsControl(c))
                builder.Append(c);
        }

        if (builder.Length == 0)
            return null;

        string s = builder.ToString();

        return s.Length > MaxFieldLength ? s[..MaxFieldLength] : s;
    }
}
