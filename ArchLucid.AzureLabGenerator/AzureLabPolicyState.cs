namespace ArchLucid.AzureLabGenerator;

public sealed record AzureLabPolicyState(
    string ResourceId,
    string PolicyDefinitionName,
    string ComplianceState);
