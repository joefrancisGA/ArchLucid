namespace ArchiForge.Application;

/// <summary>
/// Thrown when an operation conflicts with current state (e.g. duplicate, wrong phase).
/// Maps to HTTP 409 in the API layer.
/// </summary>
public sealed class ConflictException : InvalidOperationException
{
    public ConflictException(string message)
        : base(message)
    {
    }

    public ConflictException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
