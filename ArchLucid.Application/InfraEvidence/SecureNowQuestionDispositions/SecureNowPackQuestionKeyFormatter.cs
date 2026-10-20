using System.Text.RegularExpressions;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

internal static class SecureNowPackQuestionKeyFormatter
{
    private static readonly Regex VersionedQuestionKey = new(
        @"@v[1-9][0-9]*$",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    internal static string EnsureVersionSuffix(string questionKey)
    {
        string trimmed = questionKey.Trim();

        if (trimmed.Length == 0)
            return string.Empty;

        if (VersionedQuestionKey.IsMatch(trimmed))
            return trimmed;

        return $"{trimmed}@v1";
    }
}
