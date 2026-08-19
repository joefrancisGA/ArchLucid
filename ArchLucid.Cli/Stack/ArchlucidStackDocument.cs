namespace ArchLucid.Cli.Stack;

/// <summary>TB-654 stack answers document (see <c>deploy/archlucid.stack.schema.json</c>).</summary>
internal sealed class ArchlucidStackDocument
{
    public int SchemaVersion { get; set; } = 1;

    public ArchlucidStackAzureSection Azure { get; set; } = new();

    public ArchlucidStackNamingSection Naming { get; set; } = new();

    public ArchlucidStackContainerRegistrySection ContainerRegistry { get; set; } = new();

    public ArchlucidStackPublicSiteSection PublicSite { get; set; } = new();

    public ArchlucidStackKeyVaultSection KeyVault { get; set; } = new();

    public ArchlucidStackDeploymentSection Deployment { get; set; } = new();

    public ArchlucidStackOpenAiSection? OpenAi { get; set; }

    public ArchlucidStackSearchSection? Search { get; set; }
}
