using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps <c>network-associations.json</c> rows to snapshot relationships using the IE-RF-01 catalog (IE-RF-07).
/// </summary>
internal static class AzureInventoryNetworkAssociationEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;
    private const decimal DeterministicInferenceConfidence = 0.8m;

    public static void MapAssociation(
        JsonElement association,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        string? fromResourceId = TryReadJsonString(association, "fromResourceId");
        string? toResourceId = TryReadJsonString(association, "toResourceId");
        string? associationType = TryReadJsonString(association, "associationType");

        if (string.IsNullOrWhiteSpace(fromResourceId)
            || string.IsNullOrWhiteSpace(toResourceId)
            || string.IsNullOrWhiteSpace(associationType))
        {
            return;
        }

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(associationType, out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            warnings.Add($"{AzureInventoryRelationshipCompletenessWarningCodes.AssociationTypeUnmappedPrefix}{associationType}");

            return;
        }

        if (definition.AssociationType.Equals(AzureInventoryRelationshipAssociationTypes.NsgAllowRule, StringComparison.OrdinalIgnoreCase)
            && string.IsNullOrWhiteSpace(TryReadJsonString(association, "ruleName")))
        {
            return;
        }

        string normalizedFrom = ArmResourceIdNormalizer.Normalize(fromResourceId);
        string normalizedTo = ArmResourceIdNormalizer.Normalize(toResourceId);
        ProvenanceKind provenanceKind = definition.DefaultProvenanceKind;
        decimal confidence = provenanceKind == ProvenanceKind.ObservedFact
            ? ObservedFactConfidence
            : DeterministicInferenceConfidence;

        AddRelationship(
            relationships,
            relationshipKeys,
            normalizedFrom,
            normalizedTo,
            definition.DefaultGraphEdgeType,
            provenanceKind,
            confidence,
            definition.DefaultInferenceSource);
    }

    public static void AddRelationshipCompletenessWarnings(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<JsonElement> networkAssociations,
        List<string> warnings)
    {
        bool hasVirtualMachine = resources.Any(resource =>
            resource.ResourceType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase));

        bool hasNetworkInterface = resources.Any(resource =>
            resource.ResourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase));

        if (!hasVirtualMachine && !hasNetworkInterface)
        {
            return;
        }

        HashSet<string> associationTypes = networkAssociations
            .Select(TryReadAssociationType)
            .Where(type => !string.IsNullOrWhiteSpace(type))
            .ToHashSet(StringComparer.OrdinalIgnoreCase)!;

        if (hasVirtualMachine && !associationTypes.Contains(AzureInventoryRelationshipAssociationTypes.VmToNic))
        {
            warnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.ArgVmNicMissing);
        }

        if (hasNetworkInterface && !associationTypes.Contains(AzureInventoryRelationshipAssociationTypes.NicToSubnet))
        {
            warnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing);
        }
    }

    private static string? TryReadAssociationType(JsonElement association)
    {
        return TryReadJsonString(association, "associationType");
    }

    private static void AddRelationship(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromAzureResourceId,
        string toAzureResourceId,
        string relationshipType,
        ProvenanceKind provenanceKind,
        decimal confidence,
        string inferenceSource)
    {
        string key = $"{fromAzureResourceId}|{relationshipType}|{toAzureResourceId}|{(int)provenanceKind}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = fromAzureResourceId,
            ToAzureResourceId = toAzureResourceId,
            RelationshipType = relationshipType,
            ProvenanceKind = provenanceKind,
            Confidence = confidence,
            InferenceSource = inferenceSource,
        });
    }

    private static string? TryReadJsonString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
