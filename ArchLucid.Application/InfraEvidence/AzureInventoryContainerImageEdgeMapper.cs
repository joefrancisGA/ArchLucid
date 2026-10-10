using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Maps stored workload image hosts to inventoried container registries.</summary>
internal static class AzureInventoryContainerImageEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;

    public static void MapImages(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);

        Dictionary<string, string> registryIdsByLoginServer = resources
            .Where(resource => resource.ResourceType.Equals(
                "Microsoft.ContainerRegistry/registries",
                StringComparison.OrdinalIgnoreCase))
            .Select(resource => new
            {
                RegistryId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId),
                LoginServer = ReadProperty(resource, "loginServer"),
            })
            .Where(row => !string.IsNullOrWhiteSpace(row.LoginServer))
            .GroupBy(row => NormalizeHost(row.LoginServer!), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.First().RegistryId,
                StringComparer.OrdinalIgnoreCase);

        if (registryIdsByLoginServer.Count == 0)
        {
            return;
        }

        foreach (AzureExtractorExtendedResourceRow workload in resources)
        {
            foreach (string image in ReadImageReferences(workload))
            {
                if (!TryReadImageHost(image, out string? imageHost)
                    || !registryIdsByLoginServer.TryGetValue(imageHost, out string? registryId))
                {
                    continue;
                }

                AddRelationship(
                    workload,
                    registryId,
                    relationships,
                    relationshipKeys);
            }
        }
    }

    private static IEnumerable<string> ReadImageReferences(
        AzureExtractorExtendedResourceRow resource)
    {
        return resource.Properties
            .Where(property => property.Key.StartsWith(
                "container.image[",
                StringComparison.OrdinalIgnoreCase))
            .Select(property => property.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim());
    }

    private static bool TryReadImageHost(
        string image,
        out string imageHost)
    {
        imageHost = string.Empty;
        string normalizedImage = image.Trim();

        int separatorIndex = normalizedImage.IndexOf('/');

        if (separatorIndex <= 0)
        {
            return false;
        }

        imageHost = NormalizeHost(normalizedImage[..separatorIndex]);
        return !string.IsNullOrWhiteSpace(imageHost);
    }

    private static string NormalizeHost(string host)
    {
        return host.Trim().TrimEnd('/').ToLowerInvariant();
    }

    private static string? ReadProperty(
        AzureExtractorExtendedResourceRow resource,
        string propertyName)
    {
        return resource.Properties.TryGetValue(propertyName, out string? value)
            ? value
            : null;
    }

    private static void AddRelationship(
        AzureExtractorExtendedResourceRow workload,
        string registryId,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.ContainerImage,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        string fromResourceId = ArmResourceIdNormalizer.Normalize(workload.AzureResourceId);
        string key = $"{fromResourceId}|{definition.AssociationType}|{registryId}|{(int)ProvenanceKind.ObservedFact}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = fromResourceId,
            ToAzureResourceId = registryId,
            RelationshipType = definition.DefaultGraphEdgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            Confidence = ObservedFactConfidence,
            InferenceSource = definition.DefaultInferenceSource,
        });
    }
}
