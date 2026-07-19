using ArchLucid.Contracts.Admin;

namespace ArchLucid.Core.Admin;

/// <summary>Builds the internal deployment-status snapshot for authorized operators.</summary>
public interface IAdminDeploymentStatusQuery
{
    Task<AdminDeploymentStatusResponse> GetAsync(
        string? frontendBuildId,
        CancellationToken cancellationToken);
}
