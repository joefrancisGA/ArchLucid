namespace ArchLucid.Application.Traceability;

/// <summary>Thrown when a traceability ZIP would exceed the configured byte cap.</summary>
public sealed class TraceabilityBundleTooLargeException(long attemptedBytes, long maxBytes)
    : InvalidOperationException($"Traceability bundle size {attemptedBytes} exceeds cap {maxBytes}.")
{
    public long AttemptedBytes
    {
        get;
    } = attemptedBytes;

    public long MaxBytes
    {
        get;
    } = maxBytes;
}
