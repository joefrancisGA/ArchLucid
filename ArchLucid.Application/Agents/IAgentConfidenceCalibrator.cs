using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Agents;

/// <summary>
///     Maps raw model-reported confidence to a score aligned with historical semantic evaluation outcomes.
/// </summary>
public interface IAgentConfidenceCalibrator
{
    Task<double> CalibrateAsync(AgentType agentType, double rawConfidence, CancellationToken cancellationToken = default);
}
