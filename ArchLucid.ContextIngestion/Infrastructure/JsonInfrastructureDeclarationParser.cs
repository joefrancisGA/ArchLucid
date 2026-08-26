using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

public class JsonInfrastructureDeclarationParser(ILogger<JsonInfrastructureDeclarationParser> logger)
    : IInfrastructureDeclarationParser
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "json", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        IReadOnlyList<ResourceDeclarationItem> resources;

        try
        {
            resources = ParseResourceItems(declaration.Content);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as JSON; skipping.",
                declaration.Name,
                declaration.DeclarationId);
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        if (resources.Count == 0)
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        List<CanonicalObject> results = [];

        foreach (ResourceDeclarationItem resource in resources)
        {
            if (string.IsNullOrWhiteSpace(resource.Type) || string.IsNullOrWhiteSpace(resource.Name))
                continue;

            string objectType = ResolveObjectType(resource.Type);

            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

            foreach (KeyValuePair<string, string> property in resource.Properties)
            {
                if (string.IsNullOrWhiteSpace(property.Value))
                    continue;

                string canonicalKey = property.Key.Trim().ToLowerInvariant();
                properties[canonicalKey] = property.Value.Trim().ToLowerInvariant();
            }

            if (!string.IsNullOrWhiteSpace(resource.Subtype))
                properties["subtype"] = resource.Subtype!.Trim().ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(resource.Region))
                properties["region"] = resource.Region!.Trim().ToLowerInvariant();

            properties["resourceType"] = resource.Type.Trim().ToLowerInvariant();

            string canonicalName = resource.Name.Trim().ToLowerInvariant();
            string canonicalResourceType = resource.Type.Trim().ToLowerInvariant();

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

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static IReadOnlyList<ResourceDeclarationItem> ParseResourceItems(string content)
    {
        using JsonDocument document = JsonDocument.Parse(content);

        if (document.RootElement.ValueKind is JsonValueKind.Array)
        {
            List<ResourceDeclarationItem>? resources = JsonSerializer.Deserialize<List<ResourceDeclarationItem>>(
                content,
                JsonOptions);

            return resources ?? [];
        }

        ResourceDeclarationDocument? doc = JsonSerializer.Deserialize<ResourceDeclarationDocument>(content, JsonOptions);

        if (doc?.Resources is null || doc.Resources.Count == 0)
            return [];

        return doc.Resources;
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
}
