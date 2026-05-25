namespace ArchLucid.Application.Findings;

/// <summary>
///     Deterministic remediation branches for orphaned Azure resource findings (explainability only; no severity change).
/// </summary>
public static class OrphanedAzureResourceExplainabilityAlternatives
{
    public static IReadOnlyList<string> ResolveForResourceType(string resourceType)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceType);

        if (resourceType.Equals("Microsoft.Compute/disks", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                "Attach the disk to an existing VM that needs expanded storage.",
                "Snapshot and delete if the disk is abandoned inventory.",
                "Migrate data to a replacement VM if the original host was decommissioned."
            ];
        }

        if (resourceType.Equals("Microsoft.Network/networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                "Attach the NIC to a VM that requires this network profile.",
                "Delete the NIC if it is leftover from scale-in or VM deletion.",
                "Reuse the NIC when rebuilding a replacement VM with the same subnet."
            ];
        }

        if (resourceType.Equals("Microsoft.Network/publicIPAddresses", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                "Associate the public IP with a load balancer or NAT gateway front end.",
                "Release the address if no inbound path is required for this scope.",
                "Reassign to a standby VM or appliance that still needs static ingress."
            ];
        }

        return
        [
            "Delete the orphaned resource if no owner is identified in this scope.",
            "Re-attach or reassign to an in-scope workload before the next review cycle."
        ];
    }
}
