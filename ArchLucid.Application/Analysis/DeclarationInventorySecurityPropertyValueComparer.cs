using System.Text.Json;

using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Analysis;

internal static class DeclarationInventorySecurityPropertyValueComparer
{
    internal static string ComparableToken(string logicalName, string value)
    {
        if (logicalName == DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion)
            return CanonicalMinimumTlsVersion(value);

        if (logicalName == DeclarationSecurityPropertyLogicalNames.NetworkAclDefaultAction
            && TryExtractDefaultActionToken(value, out string token))
            return token;

        return value;
    }

    /// <summary>
    ///     ARM and azurerm storage emit <c>TLS1_2</c>. Older declarations and App Service
    ///     <c>minTlsVersion</c> use <c>1.2</c>. Both name the same protocol version.
    /// </summary>
    private static string CanonicalMinimumTlsVersion(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string normalized = value.Trim()
            .ToLowerInvariant()
            .Replace("_", string.Empty, StringComparison.Ordinal)
            .Replace(" ", string.Empty, StringComparison.Ordinal)
            .Replace("-", string.Empty, StringComparison.Ordinal);

        return normalized switch
        {
            "1.0" or "tls1.0" or "tls10" => "1.0",
            "1.1" or "tls1.1" or "tls11" => "1.1",
            "1.2" or "tls1.2" or "tls12" => "1.2",
            "1.3" or "tls1.3" or "tls13" => "1.3",
            _ => normalized,
        };
    }

    internal static bool ValuesMatch(string declarationValue, string inventoryValue)
    {
        string normalizedDeclaration = NormalizeSecurityToken(declarationValue);
        string normalizedInventory = NormalizeSecurityToken(inventoryValue);

        return string.Equals(normalizedDeclaration, normalizedInventory, StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryExtractDefaultActionToken(string? value, out string token)
    {
        token = string.Empty;

        if (string.IsNullOrWhiteSpace(value))
            return false;

        string trimmed = value.Trim();

        if (trimmed.Length < 2 || trimmed[0] != '{')
            return false;

        try
        {
            using JsonDocument document = JsonDocument.Parse(trimmed);

            if (document.RootElement.ValueKind is not JsonValueKind.Object)
                return false;

            foreach (JsonProperty property in document.RootElement.EnumerateObject())
            {
                if (property.Value.ValueKind is not JsonValueKind.String)
                    continue;

                if (!string.Equals(property.Name, "defaultaction", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(property.Name, "default_action", StringComparison.OrdinalIgnoreCase))
                    continue;

                string? text = property.Value.GetString()?.Trim();

                if (string.IsNullOrWhiteSpace(text))
                    continue;

                token = text;
                return true;
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
    }

    private static string NormalizeSecurityToken(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string trimmed = value.Trim();

        if (string.Equals(trimmed, "enabled", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "true", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "allow", StringComparison.OrdinalIgnoreCase))
            return "true";

        if (string.Equals(trimmed, "disabled", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "false", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "deny", StringComparison.OrdinalIgnoreCase))
            return "false";

        return trimmed.ToLowerInvariant();
    }
}
