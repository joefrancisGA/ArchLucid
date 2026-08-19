using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>Optional links from a unified operation to its backing run, job, or download.</summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public sealed class OperationResultRefResponse
{
  public Guid? RunId
  {
    get;
    set;
  }

  public string? JobId
  {
    get;
    set;
  }

  public string? DownloadPath
  {
    get;
    set;
  }
}
