namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     App Service and Function Apps are both <c>Microsoft.Web/sites</c>. Deploying code there
///     lets the deployer act as the site's managed identity (book Ch. 4 §4.5, Ch. 5 §5.3).
/// </summary>
public static class AzureInventoryWebSiteCodeDeployment
{
    public static bool IsCodeDeploymentResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.Web/sites/slots", StringComparison.OrdinalIgnoreCase);
    }
}
