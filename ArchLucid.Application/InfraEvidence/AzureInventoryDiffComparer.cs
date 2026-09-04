using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Deterministic semantic comparison between two normalized inventory snapshots.</summary>
public static class AzureInventoryDiffComparer
{
    public static List<AzureInventoryChangeRecord> Compare(
        AzureInventorySnapshotDetailReadModel snapshotA,
        AzureInventorySnapshotDetailReadModel snapshotB,
        Guid snapshotAId,
        Guid snapshotBId)
    {
        ArgumentNullException.ThrowIfNull(snapshotA);
        ArgumentNullException.ThrowIfNull(snapshotB);

        List<AzureInventoryChangeRecord> changes = [];

        Dictionary<string, AzureInventoryResourceRecord> resourcesA =
            snapshotA.Resources.ToDictionary(r => r.AzureResourceId, StringComparer.OrdinalIgnoreCase);

        Dictionary<string, AzureInventoryResourceRecord> resourcesB =
            snapshotB.Resources.ToDictionary(r => r.AzureResourceId, StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, AzureInventoryResourceRecord> added in resourcesB)
        {
            if (resourcesA.ContainsKey(added.Key))
                continue;

            changes.Add(CreateChange(
                snapshotAId,
                snapshotBId,
                added.Value.CloudResourceId,
                added.Key,
                AzureInventoryChangeType.ResourceAdded,
                property: null,
                oldValue: null,
                newValue: added.Value.ResourceType));
        }

        foreach (KeyValuePair<string, AzureInventoryResourceRecord> removed in resourcesA)
        {
            if (resourcesB.ContainsKey(removed.Key))
                continue;

            changes.Add(CreateChange(
                snapshotAId,
                snapshotBId,
                removed.Value.CloudResourceId,
                removed.Key,
                AzureInventoryChangeType.ResourceRemoved,
                property: null,
                oldValue: removed.Value.ResourceType,
                newValue: null));
        }

        foreach (KeyValuePair<string, AzureInventoryResourceRecord> pair in resourcesA)
        {
            if (!resourcesB.TryGetValue(pair.Key, out AzureInventoryResourceRecord? resourceB))
                continue;

            AzureInventoryResourceRecord resourceA = pair.Value;

            if (!string.Equals(resourceA.Region, resourceB.Region, StringComparison.OrdinalIgnoreCase))
            {
                changes.Add(CreateChange(
                    snapshotAId,
                    snapshotBId,
                    resourceB.CloudResourceId,
                    pair.Key,
                    AzureInventoryChangeType.RegionChanged,
                    "region",
                    resourceA.Region,
                    resourceB.Region));
            }

            CompareTags(changes, snapshotA, snapshotB, resourceA, resourceB, snapshotAId, snapshotBId, pair.Key);
            CompareProperties(changes, snapshotA, snapshotB, resourceA, resourceB, snapshotAId, snapshotBId, pair.Key);
        }

        CompareRelationships(changes, snapshotA, snapshotB, snapshotAId, snapshotBId);
        CompareRoleAssignments(changes, snapshotA, snapshotB, snapshotAId, snapshotBId);

        return changes
            .OrderBy(c => c.AzureResourceId, StringComparer.Ordinal)
            .ThenBy(c => c.ChangeType)
            .ThenBy(c => c.Property, StringComparer.Ordinal)
            .ToList();
    }

    private static void CompareTags(
        List<AzureInventoryChangeRecord> changes,
        AzureInventorySnapshotDetailReadModel snapshotA,
        AzureInventorySnapshotDetailReadModel snapshotB,
        AzureInventoryResourceRecord resourceA,
        AzureInventoryResourceRecord resourceB,
        Guid snapshotAId,
        Guid snapshotBId,
        string azureResourceId)
    {
        Dictionary<string, string?> tagsA = snapshotA.Tags
            .Where(t => t.ResourceRowId == resourceA.ResourceRowId)
            .ToDictionary(t => t.TagKey, t => t.TagValue, StringComparer.OrdinalIgnoreCase);

        Dictionary<string, string?> tagsB = snapshotB.Tags
            .Where(t => t.ResourceRowId == resourceB.ResourceRowId)
            .ToDictionary(t => t.TagKey, t => t.TagValue, StringComparer.OrdinalIgnoreCase);

        HashSet<string> keys = new(tagsA.Keys, StringComparer.OrdinalIgnoreCase);
        keys.UnionWith(tagsB.Keys);

        foreach (string key in keys.OrderBy(k => k, StringComparer.Ordinal))
        {
            tagsA.TryGetValue(key, out string? oldValue);
            tagsB.TryGetValue(key, out string? newValue);

            if (string.Equals(oldValue, newValue, StringComparison.Ordinal))
                continue;

            changes.Add(CreateChange(
                snapshotAId,
                snapshotBId,
                resourceB.CloudResourceId,
                azureResourceId,
                AzureInventoryChangeType.TagChanged,
                $"tag:{key}",
                oldValue,
                newValue));
        }
    }

