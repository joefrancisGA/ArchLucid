using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Closed set of missing inputs that cause fail-closed engine exits (DX-52).
///     Not findings — attribution for the measurement floor only.
/// </summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<HeldCheckInputCode>))]
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
