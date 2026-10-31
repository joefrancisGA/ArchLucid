namespace ArchLucid.Application.SecureNow;

public sealed class SecureNowCapacityExceededException : Exception
{
    public SecureNowCapacityExceededException()
        : base("SecureNow collection capacity is currently saturated. Retry later.") { }
}
