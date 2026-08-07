namespace ArchLucid.Contracts.Operations;

/// <summary>Optional links from a unified operation to its backing run, job, or download.</summary>
public sealed record OperationResultRef(
  Guid? RunId,
  string? JobId,
  string? DownloadPath);
