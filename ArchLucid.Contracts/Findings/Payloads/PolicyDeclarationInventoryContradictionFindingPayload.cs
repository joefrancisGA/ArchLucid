namespace ArchLucid.Contracts.Findings.Payloads;

public class PolicyDeclarationInventoryContradictionFindingPayload
{
    public string PolicyRuleId
    {
        get;
        set;
    } = string.Empty;

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

    public string DeclaredValue
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
    public string CloudProvider
    {
        get;
        set;
    } = string.Empty;
}
