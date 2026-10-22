using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Deterministic drift classification over persisted inventory diff changes.</summary>
public static class AzureInventoryDriftClassifier
{
    public static AzureInventoryDriftClassification ClassifyChange(
        AzureInventoryChangeRecord change,
        IReadOnlyList<AzureInventoryDriftApprovalRecord> activeApprovals,
        DateTime asOfUtc)
    {
        ArgumentNullException.ThrowIfNull(change);
        ArgumentNullException.ThrowIfNull(activeApprovals);

        if (IsPotentiallyDangerous(change))
            return AzureInventoryDriftClassification.PotentiallyDangerous;

        if (IsSecurityRelevant(change))
            return AzureInventoryDriftClassification.SecurityRelevant;

        if (HasActiveApproval(change.ChangeId, activeApprovals, asOfUtc))
            return AzureInventoryDriftClassification.Approved;

        if (IsArchitectureRelevant(change))
            return AzureInventoryDriftClassification.ArchitectureRelevant;

        if (IsExpected(change))
            return AzureInventoryDriftClassification.Expected;

        return AzureInventoryDriftClassification.Unapproved;
    }

    public static bool IsPotentiallyDangerous(AzureInventoryChangeRecord change)
    {
        ArgumentNullException.ThrowIfNull(change);

        if (change.ChangeType == AzureInventoryChangeType.NetworkExposureChanged
            && AzureInventoryDiffHeuristics.IsPublicExposureProperty(change.Property ?? string.Empty, change.NewValue))
            return true;

        if (change.ChangeType == AzureInventoryChangeType.PermissionChanged
            && AzureInventoryDiffHeuristics.IsElevatedRoleAssignment(change.NewValue ?? change.Property ?? string.Empty))
            return true;

        if (change.ChangeType == AzureInventoryChangeType.LoggingChanged
            && AzureInventoryDiffHeuristics.IsLoggingRegression(
                change.Property ?? string.Empty,
                change.OldValue,
                change.NewValue))
            return true;

        if (change.ChangeType == AzureInventoryChangeType.EncryptionChanged
            && !string.IsNullOrWhiteSpace(change.OldValue)
            && string.IsNullOrWhiteSpace(change.NewValue))
            return true;

        return false;
    }

    public static bool IsSecurityRelevant(AzureInventoryChangeRecord change)
    {
        ArgumentNullException.ThrowIfNull(change);

        return change.ChangeType is AzureInventoryChangeType.NetworkExposureChanged
            or AzureInventoryChangeType.PermissionChanged
            or AzureInventoryChangeType.SecurityControlChanged
            or AzureInventoryChangeType.LoggingChanged
            or AzureInventoryChangeType.EncryptionChanged;
    }

    public static bool IsArchitectureRelevant(AzureInventoryChangeRecord change)
    {
        ArgumentNullException.ThrowIfNull(change);

        return change.ChangeType is AzureInventoryChangeType.RegionChanged
            or AzureInventoryChangeType.SkuChanged
            or AzureInventoryChangeType.ResourceAdded
            or AzureInventoryChangeType.ResourceRemoved
            or AzureInventoryChangeType.RelationshipAdded
            or AzureInventoryChangeType.RelationshipRemoved;
    }

    private static bool IsExpected(AzureInventoryChangeRecord change)
    {
        return change.ChangeType == AzureInventoryChangeType.ResourceModified
            && string.IsNullOrWhiteSpace(change.SecuritySignificance)
            && string.IsNullOrWhiteSpace(change.ArchitectureSignificance)
            && !IsPotentiallyDangerous(change);
    }

    private static bool HasActiveApproval(
        Guid changeId,
        IReadOnlyList<AzureInventoryDriftApprovalRecord> activeApprovals,
        DateTime asOfUtc)
    {
        return activeApprovals.Any(approval =>
            approval.Status == AzureInventoryDriftApprovalStatus.Active
            && approval.ExpirationUtc > asOfUtc
            && (approval.ChangeId is null || approval.ChangeId == changeId));
    }
}
