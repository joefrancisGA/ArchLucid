namespace ArchLucid.Contracts.Findings.Payloads;

public class DeclarationInventoryContradictionFindingPayload
{
    public string ResourceLabel
    {
        get;
        set;
    } = string.Empty;

    public string DeclarationKey
    {
        get;
        set;
    } = string.Empty;

    public string DeclarationValue
    {
        get;
        set;
    } = string.Empty;

    public string InventoryValue
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Azure, Aws, or Gcp.</summary>
    public string Cloud
    {
        get;
        set;
    } = string.Empty;

    public string GraphNodeId
    {
        get;
        set;
    } = string.Empty;

    public string InventoryResourceId
    {
        get;
        set;
    } = string.Empty;
}
