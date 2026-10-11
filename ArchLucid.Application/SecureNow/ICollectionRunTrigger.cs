namespace ArchLucid.Application.SecureNow;

public interface ICollectionRunTrigger
{
    Task<CollectionRunTriggerResult> TriggerAsync(
        string actor,
        CancellationToken cancellationToken = default);
}
