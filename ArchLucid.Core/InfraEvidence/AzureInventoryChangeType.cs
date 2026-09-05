namespace ArchLucid.Core.InfraEvidence;

/// <summary>Semantic change classification between two Azure inventory snapshots.</summary>
public enum AzureInventoryChangeType
{
    ResourceAdded = 0,
    ResourceRemoved = 1,
    ResourceModified = 2,
    RelationshipAdded = 3,
    RelationshipRemoved = 4,
    IdentityChanged = 5,
    PermissionChanged = 6,
    NetworkExposureChanged = 7,
    SecurityControlChanged = 8,
    LoggingChanged = 9,
    EncryptionChanged = 10,
    TagChanged = 11,
    RegionChanged = 12,
    SkuChanged = 13,
    DependencyChanged = 14,
    PolicyAssignmentChanged = 15,
    Unknown = 16,
}
