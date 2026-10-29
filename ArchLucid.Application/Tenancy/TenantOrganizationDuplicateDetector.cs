using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;

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

        if (IsTenantOrganizationSqlUniqueViolation(ex))
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

    private static bool IsTenantOrganizationSqlUniqueViolation(Exception? ex)
    {
        if (ex is SqlException { Number: 2601 or 2627 } sqlException)
        {
            string text = sqlException.ToString();

            return ContainsOrganizationDuplicateContext(text)
                || ContainsTenantOrganizationUniqueIndexReference(text);
        }

        return ex?.InnerException is not null && IsTenantOrganizationSqlUniqueViolation(ex.InnerException);
    }

    private static bool ContainsDuplicateOrganizationText(string text) =>
        ((text.Contains("duplicate key", StringComparison.OrdinalIgnoreCase)
             || text.Contains("duplicate entry", StringComparison.OrdinalIgnoreCase))
            && ContainsOrganizationDuplicateContext(text))
        || (text.Contains("duplicate", StringComparison.OrdinalIgnoreCase)
            && ContainsOrganizationDuplicateContext(text));

    private static bool ContainsOrganizationDuplicateContext(string text) =>
        ContainsOrganizationSlugContext(text)
        || ContainsTenantsTableColumnReference(text, "NormalizedOrganizationName")
        || ContainsDboTenantsTableReference(text)
        || ContainsTenantOrganizationUniqueIndexReference(text);

    private static bool ContainsOrganizationSlugContext(string text) =>
        ContainsTenantSlugPhrase(text)
        || ContainsTenantsTableColumnReference(text, "Slug")
        || text.Contains("IX_Tenants_Slug", StringComparison.OrdinalIgnoreCase);

    private static bool ContainsTenantsTableColumnReference(string text, string columnName)
    {
        string token = $"Tenants.{columnName}";
        int start = 0;

        while (start <= text.Length - token.Length)
        {
            int index = text.IndexOf(token, start, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (index == 0 || (!char.IsLetterOrDigit(text[index - 1]) && text[index - 1] != '_'))
                return true;

            start = index + token.Length;
        }

        return false;
    }

    private static bool ContainsTenantSlugPhrase(string text)
    {
        const string phrase = "Tenant slug";
        int start = 0;

        while (start <= text.Length - phrase.Length)
        {
            int index = text.IndexOf(phrase, start, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterPhrase = index + phrase.Length;

            if (afterPhrase >= text.Length
                || text[afterPhrase] is '\'' or ' ' or '.')
                return true;

            start = index + phrase.Length;
        }

        return false;
    }

    private static bool ContainsSqliteOrganizationUniqueConstraint(string text) =>
        text.Contains("UNIQUE constraint failed", StringComparison.OrdinalIgnoreCase)
        && (ContainsOrganizationSlugContext(text)
            || ContainsTenantsTableColumnReference(text, "NormalizedOrganizationName")
            || ContainsTenantOrganizationUniqueIndexReference(text));

    private static bool ContainsTenantOrganizationUniqueIndexReference(string text) =>
        text.Contains("IX_Tenants_Slug", StringComparison.OrdinalIgnoreCase)
        || text.Contains("IX_Tenants_NormalizedOrganizationName", StringComparison.OrdinalIgnoreCase);

    private static bool ContainsDboTenantsTableReference(string text) =>
        text.Contains("object 'dbo.Tenants'", StringComparison.OrdinalIgnoreCase)
        || text.Contains("dbo.Tenants'", StringComparison.OrdinalIgnoreCase)
        || text.Contains("dbo.Tenants\"", StringComparison.OrdinalIgnoreCase)
        || text.Contains("dbo.Tenants ", StringComparison.OrdinalIgnoreCase)
        || text.Contains("dbo.Tenants.", StringComparison.OrdinalIgnoreCase);
}
