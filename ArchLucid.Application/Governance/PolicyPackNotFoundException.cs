namespace ArchLucid.Application.Governance;

/// <summary>Thrown when a policy pack id is missing or not visible in the caller's tenant/workspace/project scope.</summary>
public sealed class PolicyPackNotFoundException(Guid policyPackId)
    : Exception($"Policy pack '{policyPackId:D}' was not found in the current scope.")
{
    public Guid PolicyPackId { get; } = policyPackId;
}
