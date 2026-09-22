namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Normalized policy assignment row aligned with <c>policy-assignments.json</c> companion entries.
/// </summary>
public sealed record HostedAzureArmPolicyAssignmentRecord(
    string Scope,
    string PolicyDefinitionId,
    string? Name,
    string? AssignmentId);
