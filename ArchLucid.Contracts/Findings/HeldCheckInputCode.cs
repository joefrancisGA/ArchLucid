namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Closed set of missing inputs that cause fail-closed engine exits (DX-52).
///     Not findings — attribution for the measurement floor only.
/// </summary>
public enum HeldCheckInputCode
{
    AzureInventoryZip,
    AwsInventoryZip,
    GcpInventoryZip,
    ActorNodes,
    RbacBindings,
    SecretRotationMetadata,
    ReplicaOrFailoverProperties,
    NetworkPolicyRules,
    PriorRunSnapshot,
    AssignedPolicyPack,
}
