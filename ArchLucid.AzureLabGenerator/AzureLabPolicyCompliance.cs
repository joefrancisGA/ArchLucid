namespace ArchLucid.AzureLabGenerator;

public sealed record AzureLabPolicyCompliance(
    AzureLabPolicySummary Summary,
    IReadOnlyList<AzureLabPolicyState> States);
