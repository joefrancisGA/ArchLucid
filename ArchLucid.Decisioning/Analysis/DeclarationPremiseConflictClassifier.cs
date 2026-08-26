using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Detects contradictions between ingested declaration properties and linked security or policy intent nodes.
/// </summary>
public static class DeclarationPremiseConflictClassifier
{
    public const string PrivateNetworkConflictKind = "private-network-conflict";
    public const string HttpsTlsConflictKind = "https-tls-conflict";
    public const string AdminIngressConflictKind = "admin-ingress-conflict";

    private static readonly string[] PrivateNetworkIntentPhrases =
    [
        "private only",
        "private-only",
        "private endpoint",
        "private network",
        "no public access",
        "deny public",
        "disable public",
        "block public",
        "public access disabled",
        "private link",
    ];

    private static readonly string[] HttpsTlsIntentPhrases =
    [
        "https only",
        "https-only",
        "encryption in transit",
        "tls 1.2",
        "tls1.2",
        "minimum tls",
        "require https",
        "ssl enforcement",
    ];

    private static readonly string[] AdminIngressIntentPhrases =
    [
        "restricted ingress",
        "restrict administrative",
        "admin ingress",
        "no ssh",
        "block ssh",
        "no rdp",
        "block rdp",
        "administrative access",
        "deny internet ssh",
    ];

    public static IReadOnlyList<DeclarationPremiseConflictSignal> Classify(
        GraphNode topologyNode,
        IReadOnlyList<ApplicableIntentNode> applicableIntentNodes)
    {
        ArgumentNullException.ThrowIfNull(topologyNode);
        ArgumentNullException.ThrowIfNull(applicableIntentNodes);

        if (applicableIntentNodes.Count == 0)
            return [];

        string resourceLabel = string.IsNullOrWhiteSpace(topologyNode.Label)
            ? topologyNode.NodeId
            : topologyNode.Label;

        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> baselineSignals =
            DeclarationSecurityBaselineClassifier.Classify(resourceLabel, topologyNode.Properties);

        if (baselineSignals.Count == 0)
            return [];

        List<DeclarationPremiseConflictSignal> signals = [];
        HashSet<string> dedupe = new(StringComparer.OrdinalIgnoreCase);

        foreach (DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal baselineSignal in baselineSignals)
        {
            string? conflictKind = MapThemeToConflictKind(baselineSignal.Theme, topologyNode.Properties);

            if (conflictKind is null
                || !TryGetDeclarationProperty(conflictKind, topologyNode.Properties, out string? propertyKey, out string? propertyValue))
                continue;

            foreach (ApplicableIntentNode applicableIntent in applicableIntentNodes)
            {
                string intentText = ExtractIntentRequirementText(applicableIntent.IntentNode);

                if (!IntentMatchesConflictKind(conflictKind, intentText))
                    continue;

                string dedupeKey = $"{conflictKind}|{applicableIntent.IntentNode.NodeId}|{propertyKey}";

                if (!dedupe.Add(dedupeKey))
                    continue;

                signals.Add(new DeclarationPremiseConflictSignal
                {
                    ConflictKind = conflictKind,
                    DeclarationPropertyKey = propertyKey!,
                    DeclarationPropertyValue = propertyValue!,
                    IntentNodeId = applicableIntent.IntentNode.NodeId,
                    IntentRequirementText = intentText,
                    IsNarrowApplicability = applicableIntent.IsNarrowApplicability,
                });
            }
        }

        return signals;
    }

    private static string? MapThemeToConflictKind(
        string theme,
        IReadOnlyDictionary<string, string> properties)
    {
        return theme switch
        {
            "data-protection" => PrivateNetworkConflictKind,
            "transport-security" => HttpsTlsConflictKind,
            "network-isolation" => AdminIngressConflictKind,
            "encryption" when HasPublicNetworkProperty(properties) => PrivateNetworkConflictKind,
            "encryption" when HasWeakTlsProperty(properties) => HttpsTlsConflictKind,
            _ => null,
        };
    }

