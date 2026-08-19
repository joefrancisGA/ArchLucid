namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Raised when a tenant-scoped SQL request would open the control-plane catalog instead of an isolated tenant catalog.
/// </summary>
public sealed class TenantIsolationException : InvalidOperationException
{
    public TenantIsolationException(string message)
        : base(message)
    {
    }

    public TenantIsolationException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
