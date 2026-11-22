using ArchLucid.Contracts.Common;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory host: calibration samples are not persisted.</summary>
public sealed class NoOpAgentConfidenceCalibrationSampleRepository : IAgentConfidenceCalibrationSampleRepository
{
    public Task AppendAsync(
        AgentType agentType,
        double rawConfidence,
        double semanticScore,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AgentConfidenceCalibrationSampleRow>> GetRecentByAgentTypeAsync(
        AgentType agentType,
        int maxCount,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<AgentConfidenceCalibrationSampleRow>>([]);
    }
}
