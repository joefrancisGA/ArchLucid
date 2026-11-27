using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Findings;

/// <summary>Maps an already-authorized cloud directory record to a stable asset key for candidate correlation.</summary>
public static class FindingCorrelationAssetKey
{
    /// <summary>
    ///     The caller must read the directory record through the authorized project and link it to the source
    ///     finding's evidence. This method checks scope consistency before using the durable ID.
    /// </summary>
    public static string? TryFromCloudResource(ProjectScopeKey? project, CloudResourceIdentityRecord? resource)
    {
        if (project is null
            || resource is null
            || resource.CloudResourceId == Guid.Empty
            || !project.Matches(resource.TenantId, resource.WorkspaceId, resource.ProjectId))
        {
            return null;
        }

        return $"cloud-resource:{resource.CloudResourceId:N}";
    }
}
