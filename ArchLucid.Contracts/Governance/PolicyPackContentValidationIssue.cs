namespace ArchLucid.Contracts.Governance;

/// <summary>One schema, structural, or rule-key validation finding for policy pack content JSON.</summary>
public sealed class PolicyPackContentValidationIssue
{
    public PolicyPackContentValidationIssueKind Kind
    {
        get;
        set;
    }

    public string Message
    {
        get;
        set;
    } = string.Empty;

    /// <summary>JSON path or property name when available (e.g. <c>complianceRuleKeys</c>).</summary>
    public string? Path
    {
        get;
        set;
    }
}
