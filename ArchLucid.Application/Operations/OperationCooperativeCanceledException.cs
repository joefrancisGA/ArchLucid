namespace ArchLucid.Application.Operations;

/// <summary>Raised when cooperative operation cancel stops further agent stages (TB-2076).</summary>
public sealed class OperationCooperativeCanceledException(string runId) : OperationCanceledException(
    $"Operation for run '{runId}' was canceled cooperatively.")
{
    public string RunId { get; } = runId;
}
