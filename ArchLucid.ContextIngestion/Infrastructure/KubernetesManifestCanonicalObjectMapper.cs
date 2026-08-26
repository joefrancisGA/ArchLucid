using System.Text.Json;

using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Parsing;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Maps Kubernetes API objects (JSON) to <see cref="CanonicalObject" /> rows.
/// </summary>
internal static class KubernetesManifestCanonicalObjectMapper
{
    internal static IReadOnlyList<CanonicalObject> MapDocuments(
        IReadOnlyList<JsonElement> documents,
        InfrastructureDeclarationReference declaration)
    {
        ArgumentNullException.ThrowIfNull(declaration);

        List<CanonicalObject> results = [];
        Dictionary<string, int> labelTotals = CountManifestLabelOccurrences(documents);
        Dictionary<string, int> labelSeen = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement document in documents)
        {
            if (document.ValueKind is not JsonValueKind.Object)
                continue;

            if (TryGetPropertyIgnoreCase(document, "kind", out JsonElement kindElement)
                && string.Equals(kindElement.GetString(), "List", StringComparison.OrdinalIgnoreCase)
                && TryGetPropertyIgnoreCase(document, "items", out JsonElement items)
                && items.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement item in items.EnumerateArray())
                    TryAddResource(item, declaration, results, labelTotals, labelSeen);

                continue;
            }

            TryAddResource(document, declaration, results, labelTotals, labelSeen);
        }

        return results;
    }

    private static Dictionary<string, int> CountManifestLabelOccurrences(IReadOnlyList<JsonElement> documents)
    {
        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement document in documents)
            CountManifestLabelOccurrences(document, counts);

        return counts;
    }

    private static void CountManifestLabelOccurrences(JsonElement document, Dictionary<string, int> counts)
    {
        if (document.ValueKind is not JsonValueKind.Object)
            return;

        if (TryGetPropertyIgnoreCase(document, "kind", out JsonElement kindElement)
            && string.Equals(kindElement.GetString(), "List", StringComparison.OrdinalIgnoreCase)
            && TryGetPropertyIgnoreCase(document, "items", out JsonElement items)
            && items.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement item in items.EnumerateArray())
                IncrementManifestLabelCount(item, counts);

            return;
        }

        IncrementManifestLabelCount(document, counts);
    }

    private static void IncrementManifestLabelCount(JsonElement resource, Dictionary<string, int> counts)
    {
        if (!TryGetPropertyIgnoreCase(resource, "kind", out JsonElement kindElement) || kindElement.ValueKind is not JsonValueKind.String)
            return;

        string kind = (kindElement.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(kind))
            return;

        string namespaceValue = ReadMetadataString(resource, "metadata", "namespace") ?? string.Empty;
        string name = ReadMetadataString(resource, "metadata", "name") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
            return;

        string canonicalName = string.IsNullOrWhiteSpace(namespaceValue)
            ? name.ToLowerInvariant()
            : $"{namespaceValue.ToLowerInvariant()}/{name.ToLowerInvariant()}";

        string labelKey = $"{kind.ToLowerInvariant()}|{canonicalName}";
        counts[labelKey] = counts.GetValueOrDefault(labelKey) + 1;
    }

    private static void TryAddResource(
        JsonElement resource,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        IReadOnlyDictionary<string, int> labelTotals,
        Dictionary<string, int> labelSeen)
    {
        if (!TryGetPropertyIgnoreCase(resource, "kind", out JsonElement kindElement) || kindElement.ValueKind is not JsonValueKind.String)
            return;

        string kind = (kindElement.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(kind))
            return;

        string apiVersion = ReadTopLevelString(resource, "apiVersion") ?? string.Empty;
        string namespaceValue = ReadMetadataString(resource, "metadata", "namespace") ?? string.Empty;
        string name = ReadMetadataString(resource, "metadata", "name") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
            return;

        string canonicalName = string.IsNullOrWhiteSpace(namespaceValue)
            ? name.ToLowerInvariant()
            : $"{namespaceValue.ToLowerInvariant()}/{name.ToLowerInvariant()}";

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["k8s.kind"] = kind.ToLowerInvariant(),
            ["k8s.apiVersion"] = apiVersion.ToLowerInvariant(),
            ["k8s.name"] = name.ToLowerInvariant(),
        };

        if (!string.IsNullOrWhiteSpace(namespaceValue))
            properties["k8s.namespace"] = namespaceValue.ToLowerInvariant();

        string objectType = ResolveObjectType(kind);
        string labelKey = $"{kind.ToLowerInvariant()}|{canonicalName}";
        int occurrence = labelSeen.GetValueOrDefault(labelKey) + 1;
        labelSeen[labelKey] = occurrence;

        string stableIdentity = labelTotals.TryGetValue(labelKey, out int total) && total > 1
            ? $"{labelKey}|occurrence:{occurrence}"
            : labelKey;

        if (labelTotals.TryGetValue(labelKey, out int duplicateTotal) && duplicateTotal > 1)
            properties["k8sOccurrence"] = occurrence.ToString(System.Globalization.CultureInfo.InvariantCulture);

        string stableObjectId = BuildStableObjectId(objectType, declaration, stableIdentity);

        if (string.Equals(kind, "Secret", StringComparison.OrdinalIgnoreCase))
        {
            properties["status"] = "declared";

            results.Add(new CanonicalObject
            {
                ObjectId = stableObjectId,
                ObjectType = objectType,
                Name = canonicalName,
                SourceType = "InfrastructureDeclaration",
                SourceId = declaration.DeclarationId,
                Properties = properties
            });

            return;
        }

        results.Add(new CanonicalObject
        {
            ObjectId = stableObjectId,
            ObjectType = objectType,
            Name = canonicalName,
            SourceType = "InfrastructureDeclaration",
            SourceId = declaration.DeclarationId,
            Properties = properties
        });
    }

    private static string BuildStableObjectId(
        string objectType,
        InfrastructureDeclarationReference declaration,
        string stableIdentity)
    {
        return InfrastructureDeclarationStableObjectIds.ForDeclaredResource(
            declaration.DeclarationId,
            objectType,
            stableIdentity);
    }

    private static string ResolveObjectType(string kind)
    {
        return kind.ToLowerInvariant() switch
        {
            "networkpolicy" or "role" or "clusterrole" or "rolebinding" or "clusterrolebinding"
                or "serviceaccount" or "ingress" or "secret" => "SecurityBaseline",
            _ => "TopologyResource",
        };
    }

    private static string? ReadTopLevelString(JsonElement resource, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(resource, propertyName, out JsonElement value) || value.ValueKind is not JsonValueKind.String)
            return null;

        string? text = value.GetString();

        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }

    private static string? ReadMetadataString(JsonElement resource, string objectName, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(resource, objectName, out JsonElement objectElement) || objectElement.ValueKind is not JsonValueKind.Object)
            return null;

        if (!TryGetPropertyIgnoreCase(objectElement, propertyName, out JsonElement value) || value.ValueKind is not JsonValueKind.String)
            return null;

        string? text = value.GetString();

        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.TryGetProperty(propertyName, out value))
            return true;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
