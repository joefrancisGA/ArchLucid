namespace ArchLucid.Contracts.Persistence.DecisionTraces;

/// <summary>Bounded prompt template reference aggregated onto authority rule-audit traces (TB-052).</summary>
public sealed class RuleAuditTracePromptRef
{
    public string TemplateId
    {
        get;
        set;
    } = string.Empty;

    public string TemplateVersion
    {
        get;
        set;
    } = string.Empty;

    public string? AgentType
    {
        get;
        set;
    }
}
