using ArchLucid.Contracts.Governance;

namespace ArchLucid.Contracts.Governance;

/// <summary>Governance findings queue: risk and decision registers from one scoped read.</summary>
public sealed class GovernanceFindingsRegistersBundleResponse
{
    public ArchitectureRiskRegisterResponse RiskRegister
    {
        get;
        init;
    } = new();

    public ArchitectureDecisionRegisterResponse DecisionRegister
    {
        get;
        init;
    } = new();
}