    private static void CompareProperties(
        List<AzureInventoryChangeRecord> changes,
        AzureInventorySnapshotDetailReadModel snapshotA,
        AzureInventorySnapshotDetailReadModel snapshotB,
        AzureInventoryResourceRecord resourceA,
        AzureInventoryResourceRecord resourceB,
        Guid snapshotAId,
        Guid snapshotBId,
        string azureResourceId)
    {
        Dictionary<string, string?> propsA = snapshotA.Properties
            .Where(p => p.ResourceRowId == resourceA.ResourceRowId)
            .ToDictionary(p => p.PropertyKey, p => p.PropertyValue, StringComparer.OrdinalIgnoreCase);

        Dictionary<string, string?> propsB = snapshotB.Properties
            .Where(p => p.ResourceRowId == resourceB.ResourceRowId)
            .ToDictionary(p => p.PropertyKey, p => p.PropertyValue, StringComparer.OrdinalIgnoreCase);

        HashSet<string> keys = new(propsA.Keys, StringComparer.OrdinalIgnoreCase);
        keys.UnionWith(propsB.Keys);

        foreach (string key in keys.OrderBy(k => k, StringComparer.Ordinal))
        {
            propsA.TryGetValue(key, out string? oldValue);
            propsB.TryGetValue(key, out string? newValue);

            if (string.Equals(oldValue, newValue, StringComparison.Ordinal))
                continue;

            AzureInventoryChangeType changeType = AzureInventoryDiffHeuristics.ClassifyPropertyChange(
                key,
                oldValue,
                newValue,
                resourceB.ResourceType);

            changes.Add(CreateChange(
                snapshotAId,
                snapshotBId,
                resourceB.CloudResourceId,
                azureResourceId,
                changeType,
                key,
                oldValue,
                newValue));
        }
    }

    private static void CompareRelationships(
        List<AzureInventoryChangeRecord> changes,
        AzureInventorySnapshotDetailReadModel snapshotA,
        AzureInventorySnapshotDetailReadModel snapshotB,
        Guid snapshotAId,
        Guid snapshotBId)
    {
        HashSet<string> relA = snapshotA.Relationships
            .Select(FormatRelationship)
            .ToHashSet(StringComparer.Ordinal);

        HashSet<string> relB = snapshotB.Relationships
            .Select(FormatRelationship)
            .ToHashSet(StringComparer.Ordinal);

        foreach (string added in relB.Except(relA, StringComparer.Ordinal).OrderBy(r => r, StringComparer.Ordinal))
        {
            AzureInventoryResourceRelationshipReadModel? relationship =
                snapshotB.Relationships.FirstOrDefault(r => FormatRelationship(r) == added);

            if (relationship is null)
                continue;

            AzureInventoryChangeType changeType =
                AzureInventoryDiffHeuristics.IsPrivateEndpointResource(string.Empty, relationship.RelationshipType)
                    ? AzureInventoryChangeType.RelationshipAdded
                    : AzureInventoryChangeType.RelationshipAdded;

            changes.Add(CreateChange(
                snapshotAId,
                snapshotBId,
                cloudResourceId: null,
                relationship.FromAzureResourceId,
                changeType,
                relationship.RelationshipType,
                oldValue: null,
                newValue: relationship.ToAzureResourceId));
        }

        foreach (string removed in relA.Except(relB, StringComparer.Ordinal).OrderBy(r => r, StringComparer.Ordinal))
        {
            AzureInventoryResourceRelationshipReadModel? relationship =
                snapshotA.Relationships.FirstOrDefault(r => FormatRelationship(r) == removed);

            if (relationship is null)
                continue;

            changes.Add(CreateChange(
                snapshotAId,
                snapshotBId,
                cloudResourceId: null,
                relationship.FromAzureResourceId,
                AzureInventoryChangeType.RelationshipRemoved,
                relationship.RelationshipType,
                relationship.ToAzureResourceId,
                newValue: null));
        }
    }

