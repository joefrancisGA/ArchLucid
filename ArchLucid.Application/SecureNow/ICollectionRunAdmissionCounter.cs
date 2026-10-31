namespace ArchLucid.Application.SecureNow;

/// <summary>
/// Process-local waiting-admission count for collection triggers.
/// Registered as a singleton so scoped <see cref="CollectionRunTriggerService"/>
/// instances share one budget (INV-014).
/// </summary>
public interface ICollectionRunAdmissionCounter
{
    int IncrementWaiting();

    int DecrementWaiting();
}
