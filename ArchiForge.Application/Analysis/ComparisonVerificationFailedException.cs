namespace ArchiForge.Application.Analysis;

/// <summary>
/// Thrown when replay mode is <see cref="ComparisonReplayMode.Verify"/> and the
/// regenerated comparison does not match the stored payload (engine or architecture drift).
/// </summary>
public sealed class ComparisonVerificationFailedException : InvalidOperationException
{
    public ComparisonVerificationFailedException(string message)
        : base(message)
    {
    }

    public ComparisonVerificationFailedException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
