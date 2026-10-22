namespace ArchLucid.AgentRuntime;

/// <summary>Resolves and enforces per-task billed completion attempt caps (TB-941).</summary>
public interface IAgentLogicalStepSpendCapPolicy
{
    int ResolveMaxBilledAttempts();

    void EnsureBilledAttemptAllowed();
}
