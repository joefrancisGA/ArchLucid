namespace ArchLucid.Contracts.Agents;

/// <summary>Post-evaluation pass that writes <c>CalibratedConfidence</c> on persisted agent results.</summary>
public interface IAgentConfidenceCalibrationService
{
    Task ApplyCalibratedConfidenceForRunAsync(string runId, CancellationToken cancellationToken = default);
}
