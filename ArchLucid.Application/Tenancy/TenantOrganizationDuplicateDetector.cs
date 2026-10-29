using ArchLucid.Persistence.Connections;

namespace ArchLucid.Application.Tenancy;

/// <summary>Detects duplicate-organization failures from SQL and other providers during self-service registration.</summary>
public static class TenantOrganizationDuplicateDetector
{
    /// <summary>Normalizes organization display names for case-insensitive duplicate checks.</summary>
    public static string NormalizeOrganizationName(string organizationName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(organizationName);

        return organizationName.Trim().ToUpperInvariant();
    }

    /// <summary>
    ///     Returns <see langword="true" /> when <paramref name="ex" /> indicates a unique-key / duplicate organization conflict.
    /// </summary>
    public static bool IsDuplicateOrganization(Exception? ex)
    {
        if (ex is null)
            return false;

        if (SqlUniqueConstraintViolationDetector.IsUniqueKeyViolation(ex))
            return true;

        string text = ex.ToString();

        if (ContainsTenantOrganizationUniqueIndexReference(text))
            return true;

        if (ContainsDuplicateOrganizationText(text))
            return true;

        if (ContainsSqliteOrganizationUniqueConstraint(text))
            return true;

        if (text.Contains("already exists", StringComparison.OrdinalIgnoreCase)
            && ContainsOrganizationDuplicateContext(text))
            return true;

        return IsDuplicateOrganization(ex.InnerException);
    }

    private static bool ContainsDuplicateOrganizationText(string text) =>
        ((text.Contains("duplicate key", StringComparison.OrdinalIgnoreCase)
             || text.Contains("duplicate entry", StringComparison.OrdinalIgnoreCase))
            && ContainsOrganizationDuplicateContext(text))
        || (text.Contains("duplicate", StringComparison.OrdinalIgnoreCase)
            && ContainsOrganizationDuplicateContext(text));

    private static bool ContainsOrganizationDuplicateContext(string text) =>
        text.Contains("slug", StringComparison.OrdinalIgnoreCase)
        || text.Contains("organization", StringComparison.OrdinalIgnoreCase)
        || text.Contains("IX_", StringComparison.OrdinalIgnoreCase)
        || text.Contains("Tenants.", StringComparison.OrdinalIgnoreCase);

    private static bool ContainsSqliteOrganizationUniqueConstraint(string text) =>
        text.Contains("UNIQUE constraint failed", StringComparison.OrdinalIgnoreCase)
        && (text.Contains("slug", StringComparison.OrdinalIgnoreCase)
            || text.Contains("organization", StringComparison.OrdinalIgnoreCase)
            || text.Contains("IX_", StringComparison.OrdinalIgnoreCase));

    private static bool ContainsTenantOrganizationUniqueIndexReference(string text) =>
        text.Contains("IX_Tenants_", StringComparison.OrdinalIgnoreCase)
        || text.Contains("IX_Tenants'", StringComparison.OrdinalIgnoreCase)
        || (text.Contains("IX_", StringComparison.OrdinalIgnoreCase)
            && (text.Contains("Slug", StringComparison.OrdinalIgnoreCase)
                || text.Contains("OrganizationName", StringComparison.OrdinalIgnoreCase)
                || text.Contains("NormalizedOrganizationName", StringComparison.OrdinalIgnoreCase)));
}