    private static void CompareRoleAssignments(
        List<AzureInventoryChangeRecord> changes,
        AzureInventorySnapshotDetailReadModel snapshotA,
        AzureInventorySnapshotDetailReadModel snapshotB,
        Guid snapshotAId,
        Guid snapshotBId)
    {
        HashSet<string> assignmentsA = snapshotA.RoleAssignments.Select(FormatRoleAssignment).ToHashSet(StringComparer.Ordinal);
        HashSet<string> assignmentsB = snapshotB.RoleAssignments.Select(FormatRoleAssignment).ToHashSet(StringComparer.Ordinal);

        foreach (string added in assignmentsB.Except(assignmentsA, StringComparer.Ordinal).OrderBy(a => a, StringComparer.Ordinal))
        {
            AzureInventoryRoleAssignmentReadModel? assignment =
                snapshotB.RoleAssignments.FirstOrDefault(a => FormatRoleAssignment(a) == added);

            if (assignment is null)
                continue;

            AzureInventoryChangeType changeType = AzureInventoryDiffHeuristics.IsElevatedRoleAssignment(assignment.RoleDefinitionId)
                ? AzureInventoryChangeType.PermissionChanged
                : AzureInventoryChangeType.PermissionChanged;

            changes.Add(CreateChange(
                snapshotAId,
                snapshotBId,
                cloudResourceId: null,
                assignment.Scope,
                changeType,
                "roleDefinitionId",
                oldValue: null,
                newValue: assignment.RoleDefinitionId));
        }

        foreach (string removed in assignmentsA.Except(assignmentsB, StringComparer.Ordinal).OrderBy(a => a, StringComparer.Ordinal))
        {
            AzureInventoryRoleAssignmentReadModel? assignment =
                snapshotA.RoleAssignments.FirstOrDefault(a => FormatRoleAssignment(a) == removed);

            if (assignment is null)
                continue;

            changes.Add(CreateChange(
                snapshotAId,
                snapshotBId,
                cloudResourceId: null,
                assignment.Scope,
                AzureInventoryChangeType.PermissionChanged,
                "roleDefinitionId",
                assignment.RoleDefinitionId,
                newValue: null));
        }
    }

    private static AzureInventoryChangeRecord CreateChange(
        Guid snapshotAId,
        Guid snapshotBId,
        Guid? cloudResourceId,
        string? azureResourceId,
        AzureInventoryChangeType changeType,
        string? property,
        string? oldValue,
        string? newValue)
    {
        return new AzureInventoryChangeRecord
        {
            ChangeId = Guid.NewGuid(),
            DiffId = Guid.Empty,
            SnapshotAId = snapshotAId,
            SnapshotBId = snapshotBId,
            CloudResourceId = cloudResourceId,
            AzureResourceId = azureResourceId,
            ChangeType = changeType,
            Property = property,
            OldValue = oldValue,
            NewValue = newValue,
            RiskClassification = AzureInventoryDiffHeuristics.BuildRiskClassification(changeType),
            SecuritySignificance = AzureInventoryDiffHeuristics.BuildSecuritySignificance(changeType),
            Confidence = 1.0m,
            EvidenceReference = "azure-inventory-snapshot",
            ProvenanceKind = ProvenanceKind.DerivedFact,
        };
    }

    private static string FormatRelationship(AzureInventoryResourceRelationshipReadModel relationship) =>
        $"{relationship.FromAzureResourceId}|{relationship.RelationshipType}|{relationship.ToAzureResourceId}";

    private static string FormatRoleAssignment(AzureInventoryRoleAssignmentReadModel assignment) =>
        $"{assignment.Scope}|{assignment.PrincipalId}|{assignment.RoleDefinitionId}";
}
