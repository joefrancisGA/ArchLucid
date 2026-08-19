using ArchLucid.Contracts.Common;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Append-only store of (raw confidence, semantic score) pairs for calibration fitting.</summary>
public interface IAgentConfidenceCalibrationSampleRepository
{
    Task AppendAsync(
        AgentType agentType,
        double rawConfidence,
        double semanticScore,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AgentConfidenceCalibrationSampleRow>> GetRecentByAgentTypeAsync(
        AgentType agentType,
        int maxCount,
        CancellationToken cancellationToken = default);
}

/// <summary>Historical pair used to fit per-agent confidence calibration.</summary>
public sealed class AgentConfidenceCalibrationSampleRow
{
    public double RawConfidence
    {
        get;
        init;
    }

    public double SemanticScore
    {
        get;
        init;
    }
}
