namespace ArchLucid.Application.Findings;

/// <summary>
///     Deterministic remediation branches for orphaned GCP resource findings (explainability only; TB-2218).
/// </summary>
public static class OrphanedGcpResourceExplainabilityAlternatives
{
    public static IReadOnlyList<string> ResolveForResourceType(string resourceType)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceType);

        if (resourceType.Equals("compute.googleapis.com/Disk", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("compute#disk", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                "Attach the disk to a Compute Engine VM that needs expanded storage.",
                "Snapshot and delete if the disk is abandoned inventory.",
                "Restore from snapshot onto a replacement VM if the original host was decommissioned."
            ];
        }

        if (resourceType.Equals("compute.googleapis.com/Address", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("compute#address", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                "Assign the static IP to a load balancer or VM that requires ingress.",
                "Release the address if no inbound path is required for this scope.",
                "Reassign to a standby VM that still needs static ingress."
            ];
        }

        return
        [
            "Delete the orphaned resource if no owner is identified in this scope.",
            "Re-attach or reassign to an in-scope workload before the next review cycle."
        ];
    }
}
