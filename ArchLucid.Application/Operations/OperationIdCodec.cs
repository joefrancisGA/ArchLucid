namespace ArchLucid.Application.Operations;

/// <summary>Encodes opaque tenant-scoped operation ids without a third persistence store (TB-2074).</summary>
public static class OperationIdCodec
{
  public const string JobPrefix = "job:";

  public const string RunPrefix = "run:";

  public const string DraftPrefix = "draft:";

  public static string ForJob(string jobId)
  {
    ArgumentException.ThrowIfNullOrWhiteSpace(jobId);

    return JobPrefix + jobId;
  }

  public static string ForRun(Guid runId) => RunPrefix + runId.ToString("D");

  public static string ForDraft(Guid operationId) => DraftPrefix + operationId.ToString("D");

  public static bool TryParse(string operationId, out OperationIdKind kind, out string payload)
  {
    kind = default;
    payload = string.Empty;

    if (string.IsNullOrWhiteSpace(operationId))
      return false;

    if (operationId.StartsWith(JobPrefix, StringComparison.Ordinal))
    {
      payload = operationId[JobPrefix.Length..];

      if (string.IsNullOrWhiteSpace(payload))
        return false;

      kind = OperationIdKind.Job;

      return true;
    }

    if (operationId.StartsWith(RunPrefix, StringComparison.Ordinal))
    {
      payload = operationId[RunPrefix.Length..];

      if (string.IsNullOrWhiteSpace(payload))
        return false;

      kind = OperationIdKind.Run;

      return true;
    }

    if (operationId.StartsWith(DraftPrefix, StringComparison.Ordinal))
    {
      payload = operationId[DraftPrefix.Length..];

      if (string.IsNullOrWhiteSpace(payload))
        return false;

      kind = OperationIdKind.Draft;

      return true;
    }

    return false;
  }
}
