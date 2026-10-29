namespace ArchLucid.Application.SecureNow;

/// <summary>
/// Process-wide count of callers waiting for a collection-trigger admission slot.
/// Registered as a singleton because <see cref="CollectionRunTriggerService"/> is scoped;
/// a per-request counter would not bound concurrent waiters in this process.
/// </summary>
public sealed class CollectionTriggerAdmissionCounter
{
    private int _waitingAdmissions;

    public int Current => Volatile.Read(ref _waitingAdmissions);

    public int Increment()
    {
        return Interlocked.Increment(ref _waitingAdmissions);
    }

    public int Decrement()
    {
        return Interlocked.Decrement(ref _waitingAdmissions);
    }
}
