namespace ArchLucid.Cli.Stack;

internal sealed class ArchlucidStackOpenAiSection
{
    public string ComposeMode { get; set; } = "existing";

    public string? ExistingEndpoint { get; set; }

    public string? ChatDeploymentName { get; set; }

    public string? EconomyDeploymentName { get; set; }

    public string? PremiumDeploymentName { get; set; }

    public string? EmbeddingDeploymentName { get; set; }
}
