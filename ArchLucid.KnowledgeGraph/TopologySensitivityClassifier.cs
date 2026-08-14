namespace ArchLucid.KnowledgeGraph;

/// <summary>
///     Classifies topology resources for security-baseline scoping (TB-2208).
/// </summary>
public static class TopologySensitivityClassifier
{
    public static string Classify(
        string resourceName,
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (properties.TryGetValue(CanonicalGraphPropertyKeys.TopologySensitivity, out string? existing)
            && !string.IsNullOrWhiteSpace(existing))
        {
            return existing.Trim();
        }

        string category = properties.TryGetValue("category", out string? categoryRaw)
            ? categoryRaw
            : string.Empty;

        if (string.Equals(category, GraphTopologyCategories.Identity, StringComparison.OrdinalIgnoreCase))
            return TopologySensitivityLevels.Identity;

        if (string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
            || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase))
        {
            return TopologySensitivityLevels.DataBearing;
        }

        if (IsPublicEdgeResource(resourceName, properties))
            return TopologySensitivityLevels.PublicEdge;

        return TopologySensitivityLevels.Internal;
    }

    public static string ClassifyBaselineScope(string? controlId, string? baselineName)
    {
        string combined = $"{controlId} {baselineName}".ToLowerInvariant();

        if (ContainsAny(combined, "identity", "entra", "oauth", "sso", "mfa", "authentication", "authorization"))
            return TopologySensitivityLevels.Identity;

        if (ContainsAny(combined, "encrypt", "data", "storage", "database", "sql", "backup", "retention", "pii", "phi"))
            return TopologySensitivityLevels.DataBearing;

        if (ContainsAny(combined, "network", "endpoint", "firewall", "public", "ingress", "ip rule", "waf"))
            return TopologySensitivityLevels.PublicEdge;

        return TopologySensitivityLevels.Internal;
    }

    private static bool IsPublicEdgeResource(string resourceName, IReadOnlyDictionary<string, string> properties)
    {
        if (properties.TryGetValue("publicNetworkAccess", out string? publicAccess)
            && IsTruthy(publicAccess))
        {
            return true;
        }

        string resourceType = properties.TryGetValue("resourceType", out string? type)
            ? type.ToLowerInvariant()
            : string.Empty;

        if (resourceType.Contains("microsoft.web/sites", StringComparison.Ordinal)
            || resourceType.Contains("frontdoor", StringComparison.Ordinal)
            || resourceType.Contains("applicationgateway", StringComparison.Ordinal)
            || resourceType.Contains("publicip", StringComparison.Ordinal))
        {
            return true;
        }

        string name = resourceName.ToLowerInvariant();

        return name.Contains("gateway", StringComparison.Ordinal)
               || name.Contains("front-door", StringComparison.Ordinal)
               || name.Contains("public", StringComparison.Ordinal);
    }

    private static bool IsTruthy(string value) =>
        string.Equals(value, "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "1", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "enabled", StringComparison.OrdinalIgnoreCase);

    private static bool ContainsAny(string haystack, params string[] keywords)
    {
        foreach (string keyword in keywords)
        {
            if (haystack.Contains(keyword, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
