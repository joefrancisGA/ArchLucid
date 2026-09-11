namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Stable completeness warning codes when relationship classes are missing from a snapshot (IE-RF-09).
/// </summary>
public static class AzureInventoryRelationshipCompletenessWarningCodes
{
    public const string ArgVmNicMissing = "arg-vm-nic-missing";

    public const string ArgNicSubnetMissing = "arg-nic-subnet-missing";

    public const string HostedNicListFailed = "hosted-nic-list-failed";

    public const string ArmFallbackThinProperties = "arm-fallback-thin-properties";

    public const string AgwBackendFqdnUnresolved = "agw-backend-fqdn-unresolved";

    public const string AssociationTypeUnmappedPrefix = "association-type-unmapped:";

    public const string EffectiveControlsCapped = "effective-controls-capped";
}
