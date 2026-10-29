namespace ArchLucid.Application.SecureNow;

/// <summary>
/// Process-wide waiting-admission count for collection triggers.
/// Register as a singleton so scoped <see cref="CollectionRunTriggerService"/> instances share one budget.
/// </summary>
public sealed class CollectionTriggerAdmissionCounter
{
    private int _waitingAdmissions;

    /// <summary>Atomically raise the waiting count; safe across concurrent scoped trigger calls.</summary>
    public int Increment() => Interlocked.Increment(ref _waitingAdmissions);

    /// <summary>Atomically lower the waiting count after admission, rejection, or cancellation.</summary>
    public int Decrement() => Interlocked.Decrement(ref _waitingAdmissions);
}
