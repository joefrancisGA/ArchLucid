using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Resolves drift-row attribution from ARM systemData captured on inventory snapshots.</summary>
public static class AzureInventoryChangeAttributionResolver
{
    public static List<AzureInventoryChangeRecord> Enrich(
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        AzureInventorySnapshotDetailReadModel snapshotA,
        AzureInventorySnapshotDetailReadModel snapshotB)
    {
        ArgumentNullException.ThrowIfNull(changes);
        ArgumentNullException.ThrowIfNull(snapshotA);
        ArgumentNullException.ThrowIfNull(snapshotB);

        Dictionary<string, string> principalDisplayNames = BuildPrincipalDisplayNameIndex(snapshotB);

        return changes
            .Select(change => EnrichChange(change, snapshotA, snapshotB, principalDisplayNames))
            .ToList();
    }

    private static AzureInventoryChangeRecord EnrichChange(
        AzureInventoryChangeRecord change,
        AzureInventorySnapshotDetailReadModel snapshotA,
        AzureInventorySnapshotDetailReadModel snapshotB,
        IReadOnlyDictionary<string, string> principalDisplayNames)
    {
        if (change.ChangeType == AzureInventoryChangeType.ResourceUnchanged
            || string.IsNullOrWhiteSpace(change.AzureResourceId))
        {
            return change;
        }

        AzureInventorySnapshotDetailReadModel sourceSnapshot =
            change.ChangeType == AzureInventoryChangeType.ResourceRemoved ? snapshotA : snapshotB;

        IReadOnlyDictionary<string, string> properties =
            BuildPropertyMap(sourceSnapshot, change.AzureResourceId);

        string? actorId = change.ChangeType == AzureInventoryChangeType.ResourceAdded
            ? ReadProperty(properties, AzureInventorySystemDataPropertyKeys.CreatedBy)
            : ReadProperty(properties, AzureInventorySystemDataPropertyKeys.LastModifiedBy);

        string? actorType = change.ChangeType == AzureInventoryChangeType.ResourceAdded
            ? ReadProperty(properties, AzureInventorySystemDataPropertyKeys.CreatedByType)
            : ReadProperty(properties, AzureInventorySystemDataPropertyKeys.LastModifiedByType);

        (string? displayName, string? kind) = ResolveActor(actorId, actorType, properties, principalDisplayNames);

        if (string.IsNullOrWhiteSpace(displayName))
        {
            return change;
        }

        return new AzureInventoryChangeRecord
        {
            ChangeId = change.ChangeId,
            DiffId = change.DiffId,
            SnapshotAId = change.SnapshotAId,
            SnapshotBId = change.SnapshotBId,
            CloudResourceId = change.CloudResourceId,
            AzureResourceId = change.AzureResourceId,
            ChangeType = change.ChangeType,
            Property = change.Property,
            OldValue = change.OldValue,
            NewValue = change.NewValue,
            RiskClassification = change.RiskClassification,
            ArchitectureSignificance = change.ArchitectureSignificance,
            SecuritySignificance = change.SecuritySignificance,
            Confidence = change.Confidence,
            EvidenceReference = change.EvidenceReference,
            ProvenanceKind = change.ProvenanceKind,
            ChangedByDisplayName = displayName,
            ChangedByKind = kind,
        };
    }

    private static (string? DisplayName, string? Kind) ResolveActor(
        string? actorId,
        string? actorType,
        IReadOnlyDictionary<string, string> resourceProperties,
        IReadOnlyDictionary<string, string> principalDisplayNames)
    {
        if (string.IsNullOrWhiteSpace(actorId))
        {
            return (null, null);
        }

        string trimmedActorId = actorId.Trim();
        string normalizedType = NormalizeActorType(actorType);

        if (trimmedActorId.Contains('@', StringComparison.Ordinal))
        {
            return (trimmedActorId, "human");
        }

        if (principalDisplayNames.TryGetValue(trimmedActorId, out string? principalDisplayName)
            && !string.IsNullOrWhiteSpace(principalDisplayName))
        {
            return (principalDisplayName, MapActorKind(normalizedType));
        }

        string? computerName = ReadProperty(resourceProperties, AzureInventorySystemDataPropertyKeys.ComputerName);

        if (!string.IsNullOrWhiteSpace(computerName)
            && (normalizedType is "application" or "serviceprincipal" or "managedidentity"))
        {
            return (computerName, "machine");
        }

        if (Guid.TryParse(trimmedActorId, out _))
        {
            string shortId = trimmedActorId[..8];

            return normalizedType switch
            {
                "user" => ($"User {shortId}", "human"),
                "application" => ($"Application {shortId}", "servicePrincipal"),
                "serviceprincipal" => ($"Service principal {shortId}", "servicePrincipal"),
                "managedidentity" => ($"Managed identity {shortId}", "managedIdentity"),
                _ => ($"Principal {shortId}", "unknown"),
            };
        }

        return (trimmedActorId, MapActorKind(normalizedType));
    }

    private static string? MapActorKind(string normalizedType) =>
        normalizedType switch
        {
            "user" => "human",
            "application" => "servicePrincipal",
            "serviceprincipal" => "servicePrincipal",
            "managedidentity" => "managedIdentity",
            _ => "unknown",
        };

    private static string NormalizeActorType(string? actorType) =>
        (actorType ?? string.Empty).Trim().Replace(" ", string.Empty, StringComparison.Ordinal).ToLowerInvariant();

    private static Dictionary<string, string> BuildPrincipalDisplayNameIndex(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        Dictionary<string, string> principalDisplayNames = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            if (!resource.ResourceType.Contains("userAssignedIdentities", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            IReadOnlyDictionary<string, string> properties = BuildPropertyMap(snapshot, resource.AzureResourceId);
            string? principalId = ReadProperty(properties, "principalId");

            if (string.IsNullOrWhiteSpace(principalId))
            {
                continue;
            }

            string displayName = resource.AzureResourceId.Split('/').LastOrDefault() ?? resource.AzureResourceId;
            principalDisplayNames[principalId.Trim()] = displayName;
        }

        return principalDisplayNames;
    }

    private static IReadOnlyDictionary<string, string> BuildPropertyMap(
        AzureInventorySnapshotDetailReadModel snapshot,
        string azureResourceId)
    {
        AzureInventoryResourceRecord? resource = snapshot.Resources.FirstOrDefault(
            row => string.Equals(row.AzureResourceId, azureResourceId, StringComparison.OrdinalIgnoreCase));

        if (resource is null)
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        return snapshot.Properties
            .Where(property => property.ResourceRowId == resource.ResourceRowId && !property.IsRedacted)
            .GroupBy(property => property.PropertyKey, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.First().PropertyValue ?? string.Empty,
                StringComparer.OrdinalIgnoreCase);
    }

    private static string? ReadProperty(IReadOnlyDictionary<string, string> properties, string propertyKey)
    {
        if (!properties.TryGetValue(propertyKey, out string? value))
        {
            return null;
        }

        string trimmed = value.Trim();

        return trimmed.Length > 0 ? trimmed : null;
    }
}
