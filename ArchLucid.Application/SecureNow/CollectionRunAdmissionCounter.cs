namespace ArchLucid.Application.SecureNow;

/// <inheritdoc cref="ICollectionRunAdmissionCounter" />
public sealed class CollectionRunAdmissionCounter : ICollectionRunAdmissionCounter
{
    // Instance field on a singleton — not a static — so ARCH005 / INV-014 stay satisfied
    // while every scoped CollectionRunTriggerService still shares one wait budget.
    private int waitingAdmissions;

    public int IncrementWaiting() => Interlocked.Increment(ref waitingAdmissions);

    public int DecrementWaiting() => Interlocked.Decrement(ref waitingAdmissions);
}
