namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Compute resources where Contributor/Owner can change runnable code and act as the attached identity (book Ch. 4 §4.3).
/// </summary>
public static class AzureInventoryCodeDeploymentTargets
{
    public static bool IsCodeDeploymentResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.Web/sites/slots", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.Compute/virtualMachines", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.Automation/automationAccounts", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.Logic/workflows", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase);
    }

    public static bool TryGetCodeDeploymentInferenceQualifier(string? resourceType, out string qualifier)
    {
        qualifier = string.Empty;

        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        if (resourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.Web/sites/slots", StringComparison.OrdinalIgnoreCase))
        {
            qualifier = "site-code-deploy";

            return true;
        }

        if (resourceType.Equals("Microsoft.Compute/virtualMachines", StringComparison.OrdinalIgnoreCase))
        {
            qualifier = "vm-run-command";

            return true;
        }

        if (resourceType.Equals("Microsoft.Automation/automationAccounts", StringComparison.OrdinalIgnoreCase))
        {
            qualifier = "automation-runbook";

            return true;
        }

        if (resourceType.Equals("Microsoft.Logic/workflows", StringComparison.OrdinalIgnoreCase))
        {
            qualifier = "logic-app-workflow";

            return true;
        }

        if (resourceType.Equals("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase))
        {
            qualifier = "container-app-revision";

            return true;
        }

        return false;
    }
}
