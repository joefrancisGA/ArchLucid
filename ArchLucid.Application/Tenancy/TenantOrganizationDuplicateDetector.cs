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
        || ContainsTenantsTableIndexReference(text, "Slug");

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
            {
                int afterToken = index + token.Length;

                if (afterToken >= text.Length || !char.IsLetterOrDigit(text[afterToken]))
                    return true;
            }

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
                || text[afterPhrase] is '\'' or ' ' or '.' or ':' or ',')
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
        ContainsTenantsTableIndexReference(text, "Slug")
        || ContainsTenantsTableIndexReference(text, "NormalizedOrganizationName");

    private static bool ContainsTenantsTableIndexReference(string text, string indexSuffix)
    {
        string token = $"IX_Tenants_{indexSuffix}";
        int start = 0;

        while (start <= text.Length - token.Length)
        {
            int index = text.IndexOf(token, start, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + token.Length;

            if (afterToken >= text.Length
                || text[afterToken] is '\'' or '"' or ' ' or '.' or ')' or ',')
                return true;

            start = index + token.Length;
        }

        return false;
    }

    private static bool ContainsDboTenantsTableReference(string text)
    {
        if (ContainsObjectDboTenantsReference(text))
            return true;

        const string token = "dbo.Tenants";
        int start = 0;

        while (start <= text.Length - token.Length)
        {
            int index = text.IndexOf(token, start, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (index == 0 || (!char.IsLetterOrDigit(text[index - 1]) && text[index - 1] != '_'))
            {
                int afterToken = index + token.Length;

                if (afterToken >= text.Length)
                    return true;

                if (text[afterToken] is '.' or ')' or ',')
                    return true;

                if (text[afterToken] is ' ')
                {
                    int next = afterToken + 1;

                    while (next < text.Length && char.IsWhiteSpace(text[next]))
                        next++;

                    if (next >= text.Length || !char.IsLetter(text[next]))
                        return true;
                }
            }

            start = index + token.Length;
        }

        return false;
    }

    private static bool ContainsObjectDboTenantsReference(string text)
    {
        const string objectToken = "object 'dbo.Tenants'";
        int start = 0;

        while (start <= text.Length - objectToken.Length)
        {
            int index = text.IndexOf(objectToken, start, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterObject = index + objectToken.Length;

            if (afterObject >= text.Length)
                return true;

            if (text[afterObject] is '.' or ',' or ')' or ';')
                return true;

            if (afterObject + 5 <= text.Length
                && text.AsSpan(afterObject, 6).Equals(" with ", StringComparison.OrdinalIgnoreCase))
                return true;

            start = index + objectToken.Length;
        }

        return false;
    }
}
