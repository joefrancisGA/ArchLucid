using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Compliance;

public class ComplianceRule
{
    private string ruleId = string.Empty;

    public string RuleId
    {
        get => ruleId;
        set => ruleId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string controlId = string.Empty;

    public string ControlId
    {
        get => controlId;
        set => controlId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string controlName = string.Empty;

    public string ControlName
    {
        get => controlName;
        set => controlName = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string appliesToCategory = string.Empty;

    public string AppliesToCategory
    {
        get => appliesToCategory;
        set => appliesToCategory = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string requiredNodeType = string.Empty;

    public string RequiredNodeType
    {
        get => requiredNodeType;
        set => requiredNodeType = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string requiredEdgeType = string.Empty;

    public string RequiredEdgeType
    {
        get => requiredEdgeType;
        set => requiredEdgeType = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string severity = "Warning";

    public string Severity
    {
        get => severity;
        set => severity = ContractCollectionDefaults.CoalesceStringDefault(value, "Warning");
    }

    private string priority = "P1";

    public string Priority
    {
        get => priority;
        set => priority = ContractCollectionDefaults.CoalesceStringDefault(value, "P1");
    }

    private string description = string.Empty;

    public string Description
    {
        get => description;
        set => description = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>Optional run-context gates. Null or empty means the rule always applies after governance filtering.</summary>
    public ComplianceRuleApplicabilityConditions? Applicability
    {
        get;
        set;
    }
}