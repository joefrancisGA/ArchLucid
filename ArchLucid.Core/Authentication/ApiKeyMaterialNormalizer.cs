namespace ArchLucid.Core.Authentication;

/// <summary>Normalizes API key material from configuration and inbound headers (trim + UTF-8 BOM strip).</summary>
public static class ApiKeyMaterialNormalizer
{
    public static string Normalize(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        return value.Trim().TrimStart('\uFEFF');
    }
}
