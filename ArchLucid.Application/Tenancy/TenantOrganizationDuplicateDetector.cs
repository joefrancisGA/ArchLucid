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

        return text.Contains("duplicate", StringComparison.OrdinalIgnoreCase)
               || text.Contains("unique", StringComparison.OrdinalIgnoreCase)
               || text.Contains("already exists", StringComparison.OrdinalIgnoreCase)
               || text.Contains("IX_", StringComparison.OrdinalIgnoreCase)
               || IsDuplicateOrganization(ex.InnerException);
    }
}
