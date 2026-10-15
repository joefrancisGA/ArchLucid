using ArchLucid.Contracts.Governance;

namespace ArchLucid.Contracts.Governance;

/// <summary>Governance findings queue: risk and decision registers from one scoped read.</summary>
public sealed class GovernanceFindingsRegistersBundleResponse
{
    private ArchitectureRiskRegisterResponse riskRegister = new();

    public ArchitectureRiskRegisterResponse RiskRegister
    {
        get => riskRegister;
        init => riskRegister = value ?? new();
    }

    private ArchitectureDecisionRegisterResponse decisionRegister = new();

    public ArchitectureDecisionRegisterResponse DecisionRegister
    {
        get => decisionRegister;
        init => decisionRegister = value ?? new();
    }
}
