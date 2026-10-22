using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps redacted Log Analytics dependency observation rows to observed Data Flow edges (SN-RT-07).
/// </summary>
internal static class AzureInventoryDependencyObservationEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;

    public static void MapObservations(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<AzureInventoryDependencyObservationRow> rows,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.ObservedDependency,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        Dictionary<string, List<string>> principalToComputeArmIds =
            AzureInventoryComputeIdentityPrincipalIndex.BuildPrincipalToComputeArmIds(resources);
        Dictionary<string, List<string>> nameToComputeArmIds =
            AzureInventoryComputeResourceNameIndex.BuildNameToArmIds(resources);
        Dictionary<string, string> hostToArmId = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);
        HashSet<string> inventoriedArmIds = resources
            .Select(resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryDependencyObservationRow row in rows)
        {
            if (!row.CollectionStatus.Equals(
                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (row.ObservationKind.Equals(
                    AzureInventoryDependencyObservationKinds.ManagedIdentitySignIn,
                    StringComparison.OrdinalIgnoreCase)
                && string.IsNullOrWhiteSpace(row.TargetArmId)
                && string.IsNullOrWhiteSpace(row.TargetHost))
            {
                warnings.Add("observed-target-unresolved:managedIdentitySignIn");

                continue;
            }

            if (!TryResolveSourceComputeArmId(row, principalToComputeArmIds, nameToComputeArmIds, out string sourceArmId))
            {
                warnings.Add("observed-source-unresolved");

                continue;
            }

            if (!TryResolveTargetArmId(row, hostToArmId, inventoriedArmIds, out string targetArmId))
            {
                warnings.Add("observed-target-unresolved");

                continue;
            }

            string relationshipType = ResolveObservedRelationshipType(row.OperationClass);

            AddRelationship(
                relationships,
                relationshipKeys,
                sourceArmId,
                targetArmId,
                relationshipType,
                definition.DefaultProvenanceKind,
                ObservedFactConfidence,
                definition.DefaultInferenceSource);
        }
    }

    private static bool TryResolveSourceComputeArmId(
        AzureInventoryDependencyObservationRow row,
        IReadOnlyDictionary<string, List<string>> principalToComputeArmIds,
        IReadOnlyDictionary<string, List<string>> nameToComputeArmIds,
        out string sourceArmId)
    {
        sourceArmId = string.Empty;

        if (!string.IsNullOrWhiteSpace(row.SourcePrincipalId)
            && principalToComputeArmIds.TryGetValue(row.SourcePrincipalId.Trim(), out List<string>? principalMatches)
            && principalMatches.Count == 1)
        {
            sourceArmId = principalMatches[0];

            return true;
        }

        if (!string.IsNullOrWhiteSpace(row.SourceAppRoleName)
            && AzureInventoryComputeResourceNameIndex.TryResolveUniqueComputeArmId(
                nameToComputeArmIds,
                row.SourceAppRoleName,
                out string roleMatchArmId))
        {
            sourceArmId = roleMatchArmId;

            return true;
        }

        return false;
    }

    private static bool TryResolveTargetArmId(
        AzureInventoryDependencyObservationRow row,
        IReadOnlyDictionary<string, string> hostToArmId,
        HashSet<string> inventoriedArmIds,
        out string targetArmId)
    {
        targetArmId = string.Empty;

        if (!string.IsNullOrWhiteSpace(row.TargetArmId))
        {
            string normalizedTarget = ArmResourceIdNormalizer.Normalize(row.TargetArmId);

            if (inventoriedArmIds.Contains(normalizedTarget))
            {
                targetArmId = normalizedTarget;

                return true;
            }
        }

        if (!string.IsNullOrWhiteSpace(row.TargetHost))
        {
            string normalizedHost = row.TargetHost.Trim().ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(row.TargetCatalog)
                && !ShouldSkipCatalogTarget(row.TargetCatalog)
                && hostToArmId.TryGetValue($"{normalizedHost}|{row.TargetCatalog.Trim().ToLowerInvariant()}", out string? databaseArmId))
            {
                targetArmId = databaseArmId;

                return true;
            }

            if (hostToArmId.TryGetValue(normalizedHost, out string? hostArmId))
            {
                targetArmId = hostArmId;

                return true;
            }
        }

        return false;
    }

    private static bool ShouldSkipCatalogTarget(string? catalog)
    {
        if (string.IsNullOrWhiteSpace(catalog))
        {
            return false;
        }

        return AzureInventoryNeverShowSqlDatabaseNames.NeverShowDatabaseNames
            .Contains(catalog.Trim(), StringComparer.OrdinalIgnoreCase);
    }

    private static string ResolveObservedRelationshipType(string operationClass)
    {
        if (operationClass.Equals(AzureInventoryDependencyObservationOperationClass.Read, StringComparison.OrdinalIgnoreCase))
        {
            return GraphEdgeTypes.CanRead;
        }

        if (operationClass.Equals(AzureInventoryDependencyObservationOperationClass.Write, StringComparison.OrdinalIgnoreCase))
        {
            return GraphEdgeTypes.CanWrite;
        }

        return GraphEdgeTypes.ConnectsTo;
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
        string key = $"{fromAzureResourceId}|{relationshipType}|{toAzureResourceId}|{(int)provenanceKind}|{inferenceSource}";

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
}
