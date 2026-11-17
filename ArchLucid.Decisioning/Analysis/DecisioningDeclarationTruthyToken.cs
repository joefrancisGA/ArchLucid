namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Shared yes/no and ARM/Terraform truthy tokens for declaration property bags (parity with graph scalar normalization).
/// </summary>
internal static class DecisioningDeclarationTruthyToken
{
    public static bool IsTruthy(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string normalized = value.Trim();

        if (string.Equals(normalized, "true", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "yes", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "on", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "allow", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "enabled", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }
}