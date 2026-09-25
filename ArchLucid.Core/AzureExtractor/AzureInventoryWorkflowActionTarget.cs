namespace ArchLucid.Core.AzureExtractor;

/// <summary>Resolvable workflow action target (NR-01).</summary>
public sealed class AzureInventoryWorkflowActionTarget
{
    public string ActionName
    {
        get;
        init;
    } = string.Empty;

    public string TargetArmId
    {
        get;
        init;
    } = string.Empty;
}
