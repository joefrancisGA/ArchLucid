namespace ArchLucid.Cli.Stack;

internal sealed class ArchlucidStackAzureSection
{
    public string SubscriptionId { get; set; } = string.Empty;

    public string TenantId { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public string Environment { get; set; } = string.Empty;
}
