namespace ArchLucid.Application.Analysis;

internal static class DeclarationInventorySecurityPropertyValueComparer
{
    internal static bool ValuesMatch(string declarationValue, string inventoryValue)
    {
        string normalizedDeclaration = NormalizeSecurityToken(declarationValue);
        string normalizedInventory = NormalizeSecurityToken(inventoryValue);

        return string.Equals(normalizedDeclaration, normalizedInventory, StringComparison.OrdinalIgnoreCase);
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
