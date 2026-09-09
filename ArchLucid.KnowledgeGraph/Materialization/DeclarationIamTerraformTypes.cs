namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Shared IAM declaration type predicates for path materialization and blast-radius walks (DX-69, DX-74).
/// </summary>
public static class DeclarationIamTerraformTypes
{
    public static bool IsRoleAssignmentTerraformType(string? terraformType)
    {
        if (string.IsNullOrWhiteSpace(terraformType))
            return false;

        return terraformType.Contains("role_assignment", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("iam_role_policy", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("iam_policy", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("project_iam", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("iam_member", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("iam_binding", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("policy_attachment", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsRoleAssignmentResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
            return false;

        return resourceType.Contains("roleAssignments", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("iam", StringComparison.OrdinalIgnoreCase);
    }
}
