using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Indexes in-batch ARM JSON linked templates referenced by <c>properties.templateLink</c>.
/// </summary>
internal static class ArmJsonLinkedTemplateBatchIndex
{
    internal static HashSet<string> CollectReferencedTemplateLinkPaths(
        IEnumerable<InfrastructureDeclarationReference> declarations,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath)
    {
        HashSet<string> referenced = new(StringComparer.OrdinalIgnoreCase);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (!IsArmJson(declaration))
                continue;

            if (string.IsNullOrWhiteSpace(declaration.Content))
                continue;

            foreach (string templateLinkPath in ExtractTemplateLinkPaths(declaration.Content))
            {
                if (IsRemoteUri(templateLinkPath))
                    continue;

                if (InfrastructureDeclarationBatchPathIndex.TryResolve(
                        templateLinkPath,
                        declaration.Name,
                        batchByPath,
                        out InfrastructureDeclarationReference linkedDeclaration))
                {
                    referenced.Add(
                        InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(linkedDeclaration.Name));
                }
            }
        }

        return referenced;
    }

    internal static IEnumerable<string> ExtractTemplateLinkPaths(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(content);

            if (!TryGetPropertyIgnoreCase(document.RootElement, "resources", out JsonElement resources)
                || resources.ValueKind is not JsonValueKind.Array)
                return [];

            List<string> paths = [];

            foreach (JsonElement resource in resources.EnumerateArray())
                paths.AddRange(ExtractTemplateLinkPathsFromResource(resource));

            return paths;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static IEnumerable<string> ExtractTemplateLinkPathsFromResource(JsonElement resource)
    {
        if (!TryGetPropertyIgnoreCase(resource, "type", out JsonElement typeElement)
            || typeElement.ValueKind is not JsonValueKind.String)
            yield break;

        string resourceType = (typeElement.GetString() ?? string.Empty).Trim();

        if (!resourceType.Equals("Microsoft.Resources/deployments", StringComparison.OrdinalIgnoreCase))
            yield break;

        if (!TryGetPropertyIgnoreCase(resource, "properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object)
            yield break;

        if (!TryGetPropertyIgnoreCase(properties, "templateLink", out JsonElement templateLink)
            || templateLink.ValueKind is not JsonValueKind.Object)
            yield break;

        if (TryGetPropertyIgnoreCase(templateLink, "relativePath", out JsonElement relativePathElement)
            && relativePathElement.ValueKind is JsonValueKind.String)
        {
            string relativePath = (relativePathElement.GetString() ?? string.Empty).Trim();

            if (!string.IsNullOrWhiteSpace(relativePath))
                yield return relativePath;
        }

        if (TryGetPropertyIgnoreCase(templateLink, "uri", out JsonElement uriElement)
            && uriElement.ValueKind is JsonValueKind.String)
        {
            string uri = (uriElement.GetString() ?? string.Empty).Trim();

            if (!string.IsNullOrWhiteSpace(uri))
                yield return uri;
        }
    }

    internal static bool IsRemoteUri(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return false;

        return path.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool IsArmJson(InfrastructureDeclarationReference declaration)
    {
        return string.Equals(declaration.Format?.Trim(), "arm-json", StringComparison.OrdinalIgnoreCase);
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
