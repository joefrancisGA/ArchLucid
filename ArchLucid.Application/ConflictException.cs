namespace ArchLucid.Application;

/// <summary>
///     Thrown when an operation conflicts with current state (e.g. duplicate, wrong phase).
///     Maps to HTTP 409 in the API layer.
/// </summary>
public sealed class ConflictException : InvalidOperationException
{
    /// <summary>Creates a conflict exception with the given message (maps to HTTP 409 in the API).</summary>
    /// <param name="message">Human-readable conflict description.</param>
    public ConflictException(string message) : base(message)
    {
        ArgumentNullException.ThrowIfNull(message);
    }

    /// <summary>Creates a conflict exception with a stable machine-readable code (ProblemDetails errorCode).</summary>
    /// <param name="message">Human-readable conflict description.</param>
    /// <param name="code">Stable client branch key (for example <c>draft_cas_stale</c>).</param>
    public ConflictException(string message, string code) : base(message)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentException.ThrowIfNullOrWhiteSpace(code);
        Code = code.Trim();
    }

    /// <summary>Creates a conflict exception with an inner cause.</summary>
    /// <param name="message">Human-readable conflict description.</param>
    /// <param name="innerException">Underlying exception.</param>
    public ConflictException(string message, Exception innerException) : base(message, innerException)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentNullException.ThrowIfNull(innerException);
    }

    /// <summary>Optional ProblemDetails <c>errorCode</c> so clients can branch without parsing messages.</summary>
    public string? Code { get; }
}

