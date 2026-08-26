using ArchLucid.Core.Findings;
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
    public const string WorkloadIsolationConflictKind = "workload-isolation-conflict";

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

    private static readonly string[] WorkloadIsolationIntentPhrases =
    [
        "restricted workload",
        "no privileged",
        "pod security",
        "restricted pss",
        "restricted pod security",
        "non-root",
        "run as non-root",
        "host network",
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
                    Theme = baselineSignal.Theme,
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
            "workload-isolation" => WorkloadIsolationConflictKind,
            "network-isolation" when TryGetK8sProperty(properties, "hostNetwork", out _) => WorkloadIsolationConflictKind,
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
            WorkloadIsolationConflictKind => ContainsAnyPhrase(normalized, WorkloadIsolationIntentPhrases),
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
            if (DeclarationSecurityPropertyKeyResolver.TryGet(
                    properties,
                    DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                    out propertyKey,
                    out propertyValue))
                return true;

            if (DeclarationSecurityPropertyKeyResolver.TryGet(
                    properties,
                    DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess,
                    out propertyKey,
                    out propertyValue))
                return true;

            return false;
        }

        if (conflictKind == HttpsTlsConflictKind)
        {
            if (DeclarationSecurityPropertyKeyResolver.TryGet(
                    properties,
                    DeclarationSecurityPropertyLogicalNames.HttpsOnly,
                    out propertyKey,
                    out propertyValue))
                return true;

            if (DeclarationSecurityPropertyKeyResolver.TryGet(
                    properties,
                    DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion,
                    out propertyKey,
                    out propertyValue))
                return true;

            if (DeclarationSecurityPropertyKeyResolver.TryGet(
                    properties,
                    DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled,
                    out propertyKey,
                    out propertyValue))
                return true;

            return false;
        }

        if (conflictKind == AdminIngressConflictKind)
        {
            return DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.IngressBlob,
                out propertyKey,
                out propertyValue);
        }

        if (conflictKind == WorkloadIsolationConflictKind)
        {
            if (TryGetK8sProperty(properties, "privileged", out propertyValue))
            {
                propertyKey = "k8s.privileged";
                return true;
            }

            if (TryGetK8sProperty(properties, "hostNetwork", out propertyValue))
            {
                propertyKey = "k8s.hostNetwork";
                return true;
            }

            if (TryGetK8sProperty(properties, "allowPrivilegeEscalation", out propertyValue))
            {
                propertyKey = "k8s.allowPrivilegeEscalation";
                return true;
            }
        }

        return false;
    }

    private static bool HasPublicNetworkProperty(IReadOnlyDictionary<string, string> properties) =>
        DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            out _,
            out _)
        || DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess,
            out _,
            out _);

    private static bool HasWeakTlsProperty(IReadOnlyDictionary<string, string> properties) =>
        DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.HttpsOnly,
            out _,
            out _)
        || DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion,
            out _,
            out _)
        || DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled,
            out _,
            out _);

    private static bool TryGetK8sProperty(
        IReadOnlyDictionary<string, string> properties,
        string keySuffix,
        out string? value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (!string.Equals(entry.Key, $"k8s.{keySuffix}", StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(entry.Value))
                continue;

            value = entry.Value.Trim();

            return true;
        }

        value = null;

        return false;
    }

    private static bool ContainsAnyPhrase(string normalizedIntentText, IReadOnlyList<string> phrases)
    {
        foreach (string phrase in phrases)
        {
            if (normalizedIntentText.Contains(phrase, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
