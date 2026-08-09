namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Poll-delay policy for outbox drain loops: zero delay while batches keep returning work (drain
///     bursts immediately instead of waiting a fixed 2 s between batches), then an exponentially
///     stretching idle interval so quiet replicas issue far fewer SQL claim queries.
/// </summary>
public sealed class AdaptiveOutboxIdleBackoff
{
    /// <summary>First delay after the outbox comes back empty (TB-2122: was a fixed 2 s poll).</summary>
    public static readonly TimeSpan BaseIdleDelay = TimeSpan.FromSeconds(1);

    /// <summary>Ceiling for the idle delay; keeps worst-case pickup latency for new work bounded.</summary>
    public static readonly TimeSpan MaxIdleDelay = TimeSpan.FromSeconds(10);

    private readonly TimeSpan _baseIdleDelay;
    private readonly TimeSpan _maxIdleDelay;
    private TimeSpan _currentIdleDelay;

    public AdaptiveOutboxIdleBackoff(TimeSpan? baseIdleDelay = null, TimeSpan? maxIdleDelay = null)
    {
        _baseIdleDelay = baseIdleDelay ?? BaseIdleDelay;
        _maxIdleDelay = maxIdleDelay ?? MaxIdleDelay;
        _currentIdleDelay = _baseIdleDelay;
    }

    /// <summary>Returns the delay before the next poll given how many entries the last batch dequeued.</summary>
    public TimeSpan NextDelay(int dequeuedCount)
    {
        if (dequeuedCount > 0)
        {
            _currentIdleDelay = _baseIdleDelay;

            return TimeSpan.Zero;
        }

        TimeSpan delay = _currentIdleDelay;
        TimeSpan doubled = _currentIdleDelay + _currentIdleDelay;
        _currentIdleDelay = doubled > _maxIdleDelay ? _maxIdleDelay : doubled;

        return delay;
    }
}
