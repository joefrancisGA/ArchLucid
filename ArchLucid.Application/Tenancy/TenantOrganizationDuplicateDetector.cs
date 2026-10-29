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
                || text[afterPhrase] is '\'' or '.' or ':' or ',' or ';' or '(')
                return true;

            if (afterPhrase < text.Length && text[afterPhrase] is ' ')
            {
                if (!TryReadSqlClauseWordStart(text, afterPhrase, out int wordStart))
                    return true;

                if (!IsTenantSlugPhraseExcludedWord(text, wordStart))
                    return true;
            }

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
                || text[afterToken] is '\'' or '"' or ' ' or '.' or ')' or ',' or ';')
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

            int next = afterObject;

            while (next < text.Length && char.IsWhiteSpace(text[next]))
                next++;

            if (next >= text.Length)
                return true;

            if (ContainsWithUniqueIndexClause(text, next))
                return true;

            start = index + objectToken.Length;
        }

        return false;
    }

    private static bool ContainsWithUniqueIndexClause(string text, int start)
    {
        if (start + 4 > text.Length
            || !text.AsSpan(start, 4).Equals("with", StringComparison.OrdinalIgnoreCase))
            return false;

        int clauseStart = start + 4;

        if (clauseStart >= text.Length || !char.IsWhiteSpace(text[clauseStart]))
            return false;

        while (clauseStart < text.Length && char.IsWhiteSpace(text[clauseStart]))
            clauseStart++;

        if (clauseStart >= text.Length)
            return false;

        if (TryMatchSqlClauseKeyword(text, clauseStart, "constraint", out int afterConstraint))
            return IsSqlIndexConstraintContinuation(text, afterConstraint);

        if (TryMatchSqlClauseKeyword(text, clauseStart, "index", out int afterIndex))
            return IsSqlIndexConstraintContinuation(text, afterIndex);

        if (!TryMatchSqlClauseKeyword(text, clauseStart, "unique", out int afterUnique))
            return false;

        if (IsSqlClauseTerminal(text, afterUnique))
            return true;

        if (!TryReadSqlClauseWordStart(text, afterUnique, out int followStart))
            return false;

        if (TryMatchSqlClauseKeyword(text, followStart, "index", out int afterUniqueIndex))
        {
            if (IsSqlIndexConstraintContinuation(text, afterUniqueIndex))
                return true;

            return TryReadSqlClauseWordStart(text, afterUniqueIndex, out int afterIndexWord)
                && TryMatchSqlClauseKeyword(text, afterIndexWord, "on", out int afterOn)
                && TryReadSqlClauseWordStart(text, afterOn, out int onTarget)
                && IsUniqueIndexOnColumnTarget(text, onTarget);
        }

        if (TryMatchSqlClauseKeyword(text, followStart, "constraint", out int afterUniqueConstraint))
            return IsSqlIndexConstraintContinuation(text, afterUniqueConstraint);

        if (!TryMatchSqlClauseKeyword(text, followStart, "key", out int afterKey))
            return false;

        if (IsSqlClauseTerminal(text, afterKey))
            return true;

        if (!TryReadSqlClauseWordStart(text, afterKey, out int afterKeyWord))
            return false;

        return TryMatchSqlClauseKeyword(text, afterKeyWord, "constraint", out int afterKeyConstraint)
            && IsSqlIndexConstraintContinuation(text, afterKeyConstraint);
    }

    private static bool TryMatchSqlClauseKeyword(string text, int start, string keyword, out int afterKeyword)
    {
        afterKeyword = start;

        if (start + keyword.Length > text.Length
            || !text.AsSpan(start, keyword.Length).Equals(keyword, StringComparison.OrdinalIgnoreCase))
            return false;

        afterKeyword = start + keyword.Length;

        return afterKeyword >= text.Length || !char.IsLetterOrDigit(text[afterKeyword]);
    }

    private static bool IsSqlClauseTerminal(string text, int start)
    {
        int index = start;

        while (index < text.Length && char.IsWhiteSpace(text[index]))
            index++;

        if (index >= text.Length)
            return true;

        return text[index] is '.' or ';' or ')' or ',';
    }

    private static bool TryReadSqlClauseWordStart(string text, int start, out int wordStart)
    {
        wordStart = start;

        while (wordStart < text.Length && char.IsWhiteSpace(text[wordStart]))
            wordStart++;

        return wordStart < text.Length;
    }

    private static bool IsSqlIndexConstraintContinuation(string text, int start)
    {
        int index = start;

        while (index < text.Length && char.IsWhiteSpace(text[index]))
            index++;

        if (index >= text.Length)
            return true;

        if (text[index] is '\'' or '"' or '.' or ';' or ')' or ',')
            return true;

        return index + 3 <= text.Length
            && text.AsSpan(index, 3).Equals("IX_", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsTenantSlugPhraseExcludedWord(string text, int wordStart) =>
        TryMatchSqlClauseKeyword(text, wordStart, "equals", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "is", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "was", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "has", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "had", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "will", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "have", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "been", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "are", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "were", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "being", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "can", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "could", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "should", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "would", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "cannot", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "might", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "line", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "history", out _)
        || TryMatchSqlClauseKeyword(text, wordStart, "must", out _);

    private static bool IsUniqueIndexOnColumnTarget(string text, int onTarget)
    {
        if (TryMatchSqlClauseKeyword(text, onTarget, "slug", out int afterSlug)
            && IsSqlClauseTerminal(text, afterSlug))
            return true;

        const string normalizedOrganizationName = "normalizedorganizationname";

        if (onTarget + normalizedOrganizationName.Length > text.Length
            || !text.AsSpan(onTarget, normalizedOrganizationName.Length)
                .Equals(normalizedOrganizationName, StringComparison.OrdinalIgnoreCase))
            return false;

        int afterNormalized = onTarget + normalizedOrganizationName.Length;

        return afterNormalized >= text.Length || !char.IsLetterOrDigit(text[afterNormalized])
            ? IsSqlClauseTerminal(text, afterNormalized)
            : false;
    }
}
