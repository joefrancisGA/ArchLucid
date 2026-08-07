namespace ArchLucid.Contracts.Operations;

/// <summary>Unified long-running operation projection (TB-2074).</summary>
public sealed record OperationDetail(
  string OperationId,
  OperationState State,
  string StepLabel,
  int? CurrentStep,
  int? TotalSteps,
  DateTimeOffset HeartbeatUtc,
  OperationResultRef? ResultRef);
