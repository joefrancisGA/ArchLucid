using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings.Payloads;

public class ComplianceFindingPayload
{
    public string RulePackId
    {
        get;
        set;
    } = null!;

    public string RulePackVersion
    {
        get;
        set;
    } = null!;

    public string RuleId
    {
        get;
        set;
    } = null!;

    public string ControlId
    {
        get;
        set;
    } = null!;

    public string ControlName
    {
        get;
        set;
    } = null!;

    public string AppliesToCategory
    {
        get;
        set;
    } = null!;

    private List<string> affectedResources = [];

    public List<string> AffectedResources
    {
        get => affectedResources;
        set => affectedResources = ContractCollectionDefaults.Coalesce(value);
    }
}
