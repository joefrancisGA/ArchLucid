namespace ArchLucid.Application.Architecture;

/// <summary>
///     Raised when architecture identity or version pinning is required but could not be completed.
/// </summary>
public sealed class ArchitecturePinningFailedException : InvalidOperationException
{
    public ArchitecturePinningFailedException(string message)
        : base(message)
    {
    }

    public ArchitecturePinningFailedException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
