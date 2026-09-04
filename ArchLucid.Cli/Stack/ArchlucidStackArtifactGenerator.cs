using System.Text.Json;

namespace ArchLucid.Cli.Stack;

/// <summary>Emits per-root tfvars, hosted appsettings, GitHub env manifest, and Key Vault checklist from stack answers (pass-17 partial split).</summary>
internal static partial class ArchlucidStackArtifactGenerator
{
    private static readonly JsonSerializerOptions IndentedJsonOptions = new()
    {
        WriteIndented = true,
    };

    internal static ArchlucidStackGeneratedArtifacts Generate(ArchlucidStackDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        string prefix = document.Naming.ResourcePrefix.Trim();
        string environment = document.Azure.Environment.Trim();
        string location = document.Azure.Location.Trim();
        string loginServer = document.ContainerRegistry.LoginServer.Trim().TrimEnd('/');
        string imageTag = document.ContainerRegistry.ImageTag.Trim();
        string vaultName = document.KeyVault.Name.Trim();

        string privateResourceGroup = $"rg-{prefix}-private";
        string containerAppsResourceGroup = $"rg-{prefix}-ca-{environment}";
        string apiImage = $"{loginServer}/archlucid:{imageTag}";
        string uiImage = $"{loginServer}/archlucid-ui:{imageTag}";

        Dictionary<string, string> files = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraform-private.tfvars"] = BuildTerraformPrivateTfvars(document, privateResourceGroup, location),
            ["terraform-container-apps.tfvars"] = BuildTerraformContainerAppsTfvars(
                document,
                containerAppsResourceGroup,
                location,
                apiImage,
                uiImage),
            ["terraform-pilot.tfvars"] = BuildTerraformPilotTfvars(document),
            ["terraform-keyvault.tfvars"] = BuildTerraformKeyVaultTfvars(document, vaultName),
            ["appsettings.Hosted.json"] = BuildHostedAppsettingsJson(document, vaultName),
            ["github-environment-variables.json"] = BuildGitHubEnvironmentManifest(document),
            ["key-vault-secret-checklist.md"] = BuildKeyVaultChecklistMarkdown(document, vaultName),
        };

        return new ArchlucidStackGeneratedArtifacts(files);
    }
}
