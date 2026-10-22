using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>Maps IE-06 inventory diff changes to evidence types that require reassessment.</summary>
public static class AuditInventoryChangeEvidenceImpactClassifier
{
    public static bool AffectsContinuousReadiness(AzureInventoryChangeType changeType) =>
        changeType is not AzureInventoryChangeType.TagChanged
            and not AzureInventoryChangeType.Unknown;

    public static IReadOnlySet<string> GetImpactedEvidenceTypes(AzureInventoryChangeRecord change)
    {
        ArgumentNullException.ThrowIfNull(change);

        if (!AffectsContinuousReadiness(change.ChangeType))
            return new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        return change.ChangeType switch
        {
            AzureInventoryChangeType.NetworkExposureChanged => EvidenceTypeSet(AuditEvidenceTypeNames.Network),
            AzureInventoryChangeType.ResourceAdded when IsPublicIpResource(change) =>
                EvidenceTypeSet(AuditEvidenceTypeNames.Network),
            AzureInventoryChangeType.ResourceRemoved when IsNetworkResource(change) =>
                EvidenceTypeSet(AuditEvidenceTypeNames.Network),
            AzureInventoryChangeType.PermissionChanged or AzureInventoryChangeType.IdentityChanged =>
                EvidenceTypeSet(AuditEvidenceTypeNames.Rbac, AuditEvidenceTypeNames.Identity),
            AzureInventoryChangeType.LoggingChanged =>
                EvidenceTypeSet(AuditEvidenceTypeNames.Logging),
            AzureInventoryChangeType.EncryptionChanged or AzureInventoryChangeType.SecurityControlChanged =>
                EvidenceTypeSet(AuditEvidenceTypeNames.Data, AuditEvidenceTypeNames.Posture),
            AzureInventoryChangeType.PolicyAssignmentChanged =>
                EvidenceTypeSet(AuditEvidenceTypeNames.Governance),
            AzureInventoryChangeType.ResourceAdded
                or AzureInventoryChangeType.ResourceRemoved
                or AzureInventoryChangeType.ResourceModified
                or AzureInventoryChangeType.RegionChanged
                or AzureInventoryChangeType.SkuChanged
                or AzureInventoryChangeType.RelationshipAdded
                or AzureInventoryChangeType.RelationshipRemoved
                or AzureInventoryChangeType.DependencyChanged =>
                EvidenceTypeSet(AuditEvidenceTypeNames.Inventory),
            _ => new HashSet<string>(StringComparer.OrdinalIgnoreCase),
        };
    }

    public static IReadOnlySet<string> GetImpactedEvidenceTypes(
        IReadOnlyList<AzureInventoryChangeRecord> changes)
    {
        ArgumentNullException.ThrowIfNull(changes);

        HashSet<string> impacted = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryChangeRecord change in changes)
        {
            foreach (string evidenceType in GetImpactedEvidenceTypes(change))
                impacted.Add(evidenceType);
        }

        return impacted;
    }

    private static bool IsPublicIpResource(AzureInventoryChangeRecord change) =>
        change.AzureResourceId?.Contains("/publicIPAddresses/", StringComparison.OrdinalIgnoreCase) == true
        || change.Property?.Contains("public", StringComparison.OrdinalIgnoreCase) == true;

    private static bool IsNetworkResource(AzureInventoryChangeRecord change) =>
        change.AzureResourceId?.Contains("Microsoft.Network/", StringComparison.OrdinalIgnoreCase) == true;

    private static HashSet<string> EvidenceTypeSet(params string[] types) =>
        new(types, StringComparer.OrdinalIgnoreCase);
}
