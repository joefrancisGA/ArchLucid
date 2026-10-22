namespace ArchLucid.Application.Findings;

/// <summary>
///     Deterministic remediation branches for orphaned AWS resource findings (explainability only; TB-2218).
/// </summary>
public static class OrphanedAwsResourceExplainabilityAlternatives
{
    public static IReadOnlyList<string> ResolveForResourceType(string resourceType)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceType);

        if (resourceType.Equals("AWS::EC2::Volume", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                "Attach the volume to an EC2 instance that needs expanded storage.",
                "Snapshot and delete if the volume is abandoned inventory.",
                "Restore from snapshot onto a replacement instance if the original host was decommissioned."
            ];
        }

        if (resourceType.Equals("AWS::EC2::EIP", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                "Associate the Elastic IP with a load balancer or NAT gateway front end.",
                "Release the address if no inbound path is required for this scope.",
                "Reassign to a standby instance that still needs static ingress."
            ];
        }

        if (resourceType.Equals("AWS::EC2::NetworkInterface", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                "Attach the ENI to an instance that requires this network profile.",
                "Delete the ENI if it is leftover from scale-in or instance termination.",
                "Reuse the ENI when rebuilding a replacement instance with the same subnet."
            ];
        }

        return
        [
            "Delete the orphaned resource if no owner is identified in this scope.",
            "Re-attach or reassign to an in-scope workload before the next review cycle."
        ];
    }
}
