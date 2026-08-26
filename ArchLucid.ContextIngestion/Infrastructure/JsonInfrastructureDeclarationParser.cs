using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

public class JsonInfrastructureDeclarationParser(ILogger<JsonInfrastructureDeclarationParser> logger)
    : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "json", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        try
        {
            using JsonDocument document = JsonDocument.Parse(declaration.Content);
            JsonElement root = document.RootElement;

            List<CanonicalObject> results = [];

            if (root.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement resource in root.EnumerateArray())
                    TryAddResource(resource, declaration, results);
            }
            else if (TryGetPropertyIgnoreCase(root, "resources", out JsonElement resources)
                     && resources.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement resource in resources.EnumerateArray())
                    TryAddResource(resource, declaration, results);
            }

            return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as JSON; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }
    }

    private static void TryAddResource(
        JsonElement resource,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results)
    {
        if (!TryGetPropertyIgnoreCase(resource, "type", out JsonElement typeElement)
            || typeElement.ValueKind is not JsonValueKind.String)
            return;

        if (!TryGetPropertyIgnoreCase(resource, "name", out JsonElement nameElement))
            return;

        string type = (typeElement.GetString() ?? string.Empty).Trim();
        string name = ReadName(nameElement);

        if (string.IsNullOrWhiteSpace(type) || string.IsNullOrWhiteSpace(name))
            return;

        string objectType = ResolveObjectType(type);

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

        if (TryGetPropertyIgnoreCase(resource, "properties", out JsonElement resourceProperties)
            && resourceProperties.ValueKind is JsonValueKind.Object)
            CopyCustomProperties(resourceProperties, properties);

        if (TryGetPropertyIgnoreCase(resource, "subtype", out JsonElement subtypeElement)
            && subtypeElement.ValueKind is JsonValueKind.String)
        {
            string? subtype = subtypeElement.GetString();

            if (!string.IsNullOrWhiteSpace(subtype))
                properties["subtype"] = subtype.Trim().ToLowerInvariant();
        }

        if (TryGetPropertyIgnoreCase(resource, "region", out JsonElement regionElement)
            && regionElement.ValueKind is JsonValueKind.String)
        {
            string? region = regionElement.GetString();

            if (!string.IsNullOrWhiteSpace(region))
                properties["region"] = region.Trim().ToLowerInvariant();
        }

        properties["resourceType"] = type.Trim().ToLowerInvariant();

        string canonicalName = name.ToLowerInvariant();
        string canonicalResourceType = type.Trim().ToLowerInvariant();

        results.Add(new CanonicalObject
        {
            ObjectId = InfrastructureDeclarationStableObjectIds.ForDeclaredResource(
                declaration.DeclarationId,
                objectType,
                InfrastructureDeclarationResourceIdentity.ForJsonResource(
                    canonicalResourceType,
                    canonicalName,
                    properties)),
            ObjectType = objectType,
            Name = canonicalName,
            SourceType = "InfrastructureDeclaration",
            SourceId = declaration.DeclarationId,
            Properties = properties
        });
    }

    private static string ReadName(JsonElement nameElement)
    {
        if (nameElement.ValueKind is JsonValueKind.String)
            return (nameElement.GetString() ?? string.Empty).Trim();

        if (nameElement.ValueKind is JsonValueKind.Array)
        {
            List<string> segments = [];

            foreach (JsonElement segment in nameElement.EnumerateArray())
            {
                if (segment.ValueKind is not JsonValueKind.String)
                    continue;

                string trimmed = (segment.GetString() ?? string.Empty).Trim();

                if (!string.IsNullOrWhiteSpace(trimmed))
                    segments.Add(trimmed);
            }

            if (segments.Count > 0)
                return string.Join('/', segments);
        }

        return nameElement.GetRawText().Trim();
    }

    private static void CopyCustomProperties(JsonElement propertiesObject, Dictionary<string, string> properties)
    {
        foreach (JsonProperty property in propertiesObject.EnumerateObject())
        {
            string canonicalKey = property.Name.Trim().ToLowerInvariant();
            string? valueText = ReadScalarPropertyText(property.Value);

            if (string.IsNullOrWhiteSpace(valueText))
                continue;

            properties[canonicalKey] = valueText.Trim().ToLowerInvariant();
        }
    }

    private static string? ReadScalarPropertyText(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => CanonicalInfrastructurePropertyBag.CanonicalizeNumberText(value),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => null,
        };
    }

    private static string ResolveObjectType(string type)
    {
        return type.ToLowerInvariant() switch
        {
            "network" => "TopologyResource",
            "subnet" => "TopologyResource",
            "vnet" => "TopologyResource",
            "storage" => "TopologyResource",
            "compute" => "TopologyResource",
            "appservice" => "TopologyResource",
            "container" => "TopologyResource",
            "database" => "TopologyResource",
            "identity" => "TopologyResource",
            "keyvault" => "SecurityBaseline",
            "firewall" => "SecurityBaseline",
            "nsg" => "SecurityBaseline",
            "policy" => "PolicyControl",
            _ => "TopologyResource"
        };
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
