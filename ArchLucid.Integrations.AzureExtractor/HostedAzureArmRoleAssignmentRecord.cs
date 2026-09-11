namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Normalized RBAC row aligned with <c>role-assignments.json</c> companion entries.
/// </summary>
public sealed record HostedAzureArmRoleAssignmentRecord(
    string Scope,
    string PrincipalId,
    string? PrincipalType,
    string RoleDefinitionId,
    string PimEligibilityKind = "standing");
