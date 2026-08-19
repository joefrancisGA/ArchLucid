namespace ArchLucid.Core.Audit;

/// <summary>
///     Raised when a required durable audit write fails after bounded retries (INV-003 fail-closed path).
/// </summary>
public sealed class DurableAuditWriteFailedException : Exception
{
    public DurableAuditWriteFailedException(string operationLabel, Exception innerException)
        : base($"Durable audit write failed for '{operationLabel}' after retries.", innerException)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(operationLabel);
        ArgumentNullException.ThrowIfNull(innerException);
        OperationLabel = operationLabel;
    }

    public string OperationLabel
    {
        get;
    }
}
