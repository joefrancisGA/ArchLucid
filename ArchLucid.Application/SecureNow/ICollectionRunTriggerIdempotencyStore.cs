namespace ArchLucid.Application.SecureNow;

public interface ICollectionRunTriggerIdempotencyStore
{
    bool TryGet(string key, out Guid runId);

    void Set(string key, Guid runId, TimeSpan lifetime);
}
