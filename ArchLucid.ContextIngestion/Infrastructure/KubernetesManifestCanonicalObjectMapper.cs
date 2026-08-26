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

        foreach (JsonElement document in documents)
        {
            if (document.ValueKind is not JsonValueKind.Object)
                continue;

            if (document.TryGetProperty("kind", out JsonElement kindElement)
                && string.Equals(kindElement.GetString(), "List", StringComparison.OrdinalIgnoreCase)
                && document.TryGetProperty("items", out JsonElement items)
                && items.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement item in items.EnumerateArray())
                    TryAddResource(item, declaration, results);

                continue;
            }

            TryAddResource(document, declaration, results);
        }

        return results;
    }

    private static void TryAddResource(
        JsonElement resource,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results)
    {
        if (!resource.TryGetProperty("kind", out JsonElement kindElement) || kindElement.ValueKind is not JsonValueKind.String)
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
        string stableObjectId = BuildStableObjectId(objectType, declaration, kind, canonicalName);

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
        string kind,
        string canonicalName)
    {
        return ContextIngestionStableLineNames.StableObjectId(
            objectType,
            $"{declaration.DeclarationId}|{kind.ToLowerInvariant()}|{canonicalName}");
    }

    private static string ResolveObjectType(string kind)
    {
        return kind switch
        {
            "NetworkPolicy" or "Role" or "ClusterRole" or "RoleBinding" or "ClusterRoleBinding"
                or "ServiceAccount" or "Ingress" or "Secret" => "SecurityBaseline",
            _ => "TopologyResource",
        };
    }

    private static string? ReadTopLevelString(JsonElement resource, string propertyName)
    {
        if (!resource.TryGetProperty(propertyName, out JsonElement value) || value.ValueKind is not JsonValueKind.String)
            return null;

        string? text = value.GetString();

        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }

    private static string? ReadMetadataString(JsonElement resource, string objectName, string propertyName)
    {
        if (!resource.TryGetProperty(objectName, out JsonElement objectElement) || objectElement.ValueKind is not JsonValueKind.Object)
            return null;

        if (!objectElement.TryGetProperty(propertyName, out JsonElement value) || value.ValueKind is not JsonValueKind.String)
            return null;

        string? text = value.GetString();

        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }
}
