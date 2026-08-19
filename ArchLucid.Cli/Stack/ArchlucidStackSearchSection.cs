namespace ArchLucid.Cli.Stack;

internal sealed class ArchlucidStackSearchSection
{
    public string ComposeMode { get; set; } = "existing";

    public string? ExistingEndpoint { get; set; }

    public string? IndexName { get; set; }
}
