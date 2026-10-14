namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Back-compat shim for site code deployment; see <see cref="AzureInventoryCodeDeploymentTargets" />.
/// </summary>
public static class AzureInventoryWebSiteCodeDeployment
{
    public static bool IsCodeDeploymentResourceType(string? resourceType) =>
        AzureInventoryCodeDeploymentTargets.IsCodeDeploymentResourceType(resourceType);
}
