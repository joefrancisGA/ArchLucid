namespace ArchLucid.Contracts.Architecture;

/// <summary>Architecture-scoped share roles inside one tenant (ADR 0087 / AS-090).</summary>
public static class ArchitectureShareRoles
{
    public const string View = "View";

    public const string Decide = "Decide";

    public const string Admin = "Admin";

    public static bool IsKnownRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
            return false;

        string normalized = role.Trim();

        return normalized.Equals(View, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(Decide, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(Admin, StringComparison.OrdinalIgnoreCase);
    }

    public static string NormalizeRole(string role)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        string normalized = role.Trim();

        if (normalized.Equals(View, StringComparison.OrdinalIgnoreCase))
            return View;

        if (normalized.Equals(Decide, StringComparison.OrdinalIgnoreCase))
            return Decide;

        if (normalized.Equals(Admin, StringComparison.OrdinalIgnoreCase))
            return Admin;

        throw new ArgumentException($"Unknown architecture share role '{role}'.", nameof(role));
    }
}
