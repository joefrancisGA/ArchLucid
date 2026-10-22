namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Signals single-flight waiters to retry after the leader canceled without producing a shared result.
/// </summary>
internal sealed class ReviewCacheSingleFlightLeaderAbortedException : Exception
{
    public ReviewCacheSingleFlightLeaderAbortedException()
        : base("Closed-loop review cache single-flight leader aborted.")
    {
    }
}
