namespace ArchLucid.Core.Requests;

/// <summary>
///     Shared entry point for control, capability, and quality-dimension phrase matching
///     (negation, separators, case, and compound identifiers).
/// </summary>
public static class ControlPhraseMatcher
{
    public static bool ContainsAffirmativePhrase(string? haystack, string phrase) =>
        RequestConstraintTokenMatcher.ContainsAffirmativePhrase(haystack, phrase);

    public static bool ContainsStandaloneToken(string? haystack, string token) =>
        RequestConstraintTokenMatcher.ContainsStandaloneWordToken(haystack, token);

    public static bool TextAffirmsManagedIdentity(string? text) =>
        ContainsAffirmativePhrase(text, ControlPhraseCatalog.ManagedIdentity);

    public static bool TextAffirmsPrivateEndpoint(string? text) =>
        ContainsAffirmativePhrase(text, ControlPhraseCatalog.PrivateEndpoint)
        || ContainsAffirmativePhrase(text, ControlPhraseCatalog.PrivateEndpoints);

    public static bool ConstraintRequiresPrivateNetworking(string? constraint) =>
        TextAffirmsPrivateEndpoint(constraint)
        || ContainsAffirmativePhrase(constraint, ControlPhraseCatalog.PrivateNetworking)
        || RequestConstraintTokenMatcher.ContainsAffirmativePrivateWord(constraint);

    public static bool CapabilityRequiresEncryptionAtRest(string? capability) =>
        ContainsAffirmativePhrase(capability, ControlPhraseCatalog.Encryption)
        && ContainsStandaloneToken(capability, "rest");

    public static bool ConstraintRequiresHttps(string? constraint)
    {
        if (string.IsNullOrWhiteSpace(constraint))
            return false;

        if (constraint.Contains("http://", StringComparison.OrdinalIgnoreCase))
            return false;

        return ContainsStandaloneToken(constraint, "https")
            || ContainsStandaloneToken(constraint, "tls");
    }

    public static bool IdentifierMentionsQualityDimension(string? identifier, string dimensionToken) =>
        ContainsStandaloneToken(identifier, dimensionToken);

    public static bool TextAffirmsPrivateWord(string? text) =>
        RequestConstraintTokenMatcher.ContainsAffirmativePrivateWord(text);

    public static bool TryMatchCatalogPattern(string? haystack, string pattern, out bool matches)
    {
        matches = false;

        if (string.IsNullOrEmpty(haystack) || string.IsNullOrEmpty(pattern))
            return false;

        if (pattern.Contains('$', StringComparison.Ordinal))
            return false;

        string normalizedPattern = pattern.ToLowerInvariant();

        if (normalizedPattern == ControlPhraseCatalog.ManagedIdentity)
        {
            matches = TextAffirmsManagedIdentity(haystack);

            return true;
        }

        if (normalizedPattern is ControlPhraseCatalog.PrivateEndpoint or ControlPhraseCatalog.PrivateEndpoints)
        {
            matches = TextAffirmsPrivateEndpoint(haystack);

            return true;
        }

        if (normalizedPattern == ControlPhraseCatalog.PrivateNetworking)
        {
            matches = ContainsAffirmativePhrase(haystack, ControlPhraseCatalog.PrivateNetworking);

            return true;
        }

        if (normalizedPattern == ControlPhraseCatalog.Encryption)
        {
            matches = ContainsAffirmativePhrase(haystack, ControlPhraseCatalog.Encryption);

            return true;
        }

        if (normalizedPattern is ControlPhraseCatalog.Security
            or ControlPhraseCatalog.Cost
            or ControlPhraseCatalog.Reliability)
        {
            matches = ContainsStandaloneToken(haystack, normalizedPattern);

            return true;
        }

        if (pattern.Contains(' ', StringComparison.Ordinal))
        {
            matches = ContainsAffirmativePhrase(haystack, pattern);

            return true;
        }

        matches = ContainsStandaloneToken(haystack, pattern);

        return true;
    }
}
