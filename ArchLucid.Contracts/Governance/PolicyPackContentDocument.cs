using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Declarative governance payload stored in policy pack version <c>ContentJson</c> and produced as the merged
///     output of effective governance resolution.
/// </summary>
/// <remarks>
///     JSON property names are camelCase via attributes. Dictionary keys use ordinal-ignore-case comparers in memory.
///     Consumed by governance filters, advisory scans, and alert evaluators.
/// </remarks>
public class PolicyPackContentDocument
{
    /// <summary>Compliance rules selected by persisted compliance rule id (GUID).</summary>
    private List<Guid> complianceRuleIds = [];

    [JsonPropertyName("complianceRuleIds")]
    public List<Guid> ComplianceRuleIds
    {
        get => complianceRuleIds;
        set => complianceRuleIds = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>
    ///     String rule IDs matching file-based rule packs (e.g. <c>network-must-have-security-baseline</c>).
    /// </summary>
    private List<string> complianceRuleKeys = [];

    [JsonPropertyName("complianceRuleKeys")]
    public List<string> ComplianceRuleKeys
    {
        get => complianceRuleKeys;
        set => complianceRuleKeys = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>When non-empty, alert evaluation is restricted to these simple alert rules.</summary>
    private List<Guid> alertRuleIds = [];

    [JsonPropertyName("alertRuleIds")]
    public List<Guid> AlertRuleIds
    {
        get => alertRuleIds;
        set => alertRuleIds = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>When non-empty, restricts composite alert evaluation to these rule ids.</summary>
    private List<Guid> compositeAlertRuleIds = [];

    [JsonPropertyName("compositeAlertRuleIds")]
    public List<Guid> CompositeAlertRuleIds
    {
        get => compositeAlertRuleIds;
        set => compositeAlertRuleIds = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Key/value defaults merged into advisory improvement plans (string values).</summary>
    private Dictionary<string, string> advisoryDefaults = new(StringComparer.OrdinalIgnoreCase);

    [JsonPropertyName("advisoryDefaults")]
    public Dictionary<string, string> AdvisoryDefaults
    {
        get => advisoryDefaults;
        set => advisoryDefaults = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }

    /// <summary>Opaque key/value metadata merged with precedence during resolution (operator / integration hooks).</summary>
    private Dictionary<string, string> metadata = new(StringComparer.OrdinalIgnoreCase);

    [JsonPropertyName("metadata")]
    public Dictionary<string, string> Metadata
    {
        get => metadata;
        set => metadata = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }

    /// <summary>
    ///     Elicitation questions owned by this pack (ADR 0051 / R8).
    ///     Each question carries the <c>complianceRuleKeys</c> it informs, its tier (MUST/SHOULD),
    ///     and the expected answer kind.  Optional — existing packs without questions deserialize
    ///     to an empty list; no migration is required.
    /// </summary>
    private List<ElicitationQuestion> elicitationQuestions = [];

    [JsonPropertyName("elicitationQuestions")]
    public List<ElicitationQuestion> ElicitationQuestions
    {
        get => elicitationQuestions;
        set => elicitationQuestions = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Engine types that must succeed when this pack is enabled (wave-4 suggestion 33).</summary>
    private List<string> requiredEngineTypes = [];

    [JsonPropertyName("requiredEngineTypes")]
    public List<string> RequiredEngineTypes
    {
        get => requiredEngineTypes;
        set => requiredEngineTypes = ContractCollectionDefaults.Coalesce(value);
    }
}
