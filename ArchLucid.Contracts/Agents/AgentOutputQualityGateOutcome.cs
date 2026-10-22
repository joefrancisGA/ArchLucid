namespace ArchLucid.Contracts.Agents;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>
///     Result of <see cref="IAgentOutputQualityGate.Evaluate" /> for telemetry, HTTP summaries, and logs (does not change
///     persistence).
/// </summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<AgentOutputQualityGateOutcome>))]
public enum AgentOutputQualityGateOutcome
{
    Accepted = 0,
    Warned = 1,
    Rejected = 2,
}
