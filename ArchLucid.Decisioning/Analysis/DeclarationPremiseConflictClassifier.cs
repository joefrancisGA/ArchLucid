using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Detects contradictions between ingested declaration properties and linked security or policy intent nodes.
/// </summary>
public static partial class DeclarationPremiseConflictClassifier
{
    public const string PrivateNetworkConflictKind = "private-network-conflict";
    public const string HttpsTlsConflictKind = "https-tls-conflict";
    public const string AdminIngressConflictKind = "admin-ingress-conflict";
    public const string WorkloadIsolationConflictKind = "workload-isolation-conflict";

    private static readonly char[] NegationLookbackTrimChars = [',', ':', ';', '.', '(', ')'];

    public static IReadOnlyList<DeclarationPremiseConflictSignal> Classify(
        GraphNode topologyNode,
        IReadOnlyList<ApplicableIntentNode> applicableIntentNodes)
    {
        ArgumentNullException.ThrowIfNull(topologyNode);
        ArgumentNullException.ThrowIfNull(applicableIntentNodes);
        if (applicableIntentNodes.Count == 0) return [];

        string resourceLabel = string.IsNullOrWhiteSpace(topologyNode.Label) ? topologyNode.NodeId : topologyNode.Label;
        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> baselineSignals =
            DeclarationSecurityBaselineClassifier.Classify(resourceLabel, topologyNode.Properties);
        if (baselineSignals.Count == 0) return [];

        List<DeclarationPremiseConflictSignal> signals = [];
        HashSet<string> dedupe = new(StringComparer.OrdinalIgnoreCase);
        foreach (DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal baselineSignal in baselineSignals)
        {
            string? conflictKind = MapThemeToConflictKind(baselineSignal.Theme, topologyNode.Properties);
            if (conflictKind is null || !TryGetDeclarationProperty(conflictKind, topologyNode.Properties, out string? propertyKey, out string? propertyValue))
                continue;
            foreach (ApplicableIntentNode applicableIntent in applicableIntentNodes)
            {
                string intentText = ExtractIntentRequirementText(applicableIntent.IntentNode);
                if (!IntentMatchesConflictKind(conflictKind, intentText)) continue;
                string dedupeKey = $"{conflictKind}|{applicableIntent.IntentNode.NodeId}|{propertyKey}";
                if (!dedupe.Add(dedupeKey)) continue;
                signals.Add(new DeclarationPremiseConflictSignal
                {
                    Theme = baselineSignal.Theme, ConflictKind = conflictKind,
                    DeclarationPropertyKey = propertyKey!, DeclarationPropertyValue = propertyValue!,
                    IntentNodeId = applicableIntent.IntentNode.NodeId, IntentRequirementText = intentText,
                    IsNarrowApplicability = applicableIntent.IsNarrowApplicability,
                });
            }
        }
        return signals;
    }

    private static string? MapThemeToConflictKind(string theme, IReadOnlyDictionary<string, string> properties) =>
        theme switch
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

    private static bool IntentMatchesConflictKind(string conflictKind, string intentText)
    {
        if (string.IsNullOrWhiteSpace(intentText)) return false;
        string normalized = intentText.ToLowerInvariant();
        return conflictKind switch
        {
            PrivateNetworkConflictKind => PrivateNetworkIntentMatches(normalized),
            HttpsTlsConflictKind => HttpsTlsIntentMatches(normalized),
            AdminIngressConflictKind => AdminIngressIntentMatches(normalized),
            WorkloadIsolationConflictKind => WorkloadIsolationIntentMatches(normalized),
            _ => false,
        };
    }

    private static bool TryGetDeclarationProperty(string conflictKind, IReadOnlyDictionary<string, string> properties, out string? propertyKey, out string? propertyValue)
    {
        propertyKey = null; propertyValue = null;
        return conflictKind switch
        {
            PrivateNetworkConflictKind => TryGetPrivateNetworkDeclarationProperty(properties, out propertyKey, out propertyValue),
            HttpsTlsConflictKind => TryGetHttpsTlsDeclarationProperty(properties, out propertyKey, out propertyValue),
            AdminIngressConflictKind => TryGetAdminIngressDeclarationProperty(properties, out propertyKey, out propertyValue),
            WorkloadIsolationConflictKind => TryGetWorkloadIsolationDeclarationProperty(properties, out propertyKey, out propertyValue),
            _ => false,
        };
    }

    private static string ExtractIntentRequirementText(GraphNode intentNode)
    {
        List<string> parts = [];
        if (!string.IsNullOrWhiteSpace(intentNode.Label)) parts.Add(intentNode.Label.Trim());
        foreach (string key in new[] { "description", "requirement", "controlText", "text", "reference", "controlId" })
            if (intentNode.Properties.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
                parts.Add(value.Trim());
        return string.Join(" — ", parts.Distinct(StringComparer.OrdinalIgnoreCase));
    }

    private static bool TryGetK8sProperty(IReadOnlyDictionary<string, string> properties, string keySuffix, out string? value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (!string.Equals(entry.Key, $"k8s.{keySuffix}", StringComparison.OrdinalIgnoreCase)) continue;
            if (string.IsNullOrWhiteSpace(entry.Value)) continue;
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
            int searchStart = 0;
            while (searchStart <= normalizedIntentText.Length - phrase.Length)
            {
                int index = normalizedIntentText.IndexOf(phrase, searchStart, StringComparison.Ordinal);
                if (index < 0) break;
                if (!IsPhraseNegated(normalizedIntentText, index)) return true;
                searchStart = index + phrase.Length;
            }
        }
        return false;
    }

    private static bool IsPhraseNegated(string normalizedIntentText, int phraseStartIndex)
    {
        const int maxNegationLookback = 48;
        int windowStart = Math.Max(0, phraseStartIndex - maxNegationLookback);
        string prefix = normalizedIntentText[windowStart..phraseStartIndex].TrimEnd().TrimEnd(NegationLookbackTrimChars);
        if (prefix.Length == 0) return false;
        ReadOnlySpan<string> negationSuffixes = ["no requirement to","no need to","not required to","not obliged to","do not","don't","does not","doesn't","must not","mustn't","shall not","should not","shouldn't","will not","won't","cannot","can't","never","not"];
        foreach (string negationSuffix in negationSuffixes)
        {
            if (!prefix.EndsWith(negationSuffix, StringComparison.Ordinal)) continue;
            if (string.Equals(negationSuffix, "not", StringComparison.Ordinal) && !HasNegationWordBoundary(prefix, negationSuffix.Length)) continue;
            return true;
        }
        return false;
    }

    private static bool HasNegationWordBoundary(string prefix, int negationLength)
    {
        int boundaryIndex = prefix.Length - negationLength - 1;
        if (boundaryIndex < 0) return true;
        return !char.IsLetterOrDigit(prefix[boundaryIndex]);
    }
}
