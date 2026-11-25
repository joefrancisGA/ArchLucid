using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Compliance;

public class ComplianceRulePack
{
    private string rulePackId = string.Empty;

    public string RulePackId
    {
        get => rulePackId;
        set => rulePackId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string name = string.Empty;

    public string Name
    {
        get => name;
        set => name = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string version = string.Empty;

    public string Version
    {
        get => version;
        set => version = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string rulePackHash = string.Empty;

    public string RulePackHash
    {
        get => rulePackHash;
        set => rulePackHash = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string sourcePath = string.Empty;

    public string SourcePath
    {
        get => sourcePath;
        set => sourcePath = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private List<ComplianceRule> rules = [];

    public List<ComplianceRule> Rules
    {
        get => rules;
        set => rules = ContractCollectionDefaults.Coalesce(value);
    }
}