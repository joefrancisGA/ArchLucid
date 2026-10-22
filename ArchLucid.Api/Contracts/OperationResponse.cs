using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Operations;

namespace ArchLucid.Api.Contracts;

/// <summary>Unified long-running operation projection for poll endpoints (TB-2074).</summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public sealed class OperationResponse
{
  public string OperationId
  {
    get;
    set;
  } = null!;

  public OperationState State
  {
    get;
    set;
  }

  public string StepLabel
  {
    get;
    set;
  } = null!;

  public int? CurrentStep
  {
    get;
    set;
  }

  public int? TotalSteps
  {
    get;
    set;
  }

  public DateTimeOffset HeartbeatUtc
  {
    get;
    set;
  }

  public OperationResultRefResponse? ResultRef
  {
    get;
    set;
  }
}
