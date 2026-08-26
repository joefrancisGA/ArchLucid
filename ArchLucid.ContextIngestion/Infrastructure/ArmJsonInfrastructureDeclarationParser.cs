using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses ARM template JSON (<c>resources</c> array) into canonical objects.
/// </summary>
public sealed class ArmJsonInfrastructureDeclarationParser(
    ILogger<ArmJsonInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "arm-json", StringComparison.OrdinalIgnoreCase);
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

            if (!TryGetPropertyIgnoreCase(root, "resources", out JsonElement resources)
                || resources.ValueKind is not JsonValueKind.Array)
                return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

            List<CanonicalObject> results = [];

            foreach (JsonElement resource in resources.EnumerateArray())
                TryAddResource(resource, declaration, results, parentNamePrefix: null);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(
                ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as arm-json; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }
    }

    private static void TryAddResource(
        JsonElement resource,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        string? parentNamePrefix)
    {
        if (!TryGetPropertyIgnoreCase(resource, "type", out JsonElement typeElement) || typeElement.ValueKind is not JsonValueKind.String)
            return;

        string resourceType = (typeElement.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(resourceType))
            return;

        if (resourceType.Equals("Microsoft.Resources/deployments", StringComparison.OrdinalIgnoreCase))
            return;

        if (!TryGetPropertyIgnoreCase(resource, "name", out JsonElement nameElement))
            return;

        string name = ReadName(nameElement);

        if (!string.IsNullOrWhiteSpace(parentNamePrefix)
            && !string.IsNullOrWhiteSpace(name)
            && !name.Contains('/', StringComparison.Ordinal))
            name = $"{parentNamePrefix}/{name}";

        if (string.IsNullOrWhiteSpace(name))
            return;

        string objectType = ResolveObjectType(resourceType);

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["resourceType"] = resourceType.ToLowerInvariant(),
        };

        if (TryGetPropertyIgnoreCase(resource, "properties", out JsonElement resourceProperties)
            && resourceProperties.ValueKind is JsonValueKind.Object)
            CopyBoundedProperties(resourceProperties, properties);

        string canonicalName = name.ToLowerInvariant();
        string canonicalResourceType = resourceType.ToLowerInvariant();
        string resourceIdentity = InfrastructureDeclarationResourceIdentity.AppendSubtypeRegionDisambiguators(
            $"{canonicalResourceType}|{canonicalName}",
            properties);

        results.Add(new CanonicalObject
        {
            ObjectId = InfrastructureDeclarationStableObjectIds.ForDeclaredResource(
                declaration.DeclarationId,
                objectType,
                resourceIdentity),
            ObjectType = objectType,
            Name = canonicalName,
            SourceType = "InfrastructureDeclaration",
            SourceId = declaration.DeclarationId,
            Properties = properties
        });

        if (!TryGetPropertyIgnoreCase(resource, "resources", out JsonElement childResources)
            || childResources.ValueKind is not JsonValueKind.Array)
            return;

        foreach (JsonElement childResource in childResources.EnumerateArray())
            TryAddResource(childResource, declaration, results, parentNamePrefix: name);
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

    private static void CopyBoundedProperties(JsonElement propertiesObject, Dictionary<string, string> properties)
    {
        foreach (IGrouping<string, JsonProperty> propertyGroup in propertiesObject.EnumerateObject()
                     .GroupBy(static property => property.Name, StringComparer.OrdinalIgnoreCase))
        {
            JsonProperty property = propertyGroup.First();

            if (CanonicalInfrastructurePropertyBag.CountTfProperties(properties) >= CanonicalInfrastructurePropertyBag.MaxTfPropertyCount)
                break;

            if (property.Value.ValueKind is JsonValueKind.Array or JsonValueKind.Object)
            {
                CanonicalInfrastructurePropertyBag.TryAddTfJsonProperty(properties, property.Name, property.Value);
                continue;
            }

            if (property.Value.ValueKind is not (JsonValueKind.String or JsonValueKind.True or JsonValueKind.False or JsonValueKind.Number))
                continue;

            string valueText = property.Value.ValueKind switch
            {
                JsonValueKind.String => property.Value.GetString() ?? string.Empty,
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                JsonValueKind.Number => CanonicalInfrastructurePropertyBag.CanonicalizeNumberText(property.Value),
                _ => string.Empty,
            };

            CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, property.Name, valueText);
        }
    }

    private static string ResolveObjectType(string resourceType)
    {
        string normalized = resourceType.ToLowerInvariant();

        if (normalized.Contains("keyvault", StringComparison.Ordinal)
            || normalized.Contains("firewall", StringComparison.Ordinal)
            || normalized.Contains("networksecuritygroups", StringComparison.Ordinal))
            return "SecurityBaseline";

        if (normalized.Contains("policydefinitions", StringComparison.Ordinal)
            || normalized.Contains("policyassignments", StringComparison.Ordinal))
            return "PolicyControl";

        return "TopologyResource";
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
