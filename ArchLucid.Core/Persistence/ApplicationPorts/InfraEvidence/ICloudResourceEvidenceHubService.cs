using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ICloudResourceEvidenceHubService
{
    Task<CloudResourceEvidenceHubQueryResult> TryGetHubAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CloudResourceEvidenceHubQuery query,
        CancellationToken cancellationToken = default);
}

public sealed class CloudResourceEvidenceHubQueryResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public CloudResourceEvidenceHubResponse? Hub
    {
        get;
        init;
    }
}
