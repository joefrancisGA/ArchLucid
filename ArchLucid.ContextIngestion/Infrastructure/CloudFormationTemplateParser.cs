using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Shared CloudFormation template parsing for cloudformation and cdk-synth formats (DX-42).
/// </summary>
internal static class CloudFormationTemplateParser
{
    private static readonly IDeserializer YamlDeserializer = new DeserializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .IgnoreUnmatchedProperties()
        .Build();

    internal static IReadOnlyList<CanonicalObject> ParseTemplateContent(
        InfrastructureDeclarationReference declaration,
        string content,
        ILogger? logger)
    {
        ArgumentNullException.ThrowIfNull(declaration);

        if (string.IsNullOrWhiteSpace(content))
            return [];

        JsonElement root = ParseRootElement(content, declaration, logger);

        if (root.ValueKind is JsonValueKind.Undefined)
            return [];

        if (!CloudFormationInfrastructureDeclarationParser.LooksLikeCloudFormationTemplate(content)
            && !HasResourcesMap(root))
            return [];

        if (!InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(root, "Resources", out JsonElement resources)
            || resources.ValueKind is not JsonValueKind.Object)
            return [];

        List<CanonicalObject> results = [];

        foreach (JsonProperty resourceEntry in resources.EnumerateObject())
        {
            if (resourceEntry.Value.ValueKind is not JsonValueKind.Object)
                continue;

            TryAddResource(declaration, resourceEntry.Name, resourceEntry.Value, results);
        }

        return results;
    }

    private static JsonElement ParseRootElement(
        string content,
        InfrastructureDeclarationReference declaration,
        ILogger? logger)
    {
        string trimmed = content.TrimStart();

        if (trimmed.StartsWith("{", StringComparison.Ordinal))
        {
            using JsonDocument document = JsonDocument.Parse(content);

            return document.RootElement.Clone();
        }

        try
        {
            object? yamlObject = YamlDeserializer.Deserialize<object>(content);

            if (yamlObject is null)
                return default;

            string json = JsonSerializer.Serialize(yamlObject);
            using JsonDocument document = JsonDocument.Parse(json);

            return document.RootElement.Clone();
        }
        catch (Exception ex) when (ex is YamlDotNet.Core.YamlException or JsonException)
        {
            logger?.LogWarning(
                ex,
                "Failed to parse CloudFormation YAML for '{Name}' (DeclarationId={DeclarationId}); skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return default;
        }
    }

    internal static bool HasResourcesMap(JsonElement root)
    {
        return InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(root, "Resources", out JsonElement resources)
            && resources.ValueKind is JsonValueKind.Object;
    }

    private static void TryAddResource(
        InfrastructureDeclarationReference declaration,
        string logicalName,
        JsonElement resource,
        List<CanonicalObject> results)
    {
        if (!InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(resource, "Type", out JsonElement typeElement)
            || typeElement.ValueKind is not JsonValueKind.String)
            return;

        string resourceType = (typeElement.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(resourceType)
            || !InfrastructureDeclarationCloudResourceMapper.TryResolveObjectType(resourceType, out string objectType))
            return;

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["resourceType"] = resourceType.ToLowerInvariant(),
        };

        JsonElement? propertyBagSource = null;

        if (InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(resource, "Properties", out JsonElement resourceProperties)
            && resourceProperties.ValueKind is JsonValueKind.Object)
        {
            propertyBagSource = resourceProperties;
            InfrastructureDeclarationJsonElementReader.CopyBoundedProperties(resourceProperties, properties);
        }

        string canonicalName = ResolveCanonicalResourceName(logicalName, properties);

        InfrastructureDeclarationSpecialPropertyMapper.Apply(properties, resourceType, canonicalName);

        string resourceIdentity = InfrastructureDeclarationResourceIdentity.AppendSubtypeRegionDisambiguators(
            $"{resourceType.ToLowerInvariant()}|{canonicalName}",
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
            Properties = properties,
        });
    }

    private static string ResolveCanonicalResourceName(string fallbackName, Dictionary<string, string> properties)
    {
        foreach (string key in new[]
                 {
                     "name",
                     "bucketname",
                     "tf.name",
                     "tf.bucketname",
                     "functionname",
                     "tf.functionname",
                     "rolename",
                     "tf.rolename",
                     "clustername",
                     "tf.clustername",
                 })
        {
            if (properties.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
                return value.Trim().ToLowerInvariant();
        }

        return fallbackName.Trim().ToLowerInvariant();
    }
}
