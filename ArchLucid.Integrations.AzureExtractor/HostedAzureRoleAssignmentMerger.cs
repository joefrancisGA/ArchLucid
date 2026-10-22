namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Merges standing RBAC rows with PIM eligibility schedule rows for companion JSON output.
/// </summary>
internal static class HostedAzureRoleAssignmentMerger
{
    public static IReadOnlyList<HostedAzureArmRoleAssignmentRecord> Merge(
        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> standingAssignments,
        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> eligibleAssignments)
    {
        ArgumentNullException.ThrowIfNull(standingAssignments);
        ArgumentNullException.ThrowIfNull(eligibleAssignments);

        Dictionary<string, HostedAzureArmRoleAssignmentRecord> merged =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmRoleAssignmentRecord assignment in eligibleAssignments)
        {
            merged[BuildKey(assignment)] = assignment;
        }

        foreach (HostedAzureArmRoleAssignmentRecord assignment in standingAssignments)
        {
            merged[BuildKey(assignment)] = assignment;
        }

        return merged.Values.ToList();
    }

    private static string BuildKey(HostedAzureArmRoleAssignmentRecord assignment) =>
        $"{assignment.Scope}|{assignment.PrincipalId}|{assignment.RoleDefinitionId}";
}
