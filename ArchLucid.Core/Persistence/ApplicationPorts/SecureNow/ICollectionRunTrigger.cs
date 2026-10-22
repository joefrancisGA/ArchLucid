using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

namespace ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;

public interface ICollectionRunTrigger
{
    Task<CollectionRunTriggerResult> TriggerAsync(
        ScopeContext scope,
        CollectionRunTriggerRequest request,
        CancellationToken cancellationToken = default);
}
