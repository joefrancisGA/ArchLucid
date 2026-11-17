namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Shared falsy tokens for declaration property bags (parity with <see cref="DatastoreSkuReader"/> boolean normalization).
/// </summary>
internal static class DecisioningDeclarationFalsyToken
{
    public static bool IsFalsy(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string normalized = value.Trim();

        if (string.Equals(normalized, "false", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "0", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "no", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "off", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "disabled", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }
}