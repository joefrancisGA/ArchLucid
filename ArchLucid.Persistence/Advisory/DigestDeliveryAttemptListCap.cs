namespace ArchLucid.Persistence.Advisory;

/// <summary>Shared row cap for digest delivery-attempt list queries (SQL and in-memory).</summary>
internal static class DigestDeliveryAttemptListCap
{
    internal const int Value = 200;
}