    private static bool IntentMatchesConflictKind(string conflictKind, string intentText)
    {
        if (string.IsNullOrWhiteSpace(intentText))
            return false;

        string normalized = intentText.ToLowerInvariant();

        return conflictKind switch
        {
            PrivateNetworkConflictKind => ContainsAnyPhrase(normalized, PrivateNetworkIntentPhrases),
            HttpsTlsConflictKind => ContainsAnyPhrase(normalized, HttpsTlsIntentPhrases),
            AdminIngressConflictKind => ContainsAnyPhrase(normalized, AdminIngressIntentPhrases),
            _ => false,
        };
    }

    private static string ExtractIntentRequirementText(GraphNode intentNode)
    {
        List<string> parts = [];

        if (!string.IsNullOrWhiteSpace(intentNode.Label))
            parts.Add(intentNode.Label.Trim());

        foreach (string key in new[] { "description", "requirement", "controlText", "text", "reference", "controlId" })
        {
            if (intentNode.Properties.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
                parts.Add(value.Trim());
        }

        return string.Join(" — ", parts.Distinct(StringComparer.OrdinalIgnoreCase));
    }

    private static bool TryGetDeclarationProperty(
        string conflictKind,
        IReadOnlyDictionary<string, string> properties,
        out string? propertyKey,
        out string? propertyValue)
    {
        propertyKey = null;
        propertyValue = null;

        if (conflictKind == PrivateNetworkConflictKind)
        {
            if (TryGetProperty(properties, "tf.public_network_access", out propertyValue))
            {
                propertyKey = "tf.public_network_access";
                return true;
            }

            if (TryGetProperty(properties, "publicNetworkAccess", out propertyValue))
            {
                propertyKey = "publicNetworkAccess";
                return true;
            }

            if (TryGetProperty(properties, "tf.allow_blob_public_access", out propertyValue))
            {
                propertyKey = "tf.allow_blob_public_access";
                return true;
            }

            if (TryGetProperty(properties, "allowBlobPublicAccess", out propertyValue))
            {
                propertyKey = "allowBlobPublicAccess";
                return true;
            }

            return false;
        }

        if (conflictKind == HttpsTlsConflictKind)
        {
            if (TryGetProperty(properties, "tf.https_only", out propertyValue))
            {
                propertyKey = "tf.https_only";
                return true;
            }

            if (TryGetProperty(properties, "httpsOnly", out propertyValue))
            {
                propertyKey = "httpsOnly";
                return true;
            }

            if (TryGetProperty(properties, "tf.minimum_tls_version", out propertyValue))
            {
                propertyKey = "tf.minimum_tls_version";
                return true;
            }

            if (TryGetProperty(properties, "tf.ssl_enforcement_enabled", out propertyValue))
            {
                propertyKey = "tf.ssl_enforcement_enabled";
                return true;
            }

            return false;
        }

        if (conflictKind == AdminIngressConflictKind)
        {
            if (TryGetProperty(properties, "tf.ingress", out propertyValue))
            {
                propertyKey = "tf.ingress";
                return true;
            }

            if (TryGetProperty(properties, "tf.network_rules", out propertyValue))
            {
                propertyKey = "tf.network_rules";
                return true;
            }
        }

        return false;
    }

    private static bool HasPublicNetworkProperty(IReadOnlyDictionary<string, string> properties) =>
        TryGetProperty(properties, "tf.public_network_access", out _)
        || TryGetProperty(properties, "publicNetworkAccess", out _)
        || TryGetProperty(properties, "tf.allow_blob_public_access", out _)
        || TryGetProperty(properties, "allowBlobPublicAccess", out _);

    private static bool HasWeakTlsProperty(IReadOnlyDictionary<string, string> properties) =>
        TryGetProperty(properties, "tf.https_only", out _)
        || TryGetProperty(properties, "httpsOnly", out _)
        || TryGetProperty(properties, "tf.minimum_tls_version", out _)
        || TryGetProperty(properties, "tf.ssl_enforcement_enabled", out _);

    private static bool ContainsAnyPhrase(string normalizedIntentText, IReadOnlyList<string> phrases)
    {
        foreach (string phrase in phrases)
        {
            if (normalizedIntentText.Contains(phrase, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static bool TryGetProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        if (properties.TryGetValue(key, out string? directValue) && !string.IsNullOrWhiteSpace(directValue))
        {
            value = directValue.Trim();
            return true;
        }

        value = null;
        return false;
    }
}
