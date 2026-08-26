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

            if (!root.TryGetProperty("resources", out JsonElement resources) || resources.ValueKind is not JsonValueKind.Array)
                return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

            List<CanonicalObject> results = [];

            foreach (JsonElement resource in resources.EnumerateArray())
                TryAddResource(resource, declaration, results);

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
        List<CanonicalObject> results)
    {
        if (!resource.TryGetProperty("type", out JsonElement typeElement) || typeElement.ValueKind is not JsonValueKind.String)
            return;

        string resourceType = (typeElement.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(resourceType))
            return;

        if (resourceType.Equals("Microsoft.Resources/deployments", StringComparison.OrdinalIgnoreCase))
            return;

        if (!resource.TryGetProperty("name", out JsonElement nameElement))
            return;

        string name = ReadName(nameElement);

        if (string.IsNullOrWhiteSpace(name))
            return;

        string objectType = ResolveObjectType(resourceType);

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["resourceType"] = resourceType.ToLowerInvariant(),
        };

        if (resource.TryGetProperty("properties", out JsonElement resourceProperties)
            && resourceProperties.ValueKind is JsonValueKind.Object)
            CopyBoundedProperties(resourceProperties, properties);

        results.Add(new CanonicalObject
        {
            ObjectType = objectType,
            Name = name.ToLowerInvariant(),
            SourceType = "InfrastructureDeclaration",
            SourceId = declaration.DeclarationId,
            Properties = properties
        });
    }

    private static string ReadName(JsonElement nameElement)
    {
        if (nameElement.ValueKind is JsonValueKind.String)
            return (nameElement.GetString() ?? string.Empty).Trim();

        if (nameElement.ValueKind is JsonValueKind.Array && nameElement.GetArrayLength() > 0)
        {
            JsonElement first = nameElement[0];

            if (first.ValueKind is JsonValueKind.String)
                return (first.GetString() ?? string.Empty).Trim();
        }

        return nameElement.GetRawText().Trim();
    }

    private static void CopyBoundedProperties(JsonElement propertiesObject, Dictionary<string, string> properties)
    {
        foreach (JsonProperty property in propertiesObject.EnumerateObject())
        {
            if (CanonicalInfrastructurePropertyBag.CountTfProperties(properties) >= CanonicalInfrastructurePropertyBag.MaxTfPropertyCount)
                break;

            if (property.Value.ValueKind is not (JsonValueKind.String or JsonValueKind.True or JsonValueKind.False or JsonValueKind.Number))
                continue;

            string valueText = property.Value.ValueKind switch
            {
                JsonValueKind.String => property.Value.GetString() ?? string.Empty,
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                JsonValueKind.Number => property.Value.GetRawText(),
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
}
