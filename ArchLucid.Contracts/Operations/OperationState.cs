namespace ArchLucid.Contracts.Operations;

/// <summary>Unified long-running operation lifecycle for poll endpoints (TB-2074).</summary>
public enum OperationState
{
  Pending = 0,
  Running = 1,
  Succeeded = 2,
  Failed = 3,
  Canceled = 4,
  CancelRequested = 5
}
