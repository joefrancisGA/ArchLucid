using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Compliance;

public class ComplianceRulePack
{
    public string RulePackId
    {
        get;
        set;
    } = null!;

    public string Name
    {
        get;
        set;
    } = null!;

    private string version = string.Empty;

    public string Version
    {
        get => version;
        set => version = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public string RulePackHash
    {
        get;
        set;
    } = null!;

    public string SourcePath
    {
        get;
        set;
    } = null!;

    private List<ComplianceRule> rules = [];

    public List<ComplianceRule> Rules
    {
        get => rules;
        set => rules = ContractCollectionDefaults.Coalesce(value);
    }
}
