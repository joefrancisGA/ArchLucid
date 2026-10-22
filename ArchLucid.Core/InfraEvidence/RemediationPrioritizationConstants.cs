namespace ArchLucid.Core.InfraEvidence;

/// <summary>IE-15 defaults — suggestions only; custom positive sizes are allowed.</summary>
public static class RemediationPrioritizationConstants
{
    public const string RuleVersion = "IE15-priority-v1";

    public static readonly IReadOnlyList<int> SuggestedWaveSizes = [1, 5, 25, 100, 500];
}
