using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses Pulumi stack-export JSON into canonical objects (DX-42).
/// </summary>
public sealed class PulumiStackJsonInfrastructureDeclarationParser(
    ILogger<PulumiStackJsonInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "pulumi-stack-json", StringComparison.OrdinalIgnoreCase);
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

            if (!InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(root, "deployment", out JsonElement deployment)
                || deployment.ValueKind is not JsonValueKind.Object
                || !InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(deployment, "resources", out JsonElement resources)
                || resources.ValueKind is not JsonValueKind.Array)
                return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

            List<CanonicalObject> results = [];

            foreach (JsonElement resource in resources.EnumerateArray())
                TryAddPulumiResource(declaration, resource, results);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(
                ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as pulumi-stack-json; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }
    }

    private static void TryAddPulumiResource(
        InfrastructureDeclarationReference declaration,
        JsonElement resource,
        List<CanonicalObject> results)
    {
        if (!InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(resource, "type", out JsonElement typeElement)
            || typeElement.ValueKind is not JsonValueKind.String)
            return;

        string resourceType = (typeElement.GetString() ?? string.Empty).Trim();

        if (InfrastructureDeclarationCloudResourceMapper.ShouldSkipPulumiResourceType(resourceType)
            || !InfrastructureDeclarationCloudResourceMapper.TryResolveObjectType(resourceType, out string objectType))
            return;

        InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(resource, "urn", out JsonElement urnElement);
        string? urn = urnElement.ValueKind is JsonValueKind.String ? urnElement.GetString() : null;

        JsonElement? outputs = null;
        JsonElement? inputs = null;

        if (InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(resource, "outputs", out JsonElement outputsElement)
            && outputsElement.ValueKind is JsonValueKind.Object)
            outputs = outputsElement;

        if (InfrastructureDeclarationJsonElementReader.TryGetPropertyIgnoreCase(resource, "inputs", out JsonElement inputsElement)
            && inputsElement.ValueKind is JsonValueKind.Object)
            inputs = inputsElement;

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["resourceType"] = resourceType.ToLowerInvariant(),
        };

        if (outputs is not null)
            InfrastructureDeclarationJsonElementReader.CopyBoundedProperties(outputs.Value, properties);

        if (inputs is not null)
            InfrastructureDeclarationJsonElementReader.CopyBoundedProperties(inputs.Value, properties);

        string fallbackName = InfrastructureDeclarationCloudResourceMapper.ResolveNameFromPulumiUrn(urn, resourceType);
        string canonicalName = ResolveCanonicalResourceName(fallbackName, properties);

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
                     "allowblobpublicaccess",
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
            if (key is "allowblobpublicaccess")
                continue;

            if (properties.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
                return value.Trim().ToLowerInvariant();
        }

        return fallbackName.Trim().ToLowerInvariant();
    }
}
