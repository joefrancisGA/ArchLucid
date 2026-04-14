namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>Result of <see cref="IAgentOutputQualityGate.Evaluate"/> for telemetry and logs (does not change persistence).</summary>
public enum AgentOutputQualityGateOutcome
{
    Accepted = 0,
    Warned = 1,
    Rejected = 2,
}
