namespace ArchLucid.Persistence.Models;

/// <summary>Scalar metrics written to <c>dbo.RunTelemetry</c> at successful authority commit.</summary>
public sealed record RunCommitTelemetryWriteRequest(
    Guid RunId,
    long RequestDurationMs,
    long AgentExecutionDurationMs,
    long ManualReviewDurationMs,
    decimal EstimatedHoursSaved);
