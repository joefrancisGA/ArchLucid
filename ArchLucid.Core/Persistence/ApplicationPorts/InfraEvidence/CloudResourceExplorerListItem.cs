using ArchLucid.Contracts.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class CloudResourceExplorerListItem
{
    public CloudResourceIdentityRecord Identity
    {
        get;
        init;
    } = null!;

    public CloudResourceExplorerWorkCounts WorkCounts
    {
        get;
        init;
    } = new();
}
