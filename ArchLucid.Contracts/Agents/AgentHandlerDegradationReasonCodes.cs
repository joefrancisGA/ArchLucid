namespace ArchLucid.Contracts.Agents;

/// <summary>Low-cardinality degradation reasons for non-Critic handler resilience fallbacks.</summary>
public static class AgentHandlerDegradationReasonCodes
{
    public const string HandlerTimeout = "handler_timeout";

    public const string CircuitOpen = "circuit_open";

    public const string ResilienceFailure = "resilience_failure";
}
